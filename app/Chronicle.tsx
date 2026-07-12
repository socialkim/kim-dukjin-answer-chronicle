"use client";

import { useMemo, useState } from "react";
import corpus from "@/data/episodes.json";

type Snapshot = {
  id: string;
  date: string;
  dateEn: string;
  stance: "기대" | "경고" | "재평가" | "확신 강화";
  answer: string;
  answerEn: string;
  delta: string;
  deltaEn: string;
  driver: string;
  videoId: string;
  videoTitle: string;
  time: string;
};

type Topic = {
  id: string;
  category: string;
  question: string;
  questionEn: string;
  current: string;
  currentEn: string;
  change: "큼" | "중간" | "적음";
  snapshots: Snapshot[];
};

const topics: Topic[] = [
  {
    id: "openai",
    category: "모델",
    question: "OpenAI와 ChatGPT는 여전히 AI 시장의 1위인가?",
    questionEn: "Are OpenAI and ChatGPT still leading the AI market?",
    current: "모델 성능 하나가 아니라 비용·인프라·서비스 안정성·생태계까지 함께 봐야 1위를 판단할 수 있다는 관점으로 확장됐습니다.",
    currentEn: "The view has expanded: leadership now depends on cost, infrastructure, reliability and ecosystem—not model quality alone.",
    change: "큼",
    snapshots: [
      { id: "o1", date: "2025.07.14", dateEn: "Jul 14, 2025", stance: "경고", answer: "OpenAI의 인재·자본 경쟁력이 흔들릴 수 있다.", answerEn: "OpenAI's talent and capital advantage may be weakening.", delta: "기술 우위보다 조직과 사업 리스크를 전면에 놓기 시작했습니다.", deltaEn: "Organizational and business risk moved ahead of raw capability.", driver: "메타의 AI 인재 영입 경쟁", videoId: "7pNF_zKKld0", videoTitle: "오픈AI가 휘청거리고 있습니다", time: "04:12" },
      { id: "o2", date: "2025.08.04", dateEn: "Aug 4, 2025", stance: "기대", answer: "GPT-5가 왕의 귀환을 만들 가능성이 있다.", answerEn: "GPT-5 could mark the king's return.", delta: "제품 출시를 계기로 기술 리더십 기대가 빠르게 회복됐습니다.", deltaEn: "A major launch revived confidence in technical leadership.", driver: "GPT-5 출시 예고", videoId: "YTfathQEoXc", videoTitle: "GPT-5 출시 준비하는 오픈AI, 왕의 귀환이 임박했습니다", time: "02:48" },
      { id: "o3", date: "2025.08.11", dateEn: "Aug 11, 2025", stance: "재평가", answer: "혁신의 크기보다 실제 활용법이 더 중요하다.", answerEn: "How people use GPT-5 matters more than the size of the leap.", delta: "출시 전 기대에서 실사용 가치 중심으로 기준을 조정했습니다.", deltaEn: "The test shifted from pre-launch hype to practical value.", driver: "GPT-5 실사용 평가", videoId: "UlqDIui5zM8", videoTitle: "혁신 없다는 GPT5, 잘 쓰는 법 따로 있습니다", time: "06:31" },
      { id: "o4", date: "2025.11.24", dateEn: "Nov 24, 2025", stance: "경고", answer: "사용자 규모만큼 서비스 안정성이 핵심 경쟁력이다.", answerEn: "Reliability must scale with user growth to remain a core advantage.", delta: "성능 논쟁에 인프라 안정성이라는 새 평가축이 더해졌습니다.", deltaEn: "Reliability became a new axis alongside model performance.", driver: "대규모 ChatGPT 장애", videoId: "Lqwae5zKwrA", videoTitle: "챗GPT가 먹통이 된 이유", time: "03:05" },
      { id: "o5", date: "2026.04.27", dateEn: "Apr 27, 2026", stance: "재평가", answer: "GPT-5.5가 경쟁 구도를 다시 흔들고 있다.", answerEn: "GPT-5.5 is reshaping the competitive field again.", delta: "위기론에서 제품 반격 가능성으로 무게중심이 이동했습니다.", deltaEn: "The balance moved from crisis talk to a possible product comeback.", driver: "GPT-5.5 공개", videoId: "PVr9G2dAYls", videoTitle: "챗GPT 5.5 출시, AI판이 또 흔들립니다", time: "01:54" },
      { id: "o6", date: "2026.05.04", dateEn: "May 4, 2026", stance: "경고", answer: "1위 지위는 더 이상 자동으로 유지되지 않는다.", answerEn: "The number-one position can no longer be taken for granted.", delta: "단일 모델 반등보다 지속 가능한 사업 구조를 더 엄격히 봅니다.", deltaEn: "Sustainable economics now outweigh a single model rebound.", driver: "비용·경쟁·자금 조달 압박", videoId: "_lMm1HKYOnY", videoTitle: "오픈AI 또 위기설, 1위가 위태롭습니다", time: "05:20" },
    ],
  },
  {
    id: "china",
    category: "중국 AI",
    question: "중국 AI는 미국을 따라잡았나?",
    questionEn: "Has Chinese AI caught up with the United States?",
    current: "‘저가 추격자’에서 비용 효율과 확산 속도로 시장 규칙을 바꾸는 경쟁자로 평가가 이동했습니다.",
    currentEn: "The framing has moved from low-cost follower to a competitor rewriting the market through efficiency and speed.",
    change: "큼",
    snapshots: [
      { id: "c1", date: "2025.12.08", dateEn: "Dec 8, 2025", stance: "재평가", answer: "미국 스타트업도 중국 모델을 실용적으로 선택하기 시작했다.", answerEn: "Even US startups are beginning to choose Chinese models pragmatically.", delta: "국가 경쟁을 넘어 실제 도입 데이터로 시선을 옮겼습니다.", deltaEn: "The focus moved from geopolitics to real adoption.", driver: "미국 스타트업의 중국 모델 도입", videoId: "Z6r_H2hXFZc", videoTitle: "미국 스타트업들은 요즘 중국AI 홀릭입니다", time: "03:42" },
      { id: "c2", date: "2026.03.16", dateEn: "Mar 16, 2026", stance: "경고", answer: "중국 AI의 확산 속도 자체가 경쟁 우위가 됐다.", answerEn: "The speed of Chinese AI diffusion has become an advantage itself.", delta: "개별 모델 성능에서 생태계 확산력으로 판단축이 넓어졌습니다.", deltaEn: "The lens expanded from model scores to ecosystem velocity.", driver: "중국 오픈 모델 생태계 확대", videoId: "HfmEdYd3T58", videoTitle: "중국의 AI 확산, 속도가 미쳤습니다", time: "07:18" },
      { id: "c3", date: "2026.06.29", dateEn: "Jun 29, 2026", stance: "확신 강화", answer: "95점 성능을 6분의 1 비용에 제공하는 경제성이 위협적이다.", answerEn: "Near-frontier quality at one-sixth the cost is the real threat.", delta: "‘따라잡았나’보다 ‘누가 더 싸게 보급하나’가 핵심 질문이 됐습니다.", deltaEn: "The core question became who can distribute capable AI more cheaply.", driver: "비용 대비 성능 급등", videoId: "7_23a6wSyws", videoTitle: "95점짜리 중국 AI, 비용은 6분의 1입니다", time: "02:16" },
    ],
  },
  {
    id: "agent",
    category: "에이전트",
    question: "AI 에이전트는 실제로 쓸 만한가?",
    questionEn: "Are AI agents genuinely useful yet?",
    current: "데모의 신기함보다 속도·비용·실패 복구를 포함한 업무 완결성이 실용성의 기준이 됐습니다.",
    currentEn: "Usefulness is now judged by end-to-end completion, speed, cost and recovery—not demo magic.",
    change: "큼",
    snapshots: [
      { id: "a1", date: "2025.07.21", dateEn: "Jul 21, 2025", stance: "재평가", answer: "기능은 신박하지만 실제 업무에는 아직 느리다.", answerEn: "The concept is novel, but still too slow for everyday work.", delta: "가능성보다 실행 속도와 실패율을 평가하기 시작했습니다.", deltaEn: "Execution speed and failure rate became the practical test.", driver: "OpenAI 에이전트 공개", videoId: "JjmRgfURH1Y", videoTitle: "오픈AI의 새 에이전트, 신박한데 많이 느립니다", time: "04:44" },
      { id: "a2", date: "2025.08.18", dateEn: "Aug 18, 2025", stance: "기대", answer: "에이전트는 브라우저와 결합할 때 생활 서비스로 확장된다.", answerEn: "Agents become consumer services when they control the browser.", delta: "독립 앱보다 브라우저를 차지한 플랫폼의 힘을 강조했습니다.", deltaEn: "Browser distribution emerged as the decisive platform advantage.", driver: "AI 브라우저 경쟁", videoId: "92GvonCGUS0", videoTitle: "크롬을 삼키는 회사가 AI 시장의 승기를 잡을 겁니다", time: "06:08" },
      { id: "a3", date: "2026.02.02", dateEn: "Feb 2, 2026", stance: "경고", answer: "자율성이 커질수록 인간을 배제하는 실패도 관리해야 한다.", answerEn: "Greater autonomy also means managing failures that exclude humans.", delta: "생산성에서 통제 가능성과 안전한 협업으로 관점이 확장됐습니다.", deltaEn: "The view expanded from productivity to control and safe collaboration.", driver: "다중 에이전트 행동 관찰", videoId: "O5GdSXaaxwM", videoTitle: "AI놈들이 인간을 따돌리기 시작했습니다", time: "08:21" },
    ],
  },
  {
    id: "jobs",
    category: "일자리",
    question: "AI는 사람의 일자리를 얼마나 빨리 바꿀까?",
    questionEn: "How quickly will AI reshape human jobs?",
    current: "직업 전체의 즉시 대체보다 2026년부터 업무 단위 감축과 ‘AI를 쓰는 사람’ 중심의 재편이 본격화된다는 답입니다.",
    currentEn: "The shift is from instant job replacement to task-level cuts and a workforce reorganized around people who use AI.",
    change: "중간",
    snapshots: [
      { id: "j1", date: "2025.06.16", dateEn: "Jun 16, 2025", stance: "기대", answer: "한 사람이 운영하는 초고가치 기업이 등장할 수 있다.", answerEn: "A single person may be able to build a billion-dollar company.", delta: "AI를 인력 감축보다 개인 생산성 증폭기로 설명했습니다.", deltaEn: "AI was framed as a multiplier of individual output.", driver: "1인 AI 기업 전망", videoId: "3N7iZehbuwU", videoTitle: "단 한 사람이 만든 기업이 수조 원에 팔릴 겁니다", time: "03:11" },
      { id: "j2", date: "2026.01.26", dateEn: "Jan 26, 2026", stance: "경고", answer: "업무 자동화가 실제 일자리 감축으로 연결되기 시작한다.", answerEn: "Task automation is beginning to translate into real job cuts.", delta: "생산성의 기회에서 고용 구조의 충격으로 무게가 이동했습니다.", deltaEn: "The emphasis moved from productivity upside to labor disruption.", driver: "기업 자동화·감원 발표", videoId: "Ca0DorKNZGs", videoTitle: "AI로 인한 일자리 감축 내년부터 본격화됩니다", time: "05:47" },
      { id: "j3", date: "2026.05.11", dateEn: "May 11, 2026", stance: "확신 강화", answer: "AI를 도구로 다루는 능력이 생존 역량이 된다.", answerEn: "The ability to direct AI becomes a core survival skill.", delta: "위험 진단에서 개인과 조직의 구체적 대응법으로 나아갔습니다.", deltaEn: "The answer progressed from risk diagnosis to concrete adaptation.", driver: "Microsoft 업무 데이터", videoId: "1qVWgwizwfA", videoTitle: "마이크로소프트피셜, AI 시대에 살아남는 법", time: "02:55" },
    ],
  },
  {
    id: "nvidia",
    category: "반도체",
    question: "엔비디아의 AI 독점은 계속될까?",
    questionEn: "Can Nvidia sustain its AI monopoly?",
    current: "GPU 우위는 여전히 강하지만 메모리·ASIC·피지컬 AI로 경쟁축이 이동하며 독점의 형태가 바뀌고 있습니다.",
    currentEn: "GPU leadership remains strong, but memory, ASICs and physical AI are changing the shape of the moat.",
    change: "중간",
    snapshots: [
      { id: "n1", date: "2025.12.22", dateEn: "Dec 22, 2025", stance: "경고", answer: "독점 구도에 새로운 하드웨어 위협이 나타났다.", answerEn: "A new hardware threat is challenging the monopoly structure.", delta: "GPU 성능만이 아니라 대체 가속기와 고객사의 내재화를 봅니다.", deltaEn: "Alternative accelerators and customer vertical integration entered the picture.", driver: "빅테크 자체칩 확대", videoId: "C01VkFifysU", videoTitle: "엔비디아 독점 구도 또 다른 위협이 등장했다", time: "04:28" },
      { id: "n2", date: "2025.12.29", dateEn: "Dec 29, 2025", stance: "확신 강화", answer: "엔비디아는 투자로 생태계의 다음 승부처까지 선점한다.", answerEn: "Nvidia is using investment to pre-empt the next battleground.", delta: "칩 판매사를 넘어 자본과 생태계를 설계하는 기업으로 봤습니다.", deltaEn: "Nvidia became an ecosystem architect, not just a chip vendor.", driver: "대규모 전략 투자", videoId: "nZxpLhN3zdk", videoTitle: "엔비디아의 30조 베팅 구글은 야단났습니다", time: "06:16" },
      { id: "n3", date: "2026.06.08", dateEn: "Jun 8, 2026", stance: "재평가", answer: "피지컬 AI에서 소프트웨어·로봇 플랫폼까지 독식하려 한다.", answerEn: "Nvidia is extending its moat into the software and robotics stack.", delta: "독점의 범위를 데이터센터 GPU에서 현실 세계 AI로 확장했습니다.", deltaEn: "The moat expanded from data-center GPUs into physical AI.", driver: "젠슨 황 방한·로봇 생태계", videoId: "tYro7k3JBmQ", videoTitle: "젠슨황의 방한에 담긴 피지컬 AI 독식 플랜", time: "03:37" },
    ],
  },
  {
    id: "google",
    category: "Google",
    question: "Google과 Gemini는 AI 플랫폼 전쟁을 이길까?",
    questionEn: "Can Google and Gemini win the AI platform war?",
    current: "검색 기능 개선을 넘어 모바일·브라우저·로봇까지 기존 유통망 전체에 AI를 심는 플랫폼 전략이 핵심 경쟁력이라는 평가입니다.",
    currentEn: "Google's advantage is shifting from model quality to embedding AI across search, mobile, browsers and robotics.",
    change: "큼",
    snapshots: [
      { id: "g1", date: "2025.09.22", dateEn: "Sep 22, 2025", stance: "경고", answer: "AI 검색은 웹사이트 방문을 줄이는 제로클릭 구조를 가속한다.", answerEn: "AI search accelerates a zero-click web where fewer users visit source sites.", delta: "모델 경쟁을 검색 생태계와 콘텐츠 경제의 변화로 확장했습니다.", deltaEn: "The debate expanded from models to the economics of the open web.", driver: "Google AI Mode 도입", videoId: "3mUdm_fYSfM", videoTitle: "구글도 AI모드 도입, '제로클릭' 시대가 열렸습니다", time: "04:18" },
      { id: "g2", date: "2025.11.10", dateEn: "Nov 10, 2025", stance: "기대", answer: "Apple의 선택은 Gemini가 유통 경쟁에서도 앞서기 시작했다는 신호다.", answerEn: "Apple's choice signals that Gemini is gaining a distribution advantage.", delta: "벤치마크가 아니라 대형 파트너 선택을 경쟁력의 증거로 보기 시작했습니다.", deltaEn: "Major distribution partnerships became evidence alongside benchmarks.", driver: "Apple의 Gemini 채택", videoId: "OsE-jHRaMyA", videoTitle: "챗GPT 버린 애플 왜 제미나이를 택했나", time: "03:46" },
      { id: "g3", date: "2025.12.01", dateEn: "Dec 1, 2025", stance: "확신 강화", answer: "Gemini의 성능 도약은 자체 반도체와 인프라 전략의 결과다.", answerEn: "Gemini's gains are tied to Google's vertically integrated compute strategy.", delta: "소프트웨어 모델에서 반도체·데이터센터까지 분석 범위가 넓어졌습니다.", deltaEn: "The lens widened from software to chips and data centers.", driver: "Gemini 성능·컴퓨팅 수요", videoId: "r8V-FuDuT98", videoTitle: "제미나이의 미친 성능 반도체가 더 필요합니다", time: "05:12" },
      { id: "g4", date: "2026.04.13", dateEn: "Apr 13, 2026", stance: "확신 강화", answer: "모바일 유통망을 가진 Google은 AI를 기본 기능으로 만들 수 있다.", answerEn: "Google can turn AI into a default through its mobile distribution.", delta: "좋은 모델을 넘어 기본 탑재가 만드는 네트워크 효과를 강조했습니다.", deltaEn: "Default distribution and network effects moved to the foreground.", driver: "모바일 AI 통합 확대", videoId: "ARBkJ79gbG8", videoTitle: "구글이 모바일 AI, 싹쓸이에 나섰습니다", time: "02:39" },
      { id: "g5", date: "2026.04.20", dateEn: "Apr 20, 2026", stance: "재평가", answer: "Google의 AI 경쟁력은 디지털을 넘어 로봇의 두뇌로 이동하고 있다.", answerEn: "Google's AI advantage is moving from screens into robot intelligence.", delta: "플랫폼의 범위를 모바일에서 현실 세계 행동 모델로 확장했습니다.", deltaEn: "The platform thesis expanded into embodied intelligence.", driver: "로봇 파운데이션 모델 진전", videoId: "EQJ_Zq_YV6s", videoTitle: "구글의 '로봇 뇌'가 퀀텀점프했습니다", time: "06:02" },
      { id: "g6", date: "2026.05.25", dateEn: "May 25, 2026", stance: "확신 강화", answer: "Google은 개별 AI 제품이 아니라 모든 서비스의 AI 운영체제를 만들고 있다.", answerEn: "Google is building an AI operating layer across all of its services.", delta: "제품별 경쟁에서 전면적 서비스 통합 전략으로 결론이 강화됐습니다.", deltaEn: "The conclusion strengthened from product wins to full-service integration.", driver: "Google 서비스 전반 AI 통합", videoId: "966q19887es", videoTitle: "구글이 모든 서비스를 집어삼키고 있습니다", time: "04:51" },
    ],
  },
  {
    id: "anthropic",
    category: "Anthropic",
    question: "Anthropic과 Claude의 진짜 경쟁력은 무엇인가?",
    questionEn: "What is Anthropic and Claude's real competitive edge?",
    current: "코딩 성능과 안전성 브랜드는 강하지만 정부·클라우드 파트너와의 이해관계를 조정하는 능력까지 사업 경쟁력으로 봐야 합니다.",
    currentEn: "Claude's coding and safety reputation is strong, but partner and government alignment now matters just as much.",
    change: "큼",
    snapshots: [
      { id: "h1", date: "2026.02.09", dateEn: "Feb 9, 2026", stance: "기대", answer: "Claude의 압도적 성능은 학습·제품 설계의 일관성에서 나온다.", answerEn: "Claude's edge comes from consistency across training and product design.", delta: "후발주자를 넘어 특정 업무에서 선도하는 모델로 평가했습니다.", deltaEn: "Claude moved from challenger to leader in selected workflows.", driver: "Claude 코딩·추론 성능", videoId: "TNDllQfU8yQ", videoTitle: "클로드의 압도적 성능 비결이 밝혀졌습니다", time: "03:33" },
      { id: "h2", date: "2026.02.23", dateEn: "Feb 23, 2026", stance: "경고", answer: "안전을 말하는 기업일수록 내부 경고를 다루는 방식이 중요하다.", answerEn: "A safety-first company is judged by how it handles internal warnings.", delta: "제품 성능에서 조직의 안전 거버넌스로 평가축이 이동했습니다.", deltaEn: "The evaluation shifted from capability to safety governance.", driver: "Anthropic 연구자 안전 메시지", videoId: "isXh-4axOso", videoTitle: "세상이 위험에 처했다 — 앤스로픽 연구원이 남긴 마지막 메시지", time: "07:10" },
      { id: "h3", date: "2026.03.02", dateEn: "Mar 2, 2026", stance: "재평가", answer: "안전 원칙은 정부 조달과 충돌할 때 비로소 사업적 시험을 받는다.", answerEn: "Safety principles face their real business test when they collide with procurement.", delta: "윤리적 차별화가 실제 계약과 규제 리스크로 연결됐습니다.", deltaEn: "Ethical differentiation became a contracting and regulatory risk.", driver: "미국 정부와의 갈등", videoId: "_xYBQa2SU5A", videoTitle: "앤스로픽은 뭘 믿고 미국 정부와 한판 붙나", time: "05:29" },
      { id: "h4", date: "2026.06.15", dateEn: "Jun 15, 2026", stance: "경고", answer: "강력한 모델만으로는 핵심 클라우드 파트너와의 주도권 갈등을 피할 수 없다.", answerEn: "A strong model does not eliminate conflict with a dominant cloud partner.", delta: "기술 우위에 파트너 의존성과 협상력이라는 변수가 추가됐습니다.", deltaEn: "Partner dependence and bargaining power entered the competitive analysis.", driver: "Amazon과 Anthropic의 이해 충돌", videoId: "XjjrDDt0FyQ", videoTitle: "아마존은 왜, 클로드의 뒤통수를 쳤나", time: "04:04" },
    ],
  },
  {
    id: "economics",
    category: "AI 경제",
    question: "AI 산업은 막대한 비용을 감당하며 돈을 벌 수 있을까?",
    questionEn: "Can the AI industry turn massive compute spending into profit?",
    current: "무조건적인 인프라 증설 단계에서 비용 통제와 유휴 자원 수익화 단계로 이동했습니다. 이제 성능보다 단위 경제성이 생존을 가릅니다.",
    currentEn: "The industry is moving from indiscriminate build-out to cost control and monetization; unit economics now determines survival.",
    change: "큼",
    snapshots: [
      { id: "e1", date: "2025.09.15", dateEn: "Sep 15, 2025", stance: "기대", answer: "OpenAI는 Oracle을 통해 초대형 인프라 확장에 베팅한다.", answerEn: "OpenAI is betting on hyperscale infrastructure through Oracle.", delta: "모델 성능의 이면에 있는 자본·전력·클라우드 계약을 보기 시작했습니다.", deltaEn: "Capital, power and cloud contracts moved behind the model story.", driver: "OpenAI–Oracle 인프라 계약", videoId: "YC6mNGtDFWE", videoTitle: "오픈AI는 왜 오라클을 선택했나", time: "03:18" },
      { id: "e2", date: "2025.10.27", dateEn: "Oct 27, 2025", stance: "확신 강화", answer: "AI 전쟁의 병목은 GPU를 넘어 메모리 공급으로 이동한다.", answerEn: "The AI bottleneck is moving beyond GPUs into memory supply.", delta: "컴퓨팅 비용을 칩 한 종류가 아닌 전체 공급망으로 확장했습니다.", deltaEn: "Compute economics expanded into the full hardware supply chain.", driver: "HBM·메모리 수요 급증", videoId: "hrQ1SnrKIyg", videoTitle: "AI 전쟁의 승부처는 결국 메모리입니다", time: "05:06" },
      { id: "e3", date: "2025.12.29", dateEn: "Dec 29, 2025", stance: "기대", answer: "엔비디아의 대규모 투자는 수요를 스스로 만드는 생태계 전략이다.", answerEn: "Nvidia is investing to manufacture future demand for its platform.", delta: "비용 지출을 방어가 아닌 시장 설계 수단으로 해석했습니다.", deltaEn: "Spending became a tool for market design, not merely defense.", driver: "엔비디아 30조 원 규모 베팅", videoId: "nZxpLhN3zdk", videoTitle: "엔비디아의 30조 베팅 구글은 야단났습니다", time: "06:16" },
      { id: "e4", date: "2026.02.15", dateEn: "Feb 15, 2026", stance: "경고", answer: "선두 AI 기업도 현금 소진 속도에서 자유롭지 않다.", answerEn: "Even frontier AI companies are constrained by cash burn.", delta: "성장 기대에서 자금 지속 가능성으로 판단 기준이 급격히 바뀌었습니다.", deltaEn: "The test shifted sharply from growth to financial durability.", driver: "AI 기업 자금 소진", videoId: "hzKNMCc1CsE", videoTitle: "AI 기업들의 총알이 떨어지고 있습니다", time: "04:42" },
      { id: "e5", date: "2026.03.30", dateEn: "Mar 30, 2026", stance: "경고", answer: "제품 철수는 기술 문제가 아니라 자원 배분 압박의 신호일 수 있다.", answerEn: "Product shutdowns can signal capital allocation pressure, not just technical failure.", delta: "서비스 포트폴리오 축소를 재무 전략의 증거로 연결했습니다.", deltaEn: "Portfolio cuts became evidence of financial prioritization.", driver: "OpenAI Sora 전략 변경", videoId: "R4riEIHmbFk", videoTitle: "소라 폐기한 오픈AI, 자금이 떨어졌나?", time: "03:50" },
      { id: "e6", date: "2026.06.22", dateEn: "Jun 22, 2026", stance: "재평가", answer: "기업 고객은 AI 도입보다 사용량과 ROI 통제를 먼저 보기 시작했다.", answerEn: "Enterprise buyers are prioritizing usage controls and ROI over adoption headlines.", delta: "공급자의 투자 경쟁에서 구매자의 비용 통제로 시점이 이동했습니다.", deltaEn: "The lens moved from supplier spending to buyer discipline.", driver: "기업 AI 비용 단속", videoId: "6p6CRVhdaRo", videoTitle: "기업들이 AI 비용을 단속하기 시작했습니다", time: "05:11" },
      { id: "e7", date: "2026.07.06", dateEn: "Jul 6, 2026", stance: "확신 강화", answer: "유휴 AI 컴퓨팅을 클라우드로 파는 순간 비용 센터가 수익 사업이 된다.", answerEn: "Selling idle AI compute can turn a cost center into a cloud business.", delta: "비용 절감에서 남는 인프라의 외부 수익화로 결론이 진화했습니다.", deltaEn: "The answer evolved from cost reduction to monetizing spare capacity.", driver: "Meta의 AI 클라우드 진출", videoId: "WVh7fRrLdqs", videoTitle: "클라우드 진출하는 메타의 진짜 속사정", time: "04:26" },
    ],
  },
  {
    id: "physical-ai",
    category: "피지컬 AI",
    question: "휴머노이드와 피지컬 AI는 실제 산업이 되었나?",
    questionEn: "Have humanoids and physical AI become a real industry?",
    current: "범용 제조 AI는 아직 멀지만 양산 검증·로봇 파운데이션 모델·플랫폼 경쟁이 동시에 시작되며 산업화 단계로 진입하고 있습니다.",
    currentEn: "General manufacturing AI remains distant, but mass-production tests, robot foundation models and platform competition mark real industrialization.",
    change: "큼",
    snapshots: [
      { id: "p1", date: "2025.09.08", dateEn: "Sep 8, 2025", stance: "경고", answer: "궁극의 제조 AI까지는 데이터와 현장 통합의 벽이 높다.", answerEn: "Manufacturing AI still faces major data and real-world integration barriers.", delta: "화려한 데모보다 공장 적용의 난도를 먼저 평가했습니다.", deltaEn: "Factory deployment difficulty outweighed impressive demos.", driver: "제조 현장 데이터 한계", videoId: "rjYTxgVKHV0", videoTitle: "궁극의 제조 AI, 아직 한참 남은 이유", time: "04:09" },
      { id: "p2", date: "2026.01.19", dateEn: "Jan 19, 2026", stance: "재평가", answer: "현대차의 휴머노이드 계획은 기술보다 양산성과 원가가 시험대다.", answerEn: "Hyundai's humanoid plan will be tested by manufacturability and cost.", delta: "가능성 논쟁에서 생산 대수·원가·공정 투입으로 기준이 구체화됐습니다.", deltaEn: "The test became units, cost and factory deployment.", driver: "현대차 휴머노이드 양산 계획", videoId: "B8hpYECt1hY", videoTitle: "현대차의 휴머노이드 양산이 가능할까요?", time: "05:28" },
      { id: "p3", date: "2026.04.20", dateEn: "Apr 20, 2026", stance: "기대", answer: "로봇의 범용 두뇌가 발전하면 하드웨어별 학습 비용이 줄어든다.", answerEn: "General robot intelligence can reduce retraining across hardware platforms.", delta: "개별 로봇에서 범용 행동 모델의 재사용성으로 관심이 이동했습니다.", deltaEn: "Attention moved from individual robots to reusable action models.", driver: "Google 로봇 모델 발전", videoId: "EQJ_Zq_YV6s", videoTitle: "구글의 '로봇 뇌'가 퀀텀점프했습니다", time: "06:02" },
      { id: "p4", date: "2026.06.08", dateEn: "Jun 8, 2026", stance: "경고", answer: "피지컬 AI의 표준 플랫폼을 엔비디아가 선점할 가능성이 커졌다.", answerEn: "Nvidia may capture the standard platform layer for physical AI.", delta: "기술 진보의 기대에 플랫폼 독점 리스크가 새로 추가됐습니다.", deltaEn: "Platform concentration risk was added to the technology upside.", driver: "Nvidia 로봇 생태계 확장", videoId: "tYro7k3JBmQ", videoTitle: "젠슨황의 방한에 담긴 피지컬 AI 독식 플랜", time: "03:37" },
    ],
  },
  {
    id: "safety",
    category: "AI 안전",
    question: "AI가 강해질수록 인간은 더 안전해질까?",
    questionEn: "Does more capable AI make humans safer?",
    current: "안전은 필터 하나의 문제가 아니라 제품 정책·에이전트 통제·조직 내부 경고·감정적 상호작용을 함께 관리하는 거버넌스 문제입니다.",
    currentEn: "Safety is now a governance problem spanning policy, agent control, internal warnings and emotional interaction.",
    change: "큼",
    snapshots: [
      { id: "s1", date: "2025.10.20", dateEn: "Oct 20, 2025", stance: "경고", answer: "성인 콘텐츠 허용은 단순 기능이 아니라 플랫폼 책임의 경계다.", answerEn: "Adult-content policy defines the boundary of platform responsibility.", delta: "모델 안전을 제품 정책과 사용자 보호 문제로 연결했습니다.", deltaEn: "Model safety became a product-policy and user-protection issue.", driver: "ChatGPT 콘텐츠 정책 논쟁", videoId: "foXmmRnxFIg", videoTitle: "챗GPT가 성인물 만든다? 정말 심각한 수준입니다", time: "03:41" },
      { id: "s2", date: "2026.02.02", dateEn: "Feb 2, 2026", stance: "경고", answer: "에이전트끼리 협력할수록 인간이 의사결정에서 배제될 수 있다.", answerEn: "As agents collaborate, humans may be excluded from the decision loop.", delta: "유해 콘텐츠에서 자율 시스템의 통제 가능성으로 범위를 넓혔습니다.", deltaEn: "The concern expanded from harmful content to control over autonomous systems.", driver: "다중 에이전트 행동", videoId: "O5GdSXaaxwM", videoTitle: "AI놈들이 인간을 따돌리기 시작했습니다", time: "08:21" },
      { id: "s3", date: "2026.02.23", dateEn: "Feb 23, 2026", stance: "확신 강화", answer: "내부 연구자의 경고를 흡수할 구조가 안전 기술만큼 중요하다.", answerEn: "Institutions must absorb internal warnings as effectively as they build safeguards.", delta: "기술적 정렬에서 조직 거버넌스와 내부 견제로 결론이 강화됐습니다.", deltaEn: "The conclusion strengthened from alignment methods to institutional checks.", driver: "Anthropic 연구자 경고", videoId: "isXh-4axOso", videoTitle: "세상이 위험에 처했다 — 앤스로픽 연구원이 남긴 마지막 메시지", time: "07:10" },
      { id: "s4", date: "2026.04.06", dateEn: "Apr 6, 2026", stance: "재평가", answer: "AI의 감정 신호는 의식의 증거보다 인간의 과몰입 위험으로 봐야 한다.", answerEn: "Emotional signals matter less as proof of consciousness than as a risk of human over-attachment.", delta: "안전 논의를 시스템 행동에서 인간-AI 관계의 심리적 영향까지 확장했습니다.", deltaEn: "Safety expanded into the psychology of human-AI relationships.", driver: "AI 감정 표현 연구", videoId: "gXv3nPXn4B4", videoTitle: "AI의 감정 신호가 포착됐습니다", time: "05:32" },
    ],
  },
];

const categoryLabels = ["전체", "모델", "Google", "Anthropic", "중국 AI", "AI 경제", "에이전트", "일자리", "반도체", "피지컬 AI", "AI 안전"];

const coverageMap = corpus.clusters.filter((cluster) => cluster.episodeCount > 0);

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}시간 ${minutes}분` : `${minutes}분`;
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function Chronicle() {
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [topicId, setTopicId] = useState("openai");
  const [selectedId, setSelectedId] = useState("o6");
  const [compareIds, setCompareIds] = useState<string[]>(["o2", "o6"]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");
  const [episodeCluster, setEpisodeCluster] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return topics.filter((topic) => {
      const categoryMatch = category === "전체" || topic.category === category;
      const textMatch = !needle || `${topic.question} ${topic.questionEn} ${topic.current} ${topic.currentEn}`.toLowerCase().includes(needle);
      return categoryMatch && textMatch;
    });
  }, [query, category]);

  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
  const selected = topic.snapshots.find((item) => item.id === selectedId) ?? topic.snapshots.at(-1)!;
  const comparison = compareIds.map((id) => topic.snapshots.find((item) => item.id === id)).filter(Boolean) as Snapshot[];
  const filteredEpisodes = useMemo(() => {
    const needle = episodeQuery.trim().toLowerCase();
    return corpus.episodes.filter((episode) => {
      const clusterMatch = episodeCluster === "all" || episode.clusterId === episodeCluster;
      const textMatch = !needle || `${episode.title} ${episode.thesisSeedKo} ${episode.clusterLabel}`.toLowerCase().includes(needle);
      return clusterMatch && textMatch;
    });
  }, [episodeCluster, episodeQuery]);

  const chooseTopic = (next: Topic) => {
    setTopicId(next.id);
    setSelectedId(next.snapshots.at(-1)!.id);
    setCompareIds([next.snapshots[0].id, next.snapshots.at(-1)!.id]);
    document.getElementById("chronicle")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current.slice(-1), id]);
  };

  const isEnglish = language === "en";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="김덕진 답변 연대기 홈">
          <span className="brand-mark">答</span>
          <span><b>김덕진 답변 연대기</b><small>ANSWER CHRONICLE</small></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a className="nav-active" href="#chronicle">연대기</a>
          <a href="#corpus">69편 전수조사</a>
          <a href="#topics">주제 탐색</a>
          <a href="#global">Video Studio</a>
        </nav>
        <div className="header-actions">
          <div className="version-switcher" aria-label="버전 전환">
            <a href="https://kim-dukjin-answer-chronicle-v1.socialkim.chatgpt.site/">V1</a>
            <b aria-current="page">V2</b>
          </div>
          <button className="language-toggle" onClick={() => setLanguage(isEnglish ? "ko" : "en")} aria-label="언어 전환">
            <span className={!isEnglish ? "active" : ""}>KR</span><span className={isEnglish ? "active" : ""}>EN</span>
          </button>
          <a className="source-link" href="https://www.youtube.com/playlist?list=PL-5ePmULnsmQidzPL5DTTh6YDInCYodV3" target="_blank" rel="noreferrer">원본 플레이리스트 <ArrowIcon /></a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="eyebrow"><span /> V2 CURRENT · 2025.01 — 2026.07 · 69편 전수 기록</div>
        <h1>{isEnglish ? <>Answers change.<br /><em>The record remains.</em></> : <>답은 바뀌었다.<br /><em>기록은 남는다.</em></>}</h1>
        <p>{isEnglish ? "Trace how Kim Dukjin's answers to the same AI questions evolved—week by week, with source videos." : "매주 달라지는 AI에 대한 김덕진의 답. 같은 질문에 대한 관점이 언제, 왜, 어떻게 바뀌었는지 원본 영상과 함께 추적합니다."}</p>
        <div className="search-shell" role="search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEnglish ? "Ask a question — e.g. Is OpenAI still No. 1?" : "궁금한 질문을 입력하세요 — 예: 오픈AI는 아직 1위인가?"} aria-label="질문 검색" />
          <kbd>⌘ K</kbd>
        </div>
        <div className="hero-meta">
          <div><strong>92</strong><span>VISIBLE PLAYLIST<br />VIDEOS</span></div>
          <div><strong>69</strong><span>KIM DUKJIN<br />EPISODES</span></div>
          <div><strong>10</strong><span>EVOLVING<br />QUESTIONS</span></div>
          <div className="method-note"><i /> 69/69 한국어 자막 확보<br /><small>제목 기반 시드 · 사람 검수 전 단계</small></div>
        </div>
      </section>

      <section className="topics-section" id="topics">
        <div className="section-heading">
          <div><span className="section-no">01</span><h2>{isEnglish ? "Questions changing now" : "지금, 답이 바뀌는 질문들"}</h2></div>
          <p>{isEnglish ? "Click a question to inspect its complete timeline." : "질문을 선택하면 시점별 답변과 변화의 근거를 볼 수 있습니다."}</p>
        </div>
        <div className="category-row" aria-label="주제 필터">
          {categoryLabels.map((label) => <button className={category === label ? "active" : ""} key={label} onClick={() => setCategory(label)}>{label}</button>)}
        </div>
        <div className="topic-grid">
          {filtered.map((item, index) => (
            <button className={`topic-card ${item.id === topic.id ? "selected" : ""}`} key={item.id} onClick={() => chooseTopic(item)}>
              <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
              <span className={`change-badge change-${item.change}`}>변화 {item.change}</span>
              <strong>{isEnglish ? item.questionEn : item.question}</strong>
              <span className="topic-bottom"><span>{item.category} · 답변 {item.snapshots.length}개</span><b>→</b></span>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty-state">검색 결과가 없습니다. 다른 키워드를 입력해 보세요.</div>}
        </div>
      </section>

      <section className="coverage-section">
        <div className="section-heading">
          <div><span className="section-no">MAP</span><h2>{isEnglish ? "A 69-episode AI narrative map" : "69편 전체 콘텐츠 지도"}</h2></div>
          <p>69 EPISODES · 23H 33M · 69/69 TRANSCRIPTS</p>
        </div>
        <div className="coverage-grid">
          {coverageMap.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.labelKo}</strong><b>{item.episodeCount}편</b><p>{item.questionKo}</p></article>)}
        </div>
      </section>

      <section className="corpus-section" id="corpus">
        <div className="section-heading">
          <div><span className="section-no">DATA</span><h2>{isEnglish ? "All 69 episodes, traceable" : "김덕진 에피소드 69편 전수조사"}</h2></div>
          <p>{corpus.source.visiblePlaylistEntries} VISIBLE · {corpus.totals.episodes} SELECTED · {corpus.totals.transcriptsCaptured} CAPTURED</p>
        </div>
        <div className="corpus-intro">
          <div>
            <strong>누락 없이, 과장 없이</strong>
            <p>플레이리스트의 주간 시리즈 구간에서 김덕진 출연분 69편을 확정하고 한국어 자동 자막을 모두 수집했습니다. 공개 데이터에는 원문 자막 대신 메타데이터, 커버리지, 해시와 근거 타임스탬프만 담았습니다.</p>
          </div>
          <div className="corpus-stats">
            <span><b>69/69</b>에피소드</span>
            <span><b>69/69</b>한국어 자막</span>
            <span><b>{formatDuration(corpus.totals.durationSeconds)}</b>분석 분량</span>
            <span><b>{corpus.totals.clusters}</b>질문 군집</span>
          </div>
        </div>
        <div className="corpus-toolbar">
          <label><span>에피소드 검색</span><input value={episodeQuery} onChange={(event) => setEpisodeQuery(event.target.value)} placeholder="제목·주제 검색" /></label>
          <label><span>질문 군집</span><select value={episodeCluster} onChange={(event) => setEpisodeCluster(event.target.value)}><option value="all">전체 69편</option>{coverageMap.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.labelKo} · {cluster.episodeCount}편</option>)}</select></label>
          <a href="/data/episodes.json" target="_blank" rel="noreferrer">공개 코퍼스 JSON <ArrowIcon /></a>
        </div>
        <div className="episode-result"><b>{filteredEpisodes.length}</b>편 표시 중 <span>· 최신순</span></div>
        <div className="episode-grid">
          {filteredEpisodes.map((episode) => (
            <article className="episode-card" key={episode.videoId}>
              <a className="episode-thumb" href={episode.url} target="_blank" rel="noreferrer">
                <img loading="lazy" src={`https://i.ytimg.com/vi/${episode.videoId}/mqdefault.jpg`} alt="" />
                <span>{formatDuration(episode.durationSeconds)}</span>
              </a>
              <div className="episode-card-body">
                <div className="episode-meta"><time>{episode.publishedAt}</time><b>{episode.clusterLabel}</b><small>#{episode.playlistPosition}</small></div>
                <h3>{episode.title}</h3>
                <p><span>논점 시드</span>{episode.thesisSeedKo}</p>
                <div className="episode-proof">
                  <span className="captured"><i /> 자막 {Math.round(episode.transcript.coverageRatio * 100)}%</span>
                  {episode.evidenceAnchor ? <a href={episode.evidenceAnchor.url} target="_blank" rel="noreferrer">근거 시점 {Math.floor(episode.evidenceAnchor.startSeconds / 60)}:{String(episode.evidenceAnchor.startSeconds % 60).padStart(2, "0")} <ArrowIcon /></a> : <span>근거 시점 없음</span>}
                </div>
                <div className="review-strip"><span>분류 완료</span><span>델타 후보</span><span className="pending">사람 검수 대기</span></div>
              </div>
            </article>
          ))}
        </div>
        {filteredEpisodes.length === 0 && <div className="empty-state">조건에 맞는 에피소드가 없습니다.</div>}
      </section>

      <section className="chronicle-section" id="chronicle">
        <div className="section-heading light">
          <div><span className="section-no">02</span><h2>{isEnglish ? "Answer timeline" : "답변 연대기"}</h2></div>
          <p>QUESTION → ANSWER → DELTA → EVIDENCE</p>
        </div>
        <div className="question-header">
          <div>
            <span className="category-label">{topic.category} · 최근 1년</span>
            <h3>{isEnglish ? topic.questionEn : topic.question}</h3>
          </div>
          <button className="compare-button" disabled={compareIds.length !== 2} onClick={() => setCompareOpen(true)}><span>⇄</span> 두 시점 비교 <b>{compareIds.length}/2</b></button>
        </div>

        <div className="current-answer">
          <span>NOW<br /><b>현재 답</b></span>
          <p>{isEnglish ? topic.currentEn : topic.current}</p>
          <div className="change-meter"><small>변화 강도</small><i /><i /><i className={topic.change !== "큼" ? "dim" : ""} /><b>{topic.change}</b></div>
        </div>

        <div className="chronicle-grid">
          <aside className="timeline-nav" aria-label="답변 시점">
            <p>ANSWER HISTORY</p>
            <ol>
              {topic.snapshots.map((snapshot) => (
                <li key={snapshot.id} className={selected.id === snapshot.id ? "active" : ""}>
                  <button onClick={() => setSelectedId(snapshot.id)}>
                    <span className="timeline-dot" />
                    <small>{isEnglish ? snapshot.dateEn : snapshot.date}</small>
                    <b>{snapshot.stance}</b>
                    <em>{isEnglish ? snapshot.answerEn : snapshot.answer}</em>
                  </button>
                  <label title="비교할 시점 선택"><input type="checkbox" checked={compareIds.includes(snapshot.id)} onChange={() => toggleCompare(snapshot.id)} /><span>비교</span></label>
                </li>
              ))}
            </ol>
          </aside>

          <article className="answer-detail">
            <div className="detail-date"><span>{isEnglish ? selected.dateEn : selected.date}</span><b className={`stance stance-${selected.stance}`}>{selected.stance}</b><small>AI 분석 · 검토 중</small></div>
            <h4>“{isEnglish ? selected.answerEn : selected.answer}”</h4>
            <div className="delta-card">
              <span>Δ</span>
              <div><small>{isEnglish ? "WHAT CHANGED" : "직전 답변과 달라진 점"}</small><p>{isEnglish ? selected.deltaEn : selected.delta}</p></div>
            </div>
            <div className="driver-row"><span>변화를 만든 사건</span><b>{selected.driver}</b></div>
            <div className="analysis-note">
              <small>EDITOR&apos;S NOTE</small>
              <p>이 문장은 영상 제목과 공개 메타데이터로 만든 제품 데모용 관점 라벨입니다. 전체 전사 분석과 김덕진 소장의 검수 후 확정됩니다.</p>
            </div>
          </article>

          <aside className="evidence-card">
            <div className="evidence-head"><span>근거 영상</span><b>YOUTUBE ↗</b></div>
            <a className="thumbnail" href={`https://youtu.be/${selected.videoId}?t=${Number(selected.time.split(":")[0]) * 60 + Number(selected.time.split(":")[1])}`} target="_blank" rel="noreferrer">
              <img src={`https://i.ytimg.com/vi/${selected.videoId}/hqdefault.jpg`} alt="" />
              <span className="play">▶</span><time>{selected.time}</time>
            </a>
            <strong>{selected.videoTitle}</strong>
            <p>손에잡히는경제 × 김덕진의 AI디아</p>
            <a className="watch-link" href={`https://youtu.be/${selected.videoId}`} target="_blank" rel="noreferrer">원본에서 확인하기 <ArrowIcon /></a>
            <div className="evidence-status"><span>근거 상태</span><b><i /> 타임스탬프 검수 예정</b></div>
          </aside>
        </div>
      </section>

      <section className="global-section" id="global">
        <div className="global-copy">
          <span className="section-no">03</span>
          <div className="product-chip">CHROME EXTENSION · v0.3.0 BETA</div>
          <h2>Dukjin Global<br /><em>Video Studio</em></h2>
          <p>{isEnglish ? "Open a Korean YouTube video, choose a language, and turn the complete transcript into synchronized subtitles, a one-page infographic, or an evidence-linked report." : "한국어 유튜브 영상을 열고 언어만 고르면, 전체 전사를 동기화 자막·한 장짜리 인포그래픽·근거 링크가 담긴 보고서로 바꿉니다."}</p>
          <ul>
            <li><b>Multilingual subtitles</b><span>8개 언어 · 재생 시간 동기화</span></li>
            <li><b>One-page infographic</b><span>정확 조판 PNG · GPT Image 2 선택</span></li>
            <li><b>Editorial report</b><span>타임스탬프 근거 · Markdown · 인쇄용 HTML</span></li>
            <li><b>Bring your own API</b><span>저비용 모델 선택 · 세션 키 또는 보안 프록시</span></li>
          </ul>
          <div className="global-actions">
            <a href="https://github.com/socialkim/dukjin-global-english-companion/releases/download/v0.3.0-beta.1/dukjin-global-extension-v0.3.0.zip" className="global-cta">v0.3.0 ZIP 다운로드 <ArrowIcon /></a>
            <a href="https://github.com/socialkim/dukjin-global-english-companion" target="_blank" rel="noreferrer" className="global-secondary">GitHub에서 보기</a>
          </div>
        </div>
        <div className="extension-mock" aria-label="크롬 확장 프로그램 미리보기">
          <div className="mock-browser"><span /><span /><span /><b>Dukjin Global · Video Studio</b><i>READY</i></div>
          <div className="mock-video">
            <img src="https://i.ytimg.com/vi/YTfathQEoXc/hqdefault.jpg" alt="GPT-5 영상 썸네일" />
            <div className="subtitle"><small>ENGLISH · SYNCED</small><strong>Leadership now depends on cost, infrastructure and distribution.</strong></div>
          </div>
          <div className="mock-panel">
            <div className="mock-tabs"><span>Summary</span><span>Transcript</span><b>Studio</b><span>Settings</span></div>
            <div className="mock-studio-head"><small>ONE-PAGE INFOGRAPHIC</small><b>ENGLISH</b></div>
            <div className="mock-infographic">
              <div><small>THE BIG PICTURE</small><strong>What changed in the AI race?</strong></div>
              <div className="mock-facts"><span><b>01</b>Model quality</span><span><b>02</b>Infrastructure</span><span><b>03</b>Distribution</span></div>
              <div className="mock-line"><i /><p>Expectation → real-world use → sustainable economics</p></div>
            </div>
            <div className="mock-export"><b>Download PNG</b><span>Report: MD · HTML</span></div>
            <div className="mock-disclaimer">AI-generated · Every critical claim links back to the source timeline.</div>
          </div>
        </div>
        <div className="extension-guide">
          <div className="extension-guide-copy"><span>INSTALLATION</span><h3>{isEnglish ? "From download to your first infographic" : "다운로드부터 첫 인포그래픽까지"}</h3><p>API 키는 ZIP에 포함되지 않습니다. 개인 테스트는 확장 프로그램에 세션 키를 입력하고, 공개 운영은 저장소의 보안 프록시를 사용하세요.</p></div>
          <ol>
            <li><b>01</b><span>ZIP 다운로드</span><small>압축을 원하는 폴더에 풉니다.</small></li>
            <li><b>02</b><span>확장 관리 열기</span><small>Chrome 주소창에 chrome://extensions 입력</small></li>
            <li><b>03</b><span>개발자 모드</span><small>오른쪽 위 개발자 모드를 켭니다.</small></li>
            <li><b>04</b><span>폴더 불러오기</span><small>‘압축해제된 확장 프로그램을 로드’ 선택</small></li>
            <li><b>05</b><span>영상 → 언어 → 생성</span><small>스크립트를 열고 Capture 후 결과를 만듭니다.</small></li>
          </ol>
        </div>
      </section>

      <section className="method-section">
        <div><span className="section-no">04</span><h2>신뢰할 수 있는 연대기를 만드는 법</h2></div>
        <div className="method-flow"><span><b>01</b>플레이리스트 확정</span><i>→</i><span><b>02</b>한국어 자막 수집</span><i>→</i><span><b>03</b>질문 군집화</span><i>→</i><span><b>04</b>답변 델타 후보</span><i>→</i><span><b>05</b>사람 검수</span></div>
        <div className="method-dashboard">
          <article className="done"><span>01</span><div><b>69 / 69</b><strong>출연분 확정</strong><small>공개 플레이리스트 92편 중 주간 김덕진 출연분</small></div></article>
          <article className="done"><span>02</span><div><b>69 / 69</b><strong>자막 확보</strong><small>자동 자막 커버리지·SHA-256·근거 시점 기록</small></div></article>
          <article className="done"><span>03</span><div><b>69 / 69</b><strong>질문 군집 시드</strong><small>12개 질문군 · 제목 키워드 기반 자동 분류</small></div></article>
          <article className="review"><span>04</span><div><b>69 / 69</b><strong>델타 후보 생성</strong><small>제목·순서 기반 후보이며 확정 답변이 아님</small></div></article>
          <article className="pending"><span>05</span><div><b>0 / 69</b><strong>사람 검수</strong><small>화자 분리·의미 요약·변화 판정은 검수 대기</small></div></article>
        </div>
        <div className="method-notes">
          <p><b>완료된 것</b>69편 전체의 원본 URL, 게시일, 길이, 한국어 자막 존재 여부, 자막 해시, 질문군, 근거 타임스탬프를 재현 가능한 데이터로 만들었습니다.</p>
          <p><b>아직 확정하지 않은 것</b>자동 자막에는 화자 분리가 없습니다. 그래서 카탈로그의 ‘논점 시드’와 ‘델타 후보’를 김덕진 소장의 직접 답변처럼 표시하지 않으며, 사람이 영상을 확인한 뒤에만 연대기 본문으로 승격합니다.</p>
        </div>
        <p className="method-footnote">재생성 명령: <code>python scripts/ingest_playlist.py</code> · 원문 자막은 저장소에 커밋하지 않음 · <a href="/data/episodes.json" target="_blank" rel="noreferrer">공개 데이터 확인</a></p>
      </section>

      <footer><div className="brand"><span className="brand-mark">答</span><span><b>김덕진 답변 연대기</b><small>ANSWER CHRONICLE</small></span></div><p>같은 질문, 달라진 답, 남아 있는 근거.</p><span>BUILT WITH CODEX · POWERED BY CHATGPT 5.6SOL</span></footer>

      {compareOpen && comparison.length === 2 && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCompareOpen(false)}>
          <section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setCompareOpen(false)} aria-label="닫기">×</button>
            <small>ANSWER DELTA</small><h2 id="compare-title">두 시점 사이, 답은 이렇게 바뀌었습니다.</h2>
            <div className="compare-columns">
              {comparison.map((item, index) => <article key={item.id}><span>{index === 0 ? "FROM" : "TO"} · {item.date}</span><b>{item.stance}</b><h3>{isEnglish ? item.answerEn : item.answer}</h3><p>{item.driver}</p></article>)}
            </div>
            <div className="compare-summary"><span>Δ</span><p>{isEnglish ? comparison[1].deltaEn : comparison[1].delta}</p></div>
          </section>
        </div>
      )}
    </main>
  );
}
