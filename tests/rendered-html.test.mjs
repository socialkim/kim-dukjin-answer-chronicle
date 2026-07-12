import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the finished answer chronicle", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /김덕진 답변 연대기/);
  assert.match(html, /답은 바뀌었다/);
  assert.match(html, /OpenAI와 ChatGPT/);
  assert.match(html, /Dukjin Global/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("ships trustworthy source labels and social metadata", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /AI 분석 시드/);
  assert.match(html, /타임스탬프 검수 예정/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /\/og\.png/);
});
