import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the complete 69-episode answer chronicle", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /김덕진 답변 연대기/);
  assert.match(html, /V2 CURRENT/);
  assert.match(html, /kim-dukjin-answer-chronicle-v1\.socialkim\.chatgpt\.site/);
  assert.match(html, /답은 바뀌었다/);
  assert.match(html, /69 EPISODES · 23H 33M · 69\/69 TRANSCRIPTS/);
  assert.match(html, /김덕진 에피소드 69편 전수조사/);
  assert.match(html, /69\/69.*한국어 자막/);
  assert.match(html, /OpenAI·ChatGPT/);
  assert.match(html, /Google·Gemini/);
  assert.match(html, /Anthropic·Claude/);
  assert.equal((html.match(/class="episode-card"/g) ?? []).length, 69);
  assert.match(html, /POWERED BY CHATGPT 5\.6SOL/);
  assert.match(html, /Dukjin Global/);
  assert.match(html, /Video Studio/);
  assert.match(html, /dukjin-global-extension-v0\.3\.0\.zip/);
  assert.match(html, /chrome:\/\/extensions/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("publishes auditable status labels and corpus data", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /자막 확보/);
  assert.match(html, /제목·순서 기반 후보이며 확정 답변이 아님/);
  assert.match(html, /0 \/ 69/);
  assert.match(html, /사람 검수/);
  assert.match(html, /\/data\/episodes\.json/);
  assert.match(html, /property="og:image"/);

  const corpus = JSON.parse(await readFile(new URL("../public/data/episodes.json", import.meta.url), "utf8"));
  assert.equal(corpus.totals.episodes, 69);
  assert.equal(corpus.totals.transcriptsCaptured, 69);
  assert.equal(corpus.episodes.length, 69);
  assert.ok(corpus.episodes.every((episode) => episode.transcript.sha256 && episode.evidenceAnchor?.url));
  assert.ok(corpus.episodes.every((episode) => !Object.hasOwn(episode.transcript, "text")));
});
