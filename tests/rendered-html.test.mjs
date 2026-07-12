import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the V4 question-to-chronicle service", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /답은 바뀌었다/);
  assert.match(html, /기록은 남는다/);
  assert.match(html, /지금, 답이 바뀌는 질문들/);
  assert.match(html, /답변 연대기/);
  assert.match(html, /472/);
  assert.match(html, /AI ANSWER INTELLIGENCE/);
  assert.doesNotMatch(html, /\/og-corpus-69\.png/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /\/og\.png/);
  assert.equal((html.match(/class="v2-topic-card /g) ?? []).length, 12);
  assert.equal((html.match(/class="corpus-episode-card"/g) ?? []).length, 69);
  assert.equal((html.match(/aria-label="\d+번 /g) ?? []).length, 69);
  assert.match(html, /69편이 만든/);
  assert.match(html, /AI 지형도/);
  assert.match(html, /kim-dukjin-answer-chronicle-v1\.socialkim\.chatgpt\.site/);
  assert.match(html, /kim-dukjin-answer-chronicle-v2\.socialkim\.chatgpt\.site/);
  assert.match(html, /kim-dukjin-answer-chronicle-v3\.socialkim\.chatgpt\.site/);
  assert.match(html, /현재 종합 답/);
  assert.match(html, /직전 답변과 달라진 점/);
  assert.match(html, /김덕진 에피소드 69편 전수조사/);
  assert.ok(html.indexOf('id="questions"') < html.indexOf('id="chronicle"'));
  assert.ok(html.indexOf('id="chronicle"') < html.indexOf('id="map"'));
  assert.ok(html.indexOf('id="map"') < html.indexOf('id="corpus"'));
  assert.ok(html.indexOf('id="corpus"') < html.indexOf('id="movement"'));
  assert.doesNotMatch(html, /사람 검수 대기|신뢰할 수 있는 연대기를 만드는 법|method-dashboard|review-strip/);
});

test("publishes a many-to-many question atlas", async () => {
  const atlas = JSON.parse(await readFile(new URL("../public/data/question-atlas.json", import.meta.url), "utf8"));
  assert.equal(atlas.totals.questions, 60);
  assert.equal(atlas.totals.episodes, 69);
  assert.ok(atlas.totals.questionSeeds >= 400);
  assert.ok(atlas.totals.minimumSeedsPerEpisode >= 4);
  assert.equal(atlas.categories.length, 12);
  assert.equal(atlas.questions.length, 60);
  assert.equal(atlas.episodes.length, 69);
  assert.ok(atlas.episodes.every((episode) => episode.questionSeeds.length >= 4));
  assert.ok(atlas.questions.every((question) => question.signals.length >= 3));
  assert.ok(atlas.questions.every((question) => question.synthesisKo.length >= 80));
  assert.ok(atlas.questions.every((question) => question.signals.every((signal) => signal.pointKo && signal.deltaKo && signal.stageKo)));
});
