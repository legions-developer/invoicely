import { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";

const require = createRequire(import.meta.url);
const googleFontPath = "next/dist/compiled/@next/font/dist/google/";
const loaderPath = require.resolve(`${googleFontPath}loader.js`);
const cssFetcher = require(`${googleFontPath}fetch-css-from-google-fonts.js`);
const fontFetcher = require(`${googleFontPath}fetch-font-file.js`);

// Exercise the installed, patched loader against the response shape in
// https://github.com/vercel/next.js/issues/99114 without any network requests.
async function loadFont(t, fontUrl, fontBuffer, format = "woff2") {
  const css = `/* latin */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400;
  src: url(${fontUrl}) format('${format}');
}`;
  const cssMock = t.mock.method(cssFetcher, "fetchCSSFromGoogleFonts", async () => css);
  const fontMock = t.mock.method(fontFetcher, "fetchFontFile", async () => fontBuffer);
  // Each invocation gets fresh loader caches, as a clean production build does.
  delete require.cache[loaderPath];
  const loader = require(loaderPath).default;
  const emitted = [];
  try {
    const result = await loader({
      functionName: "Geist",
      data: [{ weight: "400", subsets: ["latin"], adjustFontFallback: false }],
      isDev: false,
      isServer: true,
      emitFontFile(buffer, extension, preload) {
        emitted.push({ buffer, extension, preload });
        return `/_next/static/media/geist.${extension}`;
      },
    });
    assert.equal(fontMock.mock.calls.length, 1);
    assert.equal(fontMock.mock.calls[0].arguments[0], fontUrl);
    return { result, emitted };
  } finally {
    cssMock.mock.restore();
    fontMock.mock.restore();
    delete require.cache[loaderPath];
  }
}

function assertEmitted({ result, emitted }, fontBuffer, extension) {
  assert.deepEqual(emitted, [{ buffer: fontBuffer, extension, preload: true }]);
  assert.ok(result.css.includes(`/_next/static/media/geist.${extension}`));
  assert.ok(!result.css.includes("fonts.gstatic.com"));
}

test("extensionless Google Fonts kit URLs emit WOFF2 and rewrite the CSS", async (t) => {
  const fontBuffer = Buffer.from("wOF2font payload");
  const fontUrl = "https://fonts.gstatic.com/l/font?kit=Geist&skey=example&v=v1";
  assertEmitted(await loadFont(t, fontUrl, fontBuffer), fontBuffer, "woff2");
});

test("font URLs with query strings or fragments retain their extension", async (t) => {
  for (const suffix of ["?v=123", "#font", "?v=123#font"]) {
    const fontBuffer = Buffer.from("wOFFfont payload");
    const fontUrl = `https://fonts.gstatic.com/s/geist/v1/font.woff${suffix}`;
    assertEmitted(await loadFont(t, fontUrl, fontBuffer, "woff"), fontBuffer, "woff");
  }
});

test("ordinary font URLs retain every previously supported extension", async (t) => {
  for (const extension of ["woff", "woff2", "eot", "ttf", "otf"]) {
    const fontBuffer = Buffer.from("font payload with a known URL extension");
    const fontUrl = `https://fonts.gstatic.com/s/geist/v1/font.${extension}`;
    assertEmitted(await loadFont(t, fontUrl, fontBuffer, extension), fontBuffer, extension);
  }
});

test("extensionless WOFF, TrueType, and OpenType responses use their actual signatures", async (t) => {
  for (const [signature, extension] of [
    [Buffer.from("wOFF"), "woff"],
    [Buffer.from([0x00, 0x01, 0x00, 0x00]), "ttf"],
    [Buffer.from("OTTO"), "otf"],
    [Buffer.from("true"), "ttf"],
  ]) {
    const fontBuffer = Buffer.concat([signature, Buffer.from("font payload")]);
    const fontUrl = "https://fonts.gstatic.com/l/font?kit=Geist&skey=example&v=v1";
    assertEmitted(await loadFont(t, fontUrl, fontBuffer, extension), fontBuffer, extension);
  }
});

test("unknown and truncated extensionless payloads fail with a useful diagnostic", async (t) => {
  for (const fontBuffer of [Buffer.from("<html>unexpected response</html>"), Buffer.from("wO"), Buffer.alloc(0)]) {
    await assert.rejects(
      loadFont(t, "https://fonts.gstatic.com/l/font?kit=Geist&skey=example&v=v1", fontBuffer),
      /Could not determine the file format for `Geist` from Google Fonts/,
    );
  }
});
