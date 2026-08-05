// End-to-end check of the two new features in a real browser.
//
// The rating maths is verified headlessly by tools/test-rating.js. What that
// cannot check is the part that only exists in a browser: whether the song
// search actually drives the generator, and whether the offline render - the
// thing that makes it possible to MEASURE the program's own output instead
// of only listening to it - produces real audio through the full Web Audio
// graph.
//
// Run: node tools/test-ui.js
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  let failures = 0;
  const check = (name, ok, detail) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
    if (!ok) failures++;
  };

  // The environment ships a Chromium that may not match this Playwright
  // build's expected revision, so point at it explicitly rather than trying
  // to download one.
  const fs = require("fs");
  const candidates = [
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    ...fs.existsSync("/opt/pw-browsers")
      ? fs.readdirSync("/opt/pw-browsers")
          .filter((d) => d.startsWith("chromium-"))
          .map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
      : [],
  ];
  const executablePath = candidates.find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(400);

  console.log("\n1. The launcher tabs");
  // Exactly one panel visible at a time, and the genre grid is the default -
  // it is the entry point most people want, and it used to be buried under
  // three walls of text.
  const visiblePanels = await page.$$eval(".launcher-panel", (ps) =>
    ps.filter((p) => !p.hidden).map((p) => p.dataset.panel));
  check("one launcher panel is shown at a time", visiblePanels.length === 1, visiblePanels.join(","));
  check("genres are the default panel", visiblePanels[0] === "genre", visiblePanels[0]);
  const styleCards = await page.$$eval("#style-select .style-card, #style-select button", (c) => c.length);
  check("the genre grid is populated", styleCards >= 19, `${styleCards} cards`);

  for (const t of ["describe", "artist", "song", "track", "mystyle", "genre"]) {
    await page.click(`.launcher-tab[data-tab="${t}"]`);
    const shown = await page.$$eval(".launcher-panel", (ps) =>
      ps.filter((p) => !p.hidden).map((p) => p.dataset.panel));
    check(`the "${t}" tab shows only its own panel`,
      shown.length === 1 && shown[0] === t, shown.join(","));
  }

  console.log("\n2. Song search");
  await page.click('.launcher-tab[data-tab="song"]');
  await page.fill("#song-search", "seven nation army");
  await page.waitForTimeout(150);
  const results = await page.$$eval("#song-results li", (ls) => ls.map((l) => l.textContent));
  check("search finds the record", results.length > 0 && /Seven Nation Army/.test(results[0]), results[0] || "no results");

  await page.click("#song-results li:first-child button");
  await page.waitForTimeout(100);
  const href = await page.getAttribute("#song-youtube", "href");
  check("a YouTube link is produced", /youtube\.com\/results\?search_query=/.test(href || ""), href);
  const credit = await page.textContent("#song-result");
  check("the panel says no audio is used", /contains no audio/i.test(credit || ""), (credit || "").slice(0, 70) + "…");

  // A song not in the catalogue must still produce a link.
  await page.fill("#song-search", "zzzz not a real song zzzz");
  await page.waitForTimeout(150);
  const href2 = await page.getAttribute("#song-youtube", "href");
  check("an unknown song still gets a link", /youtube\.com\/results/.test(href2 || ""), href2);

  console.log("\n3. Building the beat from the song");
  await page.fill("#song-search", "seven nation army");
  await page.waitForTimeout(150);
  await page.click("#song-results li:first-child button");
  await page.click("#song-build");
  await page.waitForTimeout(1200);
  const tempo = await page.inputValue("#tempo-slider");
  check("tempo matches the record", Number(tempo) === 124, `${tempo} BPM (expected 124)`);
  const key = await page.inputValue("#key-select");
  check("key matches the record", /^E/.test(key || ""), `key ${key}`);
  const workspaceVisible = await page.isVisible("#workspace");
  check("the workspace opened with a beat", workspaceVisible);

  console.log("\n4. Offline render and scoring");
  await page.click('.tools-tab[data-tool="score"]');
  await page.click("#score-btn");
  await page.waitForSelector("#score-panel:not([hidden])", { timeout: 45000 });
  await page.waitForFunction(() => {
    const s = document.getElementById("score-status");
    return s && s.textContent === "";
  }, { timeout: 45000 });

  const score = await page.textContent("#score-value");
  const source = await page.textContent("#score-source");
  const verdict = await page.textContent("#score-verdict");
  const termCount = await page.$$eval(".score-term", (t) => t.length);
  console.log(`    score ${score} — ${verdict}`);
  console.log(`    ${source}`);
  check("a numeric score came back", Number(score) > 0 && Number(score) <= 100, score);
  check("the offline render actually happened",
    /rendered offline/.test(source || ""), source);
  check("both halves contributed terms", termCount >= 17, `${termCount} terms shown`);

  // The whole point of rendering is that it measures real audio. If the
  // buffer were silent, loudness would bottom out and the check above would
  // still pass, so verify the render carries signal.
  const rms = await page.evaluate(async () => {
    const b = await engine.renderOffline({ loops: 1 });
    if (!b) return null;
    const d = b.getChannelData(0);
    let s = 0;
    for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    return Math.sqrt(s / d.length);
  });
  check("the rendered buffer contains real audio", rms !== null && rms > 0.005,
    rms === null ? "no buffer" : `RMS ${rms.toFixed(4)}`);

  const detail = await page.$$eval(".score-term-detail", (t) => t.map((x) => x.textContent).filter(Boolean));
  check("mix measurements are reported", detail.some((d) => /LUFS/.test(d)),
    detail.find((d) => /LUFS/.test(d)) || detail.slice(0, 3).join(" | "));

  console.log("\n5. Tools tabs and the space shortcut");
  const toolPanels = await page.$$eval("[data-tool-panel]", (ps) =>
    ps.filter((p) => !p.hidden).map((p) => p.dataset.toolPanel));
  check("one tools panel at a time", toolPanels.length === 1, toolPanels.join(","));
  for (const t of ["taste", "chords", "sound", "samples", "export"]) {
    await page.click(`.tools-tab[data-tool="${t}"]`);
    const shown = await page.$$eval("[data-tool-panel]", (ps) =>
      ps.filter((p) => !p.hidden).map((p) => p.dataset.toolPanel));
    check(`the "${t}" tool tab works`, shown.length === 1 && shown[0] === t, shown.join(","));
  }
  // Space toggles playback, and must not do so while typing.
  await page.click("body");
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  const playing = await page.evaluate(() => engine.isPlaying);
  check("space starts playback", playing === true, `isPlaying ${playing}`);
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  check("space stops it again", (await page.evaluate(() => engine.isPlaying)) === false);
  await page.click('.tools-tab[data-tool="chords"]');
  await page.click("#chord-input");
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  check("space does not play while typing in a field",
    (await page.evaluate(() => engine.isPlaying)) === false);

  console.log("\n6. The sample editor");
  await page.click('.tools-tab[data-tool="samples"]');
  const ed = await page.evaluate(async () => {
    const SR = 44100;
    const c = new OfflineAudioContext(1, SR * 2, SR);
    const b = c.createBuffer(1, SR * 2, SR);
    const d = b.getChannelData(0);
    // Four bursts at four pitches, so a selection that grabs the third one
    // can be checked against a known answer.
    [0.1, 0.6, 1.1, 1.6].forEach((t0, i) => {
      const f = [220, 330, 440, 550][i];
      const st = Math.floor(t0 * SR);
      for (let k = 0; k < SR * 0.25; k++) {
        d[st + k] = Math.exp(-(k / SR) * 12) * Math.sin(2 * Math.PI * f * (k / SR)) * 0.8;
      }
    });
    const item = SampleBank.add("editor-test.wav", b, { mode: "oneshot" });
    refreshSampleList();
    openInEditor(item.id);
    const opened = !document.getElementById("sample-editor").hidden;
    const onsets = editing ? editing.onsets.length : 0;

    // Select the third burst (1.1s-1.35s) and send it to the kick.
    selStart = 1.1; selEnd = 1.35;
    drawWave();
    const selText = document.getElementById("sample-sel").textContent;
    document.getElementById("sample-track").value = "kick";
    document.getElementById("sample-mode").value = "oneshot";
    document.getElementById("sample-apply").click();

    const kickFlavor = currentFlavors.kick;
    const made = SampleBank.resolve(kickFlavor);
    // The extracted region must be the LENGTH that was selected, and must
    // contain the pitch that was in that region - not the whole file.
    let hz = 0;
    if (made) {
      const s2 = made.buffer.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < s2.length; i++) peak = Math.max(peak, Math.abs(s2[i]));
      let lo = -1, hi = -1;
      for (let i = 0; i < s2.length; i++) if (Math.abs(s2[i]) > peak * 0.15) { if (lo < 0) lo = i; hi = i; }
      let zc = 0;
      for (let i = lo + 1; i <= hi; i++) if ((s2[i] >= 0) !== (s2[i - 1] >= 0)) zc++;
      hz = hi > lo ? zc / 2 / ((hi - lo) / SR) : 0;
    }
    const out = {
      opened, onsets, selText,
      madeLen: made ? +made.buffer.duration.toFixed(3) : 0,
      hz: Math.round(hz),
      isSample: !!made,
    };
    SampleBank.clear();
    editing = null;
    document.getElementById("sample-editor").hidden = true;
    refreshSampleList();
    return out;
  });
  check("the editor opens on a loaded file", ed.opened);
  check("transients are detected for the waveform", ed.onsets >= 4, `${ed.onsets} onsets`);
  check("the selection is reported in seconds", /0:01/.test(ed.selText), ed.selText);
  check("only the selected region is extracted", Math.abs(ed.madeLen - 0.25) < 0.02,
    `${ed.madeLen}s selected 0.25s`);
  check("the extracted audio is the part that was selected", Math.abs(ed.hz - 440) < 60,
    `${ed.hz}Hz, the third burst was built at 440Hz`);
  check("it becomes the track's sound", ed.isSample);

  console.log("\n7. Your style");
  // The promise this panel makes is unusually literal - "you get exactly the
  // line-up you ask for" - so the test asks for a line-up the genre would
  // never choose on its own and checks that all of it turns up. Picking
  // instruments trap does not use is the point: if the genre pools were still
  // in charge, a kalimba and a saxophone over a trap beat is precisely what
  // would go missing.
  await page.click("#launcher-expand");
  await page.click('.launcher-tab[data-tab="mystyle"]');
  const msReady = await page.evaluate(() => ({
    genres: document.querySelectorAll("#ms-genre option").length,
    solo: document.querySelectorAll("#ms-solo .ms-chip").length,
    chord: document.querySelectorAll("#ms-chord .ms-chip").length,
    kits: document.querySelectorAll("#ms-kits select").length,
  }));
  check("every genre is offered", msReady.genres >= 19, `${msReady.genres} genres`);
  check("instruments are offered for both roles",
    msReady.solo >= 12 && msReady.chord >= 6, `${msReady.solo} lead, ${msReady.chord} chordal`);
  check("kits can be named per track", msReady.kits >= 6, `${msReady.kits} kit pickers`);

  await page.selectOption("#ms-genre", "trap");
  await page.evaluate(() => {
    for (const c of document.querySelectorAll("#ms-solo .ms-chip, #ms-chord .ms-chip")) {
      c.setAttribute("aria-pressed", "false");
    }
  });
  for (const inst of ["kalimba", "sax", "lead"]) {
    await page.click(`#ms-solo .ms-chip[data-inst="${inst}"]`);
  }
  await page.click('#ms-chord .ms-chip[data-inst="piano"]');
  const fitNote = await page.textContent("#ms-fit");
  check("off-genre picks are called out, not blocked",
    /not things Trap normally uses/.test(fitNote || ""), (fitNote || "").slice(0, 60) + "…");

  await page.selectOption('#ms-kits select[data-track="bass"]', "rage808");
  await page.selectOption("#ms-key", "F");
  await page.click("#ms-generate");
  await page.waitForTimeout(900);
  const built = await page.evaluate(() => ({
    key: document.getElementById("key-select").value,
    bass: currentFlavors.bass,
    played: Object.keys(currentPattern.instruments)
      .filter((k) => Array.isArray(currentPattern.instruments[k])
                  && currentPattern.instruments[k].some(Boolean)),
  }));
  for (const inst of ["kalimba", "sax", "lead", "piano"]) {
    check(`the requested ${inst} actually plays`, built.played.includes(inst),
      built.played.join(" "));
  }
  check("the named bass kit is used", built.bass === "rage808", built.bass);
  check("the chosen key is used", built.key === "F", built.key);

  // And the line-up must not leak: picking a genre afterwards has to go back
  // to that genre's own choices rather than silently keeping this one.
  await page.click("#launcher-expand");
  await page.click('.launcher-tab[data-tab="genre"]');
  await page.click("#style-select .style-card, #style-select button");
  await page.waitForTimeout(600);
  check("a later genre pick clears the custom line-up",
    (await page.evaluate(() => userStyleActive())) === false);

  console.log("\n8. No page errors");
  check("no uncaught errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  await browser.close();
  console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
  process.exit(failures ? 1 : 0);
})();
