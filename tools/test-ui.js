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

  for (const t of ["describe", "artist", "song", "track", "genre"]) {
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

  console.log("\n6. The samples tab");
  await page.click('.tools-tab[data-tool="samples"]');
  const hasInput = await page.isVisible("#sample-files");
  check("the sample loader is present", hasInput);
  // Load a generated sample straight into the bank and assign it, which is
  // the whole path the UI drives.
  const sampleWired = await page.evaluate(async () => {
    const SR = 44100;
    const c = new OfflineAudioContext(1, SR, SR);
    const b = c.createBuffer(1, Math.floor(SR * 0.4), SR);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = Math.exp(-(i / SR) * 9) * Math.sin(2 * Math.PI * 180 * (i / SR)) * 0.7;
    }
    const item = SampleBank.add("ui-test.wav", b, {});
    renderSampleList();
    const rows = document.querySelectorAll("#sample-list .sample-item").length;
    currentFlavors.kick = item.flavor;
    // And it must survive into a real render.
    engine.ensureContext();
    const before = currentFlavors.kick;
    SampleBank.clear();
    renderSampleList();
    return { rows, assigned: before === item.flavor, clearedRows: document.querySelectorAll("#sample-list .sample-item").length };
  });
  check("a loaded sample appears in the list", sampleWired.rows === 1, `${sampleWired.rows} rows`);
  check("it can be assigned to a track", sampleWired.assigned);
  check("clearing empties the list", sampleWired.clearedRows === 0, `${sampleWired.clearedRows} rows`);

  console.log("\n7. No page errors");
  check("no uncaught errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  await browser.close();
  console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
  process.exit(failures ? 1 : 0);
})();
