"use client";

import { useMemo, useState } from "react";
import corpus from "@/data/episodes.json";
import atlas from "@/data/question-atlas.json";

type Question = (typeof atlas.questions)[number];

const months = Array.from({ length: 19 }, (_, index) => {
  const date = new Date(2025, index, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
});

const categoryTone: Record<string, string> = {
  OpenAI: "blue",
  Google: "green",
  Anthropic: "orange",
  "중국 AI": "red",
  "AI 에이전트": "violet",
  "AI 코딩": "cyan",
  "일자리·교육": "amber",
  "반도체·인프라": "indigo",
  "Physical AI": "lime",
  콘텐츠: "pink",
  Meta: "sky",
  "AI 비즈니스": "slate",
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분`;
}

function shortDate(date: string) {
  return date.replaceAll("-", ".");
}

function Sparkline({ question }: { question: Question }) {
  const counts = months.map((month) => question.activityByMonth.find((item) => item.month === month)?.count ?? 0);
  const max = Math.max(...counts, 1);
  return (
    <span className="sparkline" aria-label={`${question.firstObservedAt}부터 ${question.lastObservedAt}까지 방송 빈도`}>
      {counts.map((count, index) => <i key={months[index]} style={{ height: `${Math.max(10, (count / max) * 100)}%` }} data-active={count > 0} />)}
    </span>
  );
}

function timelineSignals(question: Question) {
  const signals = question.signals;
  if (signals.length <= 3) return signals;
  const indices = [0, .5, 1].map((ratio) => Math.round((signals.length - 1) * ratio));
  return Array.from(new Set(indices)).map((index) => signals[index]);
}

export default function Chronicle() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedQuestionId, setSelectedQuestionId] = useState(atlas.questions[0].id);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(atlas.episodes[0].videoId);

  const categories = ["전체", ...atlas.categories.map((item) => item.labelKo)];
  const filteredQuestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return atlas.questions.filter((question) => {
      const categoryMatch = category === "전체" || question.category === category;
      const sourceTitles = question.signals.map((signal) => `${signal.title} ${signal.pointKo} ${signal.deltaKo}`).join(" ");
      const textMatch = !needle || `${question.questionKo} ${question.lensKo} ${question.category} ${question.synthesisKo} ${sourceTitles}`.toLowerCase().includes(needle);
      return categoryMatch && textMatch;
    });
  }, [category, query]);

  const selectedQuestion = atlas.questions.find((question) => question.id === selectedQuestionId) ?? filteredQuestions[0] ?? atlas.questions[0];
  const selectedEpisode = atlas.episodes.find((episode) => episode.videoId === selectedEpisodeId) ?? atlas.episodes[0];

  const selectQuestion = (question: Question) => {
    setSelectedQuestionId(question.id);
  };

  const jumpToQuestion = (questionId: string) => {
    setCategory("전체");
    setQuery("");
    setSelectedQuestionId(questionId);
    document.getElementById("questions")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="김덕진 답변 연대기 V3 홈">
          <span className="brand-mark">答</span>
          <span><b>김덕진 답변 연대기</b><small>AI ANSWER INTELLIGENCE</small></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#questions">60개 질문</a>
          <a href="#map">69편 맵</a>
          <a href="#chronicle">변화 연대기</a>
          <a href="#studio">Video Studio</a>
        </nav>
        <div className="header-actions">
          <div className="version-switcher" aria-label="버전 전환">
            <a href="https://kim-dukjin-answer-chronicle-v1.socialkim.chatgpt.site/">V1</a>
            <a href="https://kim-dukjin-answer-chronicle-v2.socialkim.chatgpt.site/">V2</a>
            <b aria-current="page">V3</b>
          </div>
          <a className="source-link" href={corpus.source.playlistUrl} target="_blank" rel="noreferrer">PLAYLIST <ArrowIcon /></a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-ambient" aria-hidden="true"><i /><i /><i /></div>
        <div className="hero-copy">
          <div className="hero-kicker"><span>V3 · ANSWER CHRONICLE</span><b>2025.01 — 2026.07 · 69편 전수 기록</b></div>
          <h1>답은 바뀌었다.<br /><em>기록은 남는다.</em></h1>
          <p className="hero-lead">매주 달라지는 AI에 대한 김덕진의 답. 같은 질문에 대한 관점이 언제, 왜, 어떻게 바뀌었는지 원본 영상과 함께 추적합니다.</p>
          <p className="hero-subcopy">김덕진 소장의 AI 인사이트를 영상 단위가 아니라 질문 단위로 다시 연결했습니다. 하나의 방송에서 여러 논점을 발견하고, 같은 질문이 시간에 따라 어디로 이동했는지 추적합니다.</p>
          <div className="hero-actions">
            <a href="#questions" className="primary-cta">질문 지도 탐색하기 <ArrowIcon /></a>
            <a href="#map" className="text-cta">69편 시그널 맵 보기 <span>↓</span></a>
          </div>
          <div className="hero-stats">
            <span><b>69</b><small>EPISODES</small></span>
            <span><b>60</b><small>EVOLVING QUESTIONS</small></span>
            <span><b>{atlas.totals.questionSeeds}</b><small>QUESTION SIGNALS</small></span>
            <span><b>23:33</b><small>HOURS ANALYZED</small></span>
          </div>
        </div>
        <figure className="hero-visual">
          <div className="visual-frame">
            <img src="/og-corpus-69.png" alt="69개 에피소드의 답변 변화를 시각화한 김덕진 답변 연대기" />
          </div>
          <figcaption><span>ANSWER MOVEMENT INDEX</span><b>69 → 471 → 60</b></figcaption>
          <div className="floating-proof proof-one"><small>LATEST SIGNAL</small><b>AI 비용 구조</b><span>2026.06</span></div>
          <div className="floating-proof proof-two"><small>ACTIVE THREADS</small><b>12 categories</b></div>
        </figure>
      </section>

      <div className="topic-marquee" aria-label="질문 카테고리">
        <div>{atlas.categories.concat(atlas.categories).map((item, index) => <span key={`${item.labelKo}-${index}`}><i />{item.labelKo} <b>{item.questionCount}</b></span>)}</div>
      </div>

      <section className="questions-section" id="questions">
        <div className="section-intro">
          <div><span className="section-no">01 / QUESTION ATLAS</span><h2>답이 바뀌는<br /><em>60개의 질문</em></h2></div>
          <p>질문을 선택하면 관련 방송이 시간순으로 연결됩니다. 한 영상은 평균 {Math.round(atlas.totals.questionSeeds / atlas.totals.episodes)}개의 질문에 동시에 기여합니다.</p>
        </div>

        <div className="question-toolbar">
          <label className="question-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="질문, 기업, 기술 키워드 검색" aria-label="질문 검색" /><b>{filteredQuestions.length}</b></label>
          <div className="question-categories" aria-label="질문 카테고리 필터">
            {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}{item !== "전체" && <small>05</small>}</button>)}
          </div>
        </div>

        <div className="question-workspace">
          <div className="question-list" aria-live="polite">
            {filteredQuestions.map((question, index) => (
              <button key={question.id} className={`question-row ${selectedQuestion.id === question.id ? "selected" : ""}`} onClick={() => selectQuestion(question)}>
                <span className={`question-tone tone-${categoryTone[question.category] ?? "slate"}`} />
                <small>Q{String(index + 1).padStart(2, "0")}</small>
                <span className="question-row-copy"><b>{question.questionKo}</b><em>{question.category} · {question.lensKo}</em></span>
                <Sparkline question={question} />
                <span className="question-count"><b>{question.episodeCount}</b>편</span>
              </button>
            ))}
            {filteredQuestions.length === 0 && <div className="empty-state">검색 조건에 맞는 질문이 없습니다.</div>}
          </div>

          <aside className="question-focus" aria-label="선택한 질문 상세">
            <div className="focus-label"><span>{selectedQuestion.category}</span><b>{selectedQuestion.firstObservedAt.slice(0, 7)} — {selectedQuestion.lastObservedAt.slice(0, 7)}</b></div>
            <h3>{selectedQuestion.questionKo}</h3>
            <div className="focus-synthesis">
              <small>김덕진의 현재 종합 관점</small>
              <p>{selectedQuestion.synthesisKo}</p>
              <em>{selectedQuestion.editorialNoteKo}</em>
            </div>
            <div className="focus-change"><small>무엇이 달라졌나</small><p>{selectedQuestion.changeSummaryKo}</p></div>
            <div className="focus-metrics"><span><b>{selectedQuestion.episodeCount}</b>연결 방송</span><span><b>{selectedQuestion.seedCount}</b>논점 신호</span><span><b>{selectedQuestion.activityByMonth.length}</b>활성 월</span></div>
            <div className="timeline-heading"><b>논점 변화 연대기</b><span>대표 시점 {timelineSignals(selectedQuestion).length}개</span></div>
            <div className="focus-timeline">
              {timelineSignals(selectedQuestion).map((signal) => (
                <article key={`${selectedQuestion.id}-${signal.videoId}`}>
                  <header><time>{shortDate(signal.publishedAt)}</time><b>{signal.stageKo}</b></header>
                  <h4>당시 핵심 논점</h4>
                  <p>{signal.pointKo}</p>
                  <div><small>이전 답에서 달라진 점</small><p>{signal.deltaKo}</p></div>
                  <div className="timeline-source"><span>근거 방송 · {signal.title}</span><a href={signal.evidenceUrl} target="_blank" rel="noreferrer">원본 시점 보기 <ArrowIcon /></a></div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="signal-map-section" id="map">
        <div className="map-glow" aria-hidden="true" />
        <div className="section-intro dark">
          <div><span className="section-no">02 / SIGNAL MAP</span><h2>69편이 만든<br /><em>AI 지형도</em></h2></div>
          <p>가로축은 시간, 세로축은 주제입니다. 점 하나가 방송 한 편이며 선택하면 그 영상에서 파생된 질문들이 열립니다.</p>
        </div>

        <div className="map-shell">
          <div className="map-ruler" aria-hidden="true"><span /><div>{months.map((month) => <b key={month}>{month.slice(2).replace("-", ".")}</b>)}</div></div>
          <div className="map-lanes">
            {corpus.clusters.map((cluster) => (
              <div className="map-lane" key={cluster.id}>
                <strong><span>{cluster.labelKo}</span><small>{cluster.episodeCount}</small></strong>
                <div className="lane-cells">
                  {months.map((month) => {
                    const monthEpisodes = atlas.episodes.filter((episode) => episode.clusterId === cluster.id && episode.publishedAt.startsWith(month));
                    return <span className="lane-cell" key={`${cluster.id}-${month}`}>{monthEpisodes.map((episode) => <button key={episode.videoId} className={selectedEpisode.videoId === episode.videoId ? "active" : ""} onClick={() => setSelectedEpisodeId(episode.videoId)} aria-label={`${episode.publishedAt} ${episode.title}`}><i /></button>)}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="episode-inspector">
          <a className="inspector-thumb" href={selectedEpisode.url} target="_blank" rel="noreferrer"><img src={`https://i.ytimg.com/vi/${selectedEpisode.videoId}/mqdefault.jpg`} alt="" /><span>PLAY <ArrowIcon /></span></a>
          <div className="inspector-copy">
            <span>{shortDate(selectedEpisode.publishedAt)} · {selectedEpisode.clusterLabel} · {formatDuration(selectedEpisode.durationSeconds)}</span>
            <h3>{selectedEpisode.title}</h3>
            <p>이 방송에서 연결된 질문 <b>{selectedEpisode.questionSeedCount}개</b></p>
          </div>
          <div className="inspector-seeds">
            {selectedEpisode.questionSeeds.slice(0, 6).map((seed) => <button key={seed.questionId} onClick={() => jumpToQuestion(seed.questionId)}><span>{seed.category}</span><b>{seed.questionKo}</b><ArrowIcon /></button>)}
          </div>
        </div>

        <div className="episode-index" aria-label="69개 에피소드 빠른 선택">
          {atlas.episodes.map((episode, index) => <button key={episode.videoId} className={selectedEpisode.videoId === episode.videoId ? "active" : ""} onClick={() => setSelectedEpisodeId(episode.videoId)} aria-label={`${index + 1}번 ${episode.title}`}>{String(index + 1).padStart(2, "0")}</button>)}
        </div>
      </section>

      <section className="chronicle-section" id="chronicle">
        <div className="chronicle-copy">
          <span className="section-no">03 / MOVEMENT</span>
          <h2>답의 변화는<br />하나의 <em>궤적</em>입니다.</h2>
          <p>신제품 하나, 비용 구조 하나, 파트너십 하나가 같은 질문의 답을 바꿉니다. 60개 질문의 관련 방송을 앞뒤로 넘기며 관점이 이동한 순간을 확인하세요.</p>
          <a href="#questions">질문 연대기 시작하기 <ArrowIcon /></a>
        </div>
        <div className="movement-board" aria-hidden="true">
          <div className="movement-axis"><span>2025.01</span><span>2025.07</span><span>2026.01</span><span>2026.07</span></div>
          {["모델 성능", "비용·인프라", "유통·플랫폼", "현실 세계"].map((label, lane) => <div className="movement-lane" key={label}><b>{label}</b><span><i style={{ left: `${8 + lane * 5}%` }} /><i style={{ left: `${35 + lane * 8}%` }} /><i style={{ left: `${75 + lane * 3}%` }} /></span></div>)}
          <div className="movement-note"><small>THE BIG SHIFT</small><b>성능 경쟁에서<br />지속 가능한 생태계 경쟁으로</b></div>
        </div>
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-visual"><div className="studio-window"><span>DUKJIN GLOBAL · VIDEO STUDIO</span><img src="https://i.ytimg.com/vi/YTfathQEoXc/hqdefault.jpg" alt="GPT-5 방송 썸네일" /><b>한국어 영상 → 다국어 자막 → 인포그래픽 → 보고서</b></div></div>
        <div className="studio-copy">
          <span className="section-no">04 / EXTENSION</span>
          <h2>방송을 전 세계가<br />읽는 콘텐츠로.</h2>
          <p>YouTube 영상을 열고 언어를 고르면 동기화 자막, 한 장의 인포그래픽, 근거 링크가 포함된 보고서로 바꿉니다.</p>
          <ul><li><b>8</b><span>지원 언어</span></li><li><b>3</b><span>콘텐츠 포맷</span></li><li><b>BYO</b><span>API 모델 선택</span></li></ul>
          <div><a href="https://github.com/socialkim/dukjin-global-english-companion/releases/download/v0.3.0-beta.1/dukjin-global-extension-v0.3.0.zip" className="primary-cta">확장 프로그램 다운로드 <ArrowIcon /></a><a href="https://github.com/socialkim/dukjin-global-english-companion" target="_blank" rel="noreferrer" className="text-cta">GitHub에서 보기</a></div>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">答</span><span><b>김덕진 답변 연대기</b><small>AI ANSWER INTELLIGENCE · V3</small></span></div>
        <p>같은 질문, 달라진 답, 연결된 69편.</p>
        <div><span className="footer-versions"><a href="https://kim-dukjin-answer-chronicle-v1.socialkim.chatgpt.site/">V1</a><a href="https://kim-dukjin-answer-chronicle-v2.socialkim.chatgpt.site/">V2</a><b>V3</b></span><span>BUILT WITH CODEX · POWERED BY CHATGPT 5.6SOL</span></div>
      </footer>
    </main>
  );
}
