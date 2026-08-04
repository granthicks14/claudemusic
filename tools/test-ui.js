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

  console.log("\n1. Song search");
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

  console.log("\n2. Building the beat from the song");
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

  console.log("\n3. Offline render and scoring");
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

  console.log("\n4. No page errors");
  check("no uncaught errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  await browser.close();
  console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
  process.exit(failures ? 1 : 0);
})();
