"use client";

import { useMemo, useState } from "react";
import corpus from "@/data/episodes.json";
import atlas from "@/data/question-atlas.json";

type Question = (typeof atlas.questions)[number];

const months = Array.from({ length: 19 }, (_, index) => {
  const date = new Date(2025, index, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
});

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

function formatTotalDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
}

function changeLevel(question: Question) {
  if (question.episodeCount >= 9) return "큼";
  if (question.episodeCount >= 6) return "중간";
  return "추적";
}

export default function Chronicle() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedQuestionId, setSelectedQuestionId] = useState(atlas.questions[0].id);
  const [selectedSignalId, setSelectedSignalId] = useState(atlas.questions[0].signals.at(-1)?.videoId ?? atlas.questions[0].signals[0].videoId);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(atlas.episodes[0].videoId);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");
  const [episodeCluster, setEpisodeCluster] = useState("all");
  const [compareOpen, setCompareOpen] = useState(false);

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
  const selectedTimeline = selectedQuestion.signals;
  const selectedSignal = selectedTimeline.find((signal) => signal.videoId === selectedSignalId) ?? selectedTimeline.at(-1) ?? selectedQuestion.signals.at(-1)!;
  const firstSignal = selectedTimeline[0];
  const latestSignal = selectedTimeline.at(-1)!;
  const displayQuestions = showAllQuestions || query.trim() || category !== "전체" ? filteredQuestions : filteredQuestions.slice(0, 12);
  const filteredEpisodes = useMemo(() => {
    const needle = episodeQuery.trim().toLowerCase();
    return corpus.episodes.filter((episode) => {
      const clusterMatch = episodeCluster === "all" || episode.clusterId === episodeCluster;
      const textMatch = !needle || `${episode.title} ${episode.thesisSeedKo} ${episode.clusterLabel}`.toLowerCase().includes(needle);
      return clusterMatch && textMatch;
    });
  }, [episodeCluster, episodeQuery]);

  const selectQuestion = (question: Question) => {
    setSelectedQuestionId(question.id);
    setSelectedSignalId(question.signals.at(-1)!.videoId);
    requestAnimationFrame(() => document.getElementById("chronicle")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const jumpToQuestion = (questionId: string) => {
    setCategory("전체");
    setQuery("");
    setSelectedQuestionId(questionId);
    const question = atlas.questions.find((item) => item.id === questionId);
    if (question) setSelectedSignalId(question.signals.at(-1)!.videoId);
    document.getElementById("chronicle")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="김덕진 답변 연대기 V4 홈">
          <span className="brand-mark">答</span>
          <span><b>김덕진 답변 연대기</b><small>AI ANSWER INTELLIGENCE</small></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#questions">질문들</a>
          <a href="#chronicle">답변 연대기</a>
          <a href="#map">시그널 맵</a>
          <a href="#corpus">69편 전수조사</a>
          <a href="#studio">Video Studio</a>
        </nav>
        <div className="header-actions">
          <div className="version-switcher" aria-label="버전 전환">
            <a href="https://kim-dukjin-answer-chronicle-v1.socialkim.chatgpt.site/">V1</a>
            <a href="https://kim-dukjin-answer-chronicle-v2.socialkim.chatgpt.site/">V2</a>
            <a href="https://kim-dukjin-answer-chronicle-v3.socialkim.chatgpt.site/">V3</a>
            <b aria-current="page">V4</b>
          </div>
          <a className="source-link" href={corpus.source.playlistUrl} target="_blank" rel="noreferrer">PLAYLIST <ArrowIcon /></a>
        </div>
      </header>

      <section className="hero hero-v4" id="top">
        <div className="hero-ambient" aria-hidden="true"><i /><i /><i /></div>
        <div className="hero-copy">
          <div className="hero-kicker"><span>V4 · ANSWER CHRONICLE</span><b>2025.01 — 2026.07 · 69편 전수 기록</b></div>
          <h1>답은 바뀌었다.<br /><em>기록은 남는다.</em></h1>
          <p className="hero-lead">매주 달라지는 AI에 대한 김덕진의 답. 같은 질문에 대한 관점이 언제, 왜, 어떻게 바뀌었는지 원본 영상과 함께 추적합니다.</p>
          <p className="hero-subcopy">김덕진 소장의 AI 인사이트를 영상 단위가 아니라 질문 단위로 다시 연결했습니다. 하나의 방송에서 여러 논점을 발견하고, 같은 질문이 시간에 따라 어디로 이동했는지 추적합니다.</p>
          <div className="hero-actions">
            <a href="#questions" className="primary-cta">답이 바뀌는 질문 보기 <ArrowIcon /></a>
            <a href="#chronicle" className="text-cta">답변 연대기 바로가기 <span>↓</span></a>
          </div>
          <div className="hero-stats">
            <span><b>69</b><small>EPISODES</small></span>
            <span><b>60</b><small>EVOLVING QUESTIONS</small></span>
            <span><b>{atlas.totals.questionSeeds}</b><small>QUESTION SIGNALS</small></span>
            <span><b>23:33</b><small>HOURS ANALYZED</small></span>
          </div>
        </div>
      </section>

      <div className="topic-marquee" aria-label="질문 카테고리">
        <div>{atlas.categories.concat(atlas.categories).map((item, index) => <span key={`${item.labelKo}-${index}`}><i />{item.labelKo} <b>{item.questionCount}</b></span>)}</div>
      </div>

      <section className="questions-section" id="questions">
        <div className="v2-section-heading">
          <div><span className="v2-section-no">01</span><h2>지금, 답이 바뀌는 질문들</h2></div>
          <p>질문을 선택하면 바로 아래에서 김덕진의 답이 시점에 따라 어떻게 달라졌는지 볼 수 있습니다.</p>
        </div>

        <div className="question-toolbar">
          <label className="question-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="질문, 기업, 기술 키워드 검색" aria-label="질문 검색" /><b>{filteredQuestions.length}</b></label>
          <div className="question-categories" aria-label="질문 카테고리 필터">
            {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setShowAllQuestions(item !== "전체"); }}>{item}{item !== "전체" && <small>05</small>}</button>)}
          </div>
        </div>

        <div className="v2-topic-grid" aria-live="polite">
          {displayQuestions.map((question) => {
            const atlasIndex = atlas.questions.findIndex((item) => item.id === question.id) + 1;
            const level = changeLevel(question);
            return (
              <button key={question.id} className={`v2-topic-card ${selectedQuestion.id === question.id ? "selected" : ""}`} onClick={() => selectQuestion(question)}>
                <span className="v2-topic-index">{String(atlasIndex).padStart(2, "0")}</span>
                <span className={`v2-change-badge change-${level}`}>변화 {level}</span>
                <strong>{question.questionKo}</strong>
                <p>{question.synthesisKo.split(". ")[0]}.</p>
                <span className="v2-topic-bottom"><span>{question.category} · 답변 {question.signals.length}개 · 근거 {question.episodeCount}편</span><b>→</b></span>
              </button>
            );
          })}
          {filteredQuestions.length === 0 && <div className="empty-state">검색 조건에 맞는 질문이 없습니다.</div>}
        </div>
        {category === "전체" && !query.trim() && filteredQuestions.length > 12 && <button className="questions-more" onClick={() => setShowAllQuestions((value) => !value)}>{showAllQuestions ? "대표 질문만 보기" : `60개 질문 전체 보기`} <span>{showAllQuestions ? "↑" : "↓"}</span></button>}
      </section>

      <section className="answer-chronicle-section" id="chronicle">
        <div className="v2-section-heading light">
          <div><span className="v2-section-no">02</span><h2>답변 연대기</h2></div>
          <p>QUESTION → ANSWER → DELTA → EVIDENCE</p>
        </div>
        <div className="chronicle-question-header">
          <div><span>{selectedQuestion.category} · {selectedQuestion.firstObservedAt.slice(0, 7)} — {selectedQuestion.lastObservedAt.slice(0, 7)}</span><h3>{selectedQuestion.questionKo}</h3></div>
          <div className="chronicle-header-actions"><b>{selectedQuestion.episodeCount}개 근거 방송</b><button onClick={() => setCompareOpen(true)}><span>⇄</span> 최초 ↔ 최신 두 시점 비교</button></div>
        </div>
        <div className="chronicle-current-answer">
          <span>NOW<br /><b>현재 종합 관점</b></span>
          <p>{selectedQuestion.synthesisKo}</p>
          <div><small>변화 강도</small><i /><i /><i className={changeLevel(selectedQuestion) === "추적" ? "dim" : ""} /><b>{changeLevel(selectedQuestion)}</b></div>
        </div>
        <p className="chronicle-editorial-note">*69편의 방송 논점을 질문 단위로 연결한 편집 요약이며, 직접 인용이 아닙니다.</p>
        <div className="chronicle-change-summary"><small>무엇이 달라졌나</small><p>{selectedQuestion.changeSummaryKo}</p></div>
        <div className="v2-chronicle-grid">
          <aside className="v2-timeline-nav" aria-label="답변 시점">
            <p>ANSWER HISTORY · {selectedTimeline.length} / {selectedQuestion.episodeCount}</p>
            <ol>{selectedTimeline.map((signal) => <li key={signal.videoId} className={`timeline-entry ${selectedSignal.videoId === signal.videoId ? "active" : ""}`}><button onClick={() => setSelectedSignalId(signal.videoId)}><span /><small>{shortDate(signal.publishedAt)}</small><b>{signal.stageKo}</b><em>{signal.viewpointKo}</em></button></li>)}</ol>
          </aside>
          <article className="v2-answer-detail">
            <div className="v2-detail-date"><span>{shortDate(selectedSignal.publishedAt)}</span><b>{selectedSignal.stageKo}</b><small>편집 요약 · 원본 연결</small></div>
            <h4>“{selectedSignal.pointKo}”</h4>
            <div className="v2-delta-card"><span>Δ</span><div><small>직전 답변과 달라진 점</small><p>{selectedSignal.deltaKo}</p></div></div>
            <div className="v2-driver-row"><span>이 시점의 핵심 사건</span><b>{selectedSignal.driverKo}</b></div>
            <div className="v2-analysis-note"><small>CHRONICLE NOTE</small><p>{selectedQuestion.editorialNoteKo} 아래 원본 영상의 연결 시점에서 맥락을 직접 확인할 수 있습니다.</p></div>
          </article>
          <aside className="v2-evidence-card">
            <div><span>근거 영상</span><b>YOUTUBE ↗</b></div>
            <a className="v2-thumbnail" href={selectedSignal.evidenceUrl} target="_blank" rel="noreferrer"><img src={`https://i.ytimg.com/vi/${selectedSignal.videoId}/hqdefault.jpg`} alt="" /><span>▶</span></a>
            <strong>{selectedSignal.title}</strong>
            <p>손에잡히는경제 × 김덕진의 AI디아</p>
            <a className="v2-watch-link" href={selectedSignal.evidenceUrl} target="_blank" rel="noreferrer">원본 시점에서 확인하기 <ArrowIcon /></a>
            <div className="v2-evidence-status"><span>근거 상태</span><b><i /> 자막 연결 완료</b></div>
          </aside>
        </div>
      </section>

      <section className="signal-map-section" id="map">
        <div className="map-glow" aria-hidden="true" />
        <div className="section-intro dark">
          <div><span className="section-no">MAP / SIGNAL</span><h2>69편이 만든<br /><em>AI 지형도</em></h2></div>
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

      <section className="corpus-section" id="corpus">
        <div className="v2-section-heading">
          <div><span className="v2-section-no data">DATA</span><h2>김덕진 에피소드 69편 전수조사</h2></div>
          <p>{corpus.source.visiblePlaylistEntries} VISIBLE · {corpus.totals.episodes} SELECTED · {corpus.totals.transcriptsCaptured} CAPTURED</p>
        </div>
        <div className="corpus-intro">
          <div><strong>누락 없이, 과장 없이</strong><p>플레이리스트에서 김덕진 출연분 69편을 확정하고 한국어 자동 자막을 모두 수집했습니다. 각 에피소드는 질문·논점·원본 근거 시점으로 다시 연결됩니다.</p></div>
          <div className="corpus-stats"><span><b>69/69</b>에피소드</span><span><b>69/69</b>한국어 자막</span><span><b>{formatTotalDuration(corpus.totals.durationSeconds)}</b>분석 분량</span><span><b>{atlas.totals.questionSeeds}</b>논점 신호</span></div>
        </div>
        <div className="corpus-toolbar">
          <label><span>에피소드 검색</span><input value={episodeQuery} onChange={(event) => setEpisodeQuery(event.target.value)} placeholder="제목·주제 검색" /></label>
          <label><span>질문 군집</span><select value={episodeCluster} onChange={(event) => setEpisodeCluster(event.target.value)}><option value="all">전체 69편</option>{corpus.clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.labelKo} · {cluster.episodeCount}편</option>)}</select></label>
          <a href="/data/episodes.json" target="_blank" rel="noreferrer">공개 코퍼스 JSON <ArrowIcon /></a>
        </div>
        <div className="episode-result"><b>{filteredEpisodes.length}</b>편 표시 중 <span>· 최신순</span></div>
        <div className="corpus-episode-grid">
          {filteredEpisodes.map((episode) => (
            <article className="corpus-episode-card" key={episode.videoId}>
              <a className="corpus-thumb" href={episode.url} target="_blank" rel="noreferrer"><img loading="lazy" src={`https://i.ytimg.com/vi/${episode.videoId}/mqdefault.jpg`} alt="" /><span>{formatDuration(episode.durationSeconds)}</span></a>
              <div className="corpus-card-body">
                <div className="corpus-meta"><time>{episode.publishedAt}</time><b>{episode.clusterLabel}</b><small>#{episode.playlistPosition}</small></div>
                <h3>{episode.title}</h3>
                <p><span>핵심 논점</span>{episode.thesisSeedKo}</p>
                <div className="corpus-proof"><span><i /> 자막 {Math.round(episode.transcript.coverageRatio * 100)}%</span>{episode.evidenceAnchor ? <a href={episode.evidenceAnchor.url} target="_blank" rel="noreferrer">근거 시점 {Math.floor(episode.evidenceAnchor.startSeconds / 60)}:{String(episode.evidenceAnchor.startSeconds % 60).padStart(2, "0")} <ArrowIcon /></a> : <span>원본 영상 연결</span>}</div>
              </div>
            </article>
          ))}
        </div>
        {filteredEpisodes.length === 0 && <div className="empty-state">조건에 맞는 에피소드가 없습니다.</div>}
      </section>

      <section className="chronicle-section" id="movement">
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
        <div className="brand"><span className="brand-mark">答</span><span><b>김덕진 답변 연대기</b><small>AI ANSWER INTELLIGENCE · V4</small></span></div>
        <p>같은 질문, 달라진 답, 연결된 69편.</p>
        <div><span className="footer-versions"><a href="https://kim-dukjin-answer-chronicle-v1.socialkim.chatgpt.site/">V1</a><a href="https://kim-dukjin-answer-chronicle-v2.socialkim.chatgpt.site/">V2</a><a href="https://kim-dukjin-answer-chronicle-v3.socialkim.chatgpt.site/">V3</a><b>V4</b></span><span>BUILT WITH CODEX · POWERED BY CHATGPT 5.6SOL</span></div>
      </footer>

      {compareOpen && <div className="compare-backdrop" role="presentation" onMouseDown={() => setCompareOpen(false)}>
        <section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="compare-close" onClick={() => setCompareOpen(false)} aria-label="두 시점 비교 닫기">×</button>
          <div className="compare-kicker"><span>ANSWER DELTA</span><b>변화 강도 · {changeLevel(selectedQuestion)}</b></div>
          <h2 id="compare-title">최초의 답에서<br />현재의 관점까지.</h2>
          <p className="compare-question">{selectedQuestion.questionKo}</p>
          <div className="compare-columns">
            {[firstSignal, latestSignal].map((signal, index) => <article key={signal.videoId}>
              <span>{index === 0 ? "FROM · 최초 관점" : "TO · 최신 관점"}</span>
              <time>{shortDate(signal.publishedAt)}</time>
              <h3>{signal.pointKo}</h3>
              <p>{signal.driverKo}</p>
              <a href={signal.evidenceUrl} target="_blank" rel="noreferrer">원본 근거 보기 <ArrowIcon /></a>
            </article>)}
          </div>
          <div className="compare-delta"><span>Δ</span><div><small>무엇이 달라졌나</small><p>{selectedQuestion.changeSummaryKo}</p></div></div>
          <em>*69편의 방송 논점을 질문 단위로 연결한 편집 요약이며, 직접 인용이 아닙니다.</em>
        </section>
      </div>}
    </main>
  );
}
