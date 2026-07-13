import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the V5 evidence-first chronicle service", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /답은 바뀌었다/);
  assert.match(html, /기록은 남는다/);
  assert.match(html, /지금, 답이 바뀌는 질문들/);
  assert.match(html, /답변 연대기/);
  assert.match(html, /639/);
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
  assert.match(html, /현재 종합 관점/);
  assert.match(html, /직전 답변과 달라진 점/);
  assert.match(html, /무엇이 달라졌나/);
  assert.match(html, /큰따옴표 안은 한국어 자동 자막 직접 인용/);
  assert.match(html, /예측 채점표/);
  assert.match(html, /김덕진 명언 아카이브/);
  assert.match(html, /2026-07-06/);
  assert.match(html, /최초 ↔ 최신 두 시점 비교/);
  assert.match(html, /손에잡히는경제 YouTube/);
  assert.match(html, /김덕진 소장 소개/);
  assert.match(html, /https:\/\/www\.youtube\.com\/@%EC%86%90%EA%B2%BD%EC%A0%9C/);
  assert.match(html, /https:\/\/litt\.ly\/kimdukjin/);
  assert.equal((html.match(/https:\/\/litt\.ly\/kimdukjin/g) ?? []).length, 2);
  const renderedAtlas = JSON.parse(await readFile(new URL("../public/data/question-atlas.json", import.meta.url), "utf8"));
  assert.equal((html.match(/timeline-entry/g) ?? []).length, renderedAtlas.questions[0].signals.length);
  assert.equal(renderedAtlas.questions[0].signals.length, renderedAtlas.questions[0].episodeCount);
  assert.match(html, /김덕진 에피소드 69편 전수조사/);
  assert.ok(html.indexOf('id="questions"') < html.indexOf('id="chronicle"'));
  assert.ok(html.indexOf('id="chronicle"') < html.indexOf('id="scorecard"'));
  assert.ok(html.indexOf('id="scorecard"') < html.indexOf('id="quotes"'));
  assert.ok(html.indexOf('id="quotes"') < html.indexOf('id="map"'));
  assert.ok(html.indexOf('id="map"') < html.indexOf('id="corpus"'));
  assert.ok(html.indexOf('id="corpus"') < html.indexOf('id="movement"'));
  assert.ok(html.indexOf('id="studio"') < html.indexOf('id="connect"'));
  assert.doesNotMatch(html, /사람 검수 대기|신뢰할 수 있는 연대기를 만드는 법|method-dashboard|review-strip/);
});

test("publishes a many-to-many question atlas", async () => {
  const atlas = JSON.parse(await readFile(new URL("../public/data/question-atlas.json", import.meta.url), "utf8"));
  assert.equal(atlas.totals.questions, 60);
  assert.equal(atlas.totals.deepQuestions, 28);
  assert.equal(atlas.totals.extendedQuestions, 32);
  assert.equal(atlas.totals.episodes, 69);
  assert.ok(atlas.totals.questionSeeds >= 400);
  assert.equal(atlas.totals.directEvidenceQuotes, atlas.totals.questionSeeds);
  assert.equal(atlas.source.latestEpisodeAt, "2026-07-06");
  assert.equal(atlas.source.transcriptsCaptured, 69);
  assert.equal(atlas.source.transcriptCues, 39700);
  assert.ok(atlas.totals.minimumSeedsPerEpisode >= 4);
  assert.equal(atlas.categories.length, 12);
  assert.equal(atlas.questions.length, 60);
  assert.equal(atlas.questions.filter((question) => question.depth === "deep").length, 28);
  assert.equal(atlas.questions.filter((question) => question.depth === "extended").length, 32);
  assert.equal(atlas.episodes.length, 69);
  assert.ok(atlas.episodes.every((episode) => episode.questionSeeds.length >= 4));
  assert.ok(atlas.questions.every((question) => question.signals.length >= 3));
  assert.ok(atlas.questions.every((question) => question.synthesisKo.length >= 80));
  assert.ok(atlas.questions.every((question) => question.signals.every((signal) => signal.pointKo && signal.deltaKo && signal.stageKo && signal.evidence?.isDirectQuote)));
  assert.ok(atlas.questions.every((question) => question.signals.every((signal) => !signal.pointKo.includes("사례를 근거로"))));
  assert.equal(atlas.questions[0].id, "deep-openai-strategy");
  assert.equal(atlas.questions[0].signals.length, 28);
  assert.equal(atlas.questions[0].lastObservedAt, "2026-06-29");
  assert.ok(atlas.questions[0].signals.every((signal) => signal.detailKo?.length > 80));
  assert.ok(atlas.questions[0].signals.every((signal) => !/어서 오세요|안녕하세요 반갑습니다/.test(signal.pointKo)));
});

test("publishes verified prediction and quote features", async () => {
  const features = JSON.parse(await readFile(new URL("../public/data/insight-features.json", import.meta.url), "utf8"));
  assert.equal(features.totals.predictions, 20);
  assert.equal(features.totals.quotes, 19);
  assert.deepEqual(features.totals.verdicts, { "적중": 9, "부분적중": 5, "빗나감": 3, "미확정": 3 });
  assert.equal(features.totals.transcriptMatched, 39);
  assert.ok([...features.predictions, ...features.quotes].every((item) => item.transcriptVerification.status === "matched"));
  assert.ok(features.predictions.every((item) => item.evidenceUrl.includes(`watch?v=${item.video_id}&t=`)));
});
