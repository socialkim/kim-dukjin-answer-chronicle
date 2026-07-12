#!/usr/bin/env python3
"""Create a many-to-many question atlas from the 69-episode caption corpus."""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EPISODES_PATH = ROOT / "data" / "episodes.json"
CACHE_DIR = ROOT / ".cache" / "dukjin-transcripts"
OUTPUTS = [ROOT / "data" / "question-atlas.json", ROOT / "public" / "data" / "question-atlas.json"]


def q(id: str, category: str, cluster: str, question: str, lens: str, *keywords: str) -> dict[str, Any]:
    return {"id": id, "category": category, "clusterId": cluster, "questionKo": question, "lensKo": lens, "keywords": list(keywords)}


QUESTIONS = [
    q("openai-lead", "OpenAI", "openai", "OpenAI는 여전히 AI 시장의 선두인가?", "기술 리더십", "오픈ai", "openai", "챗gpt", "gpt-5", "gpt5", "1위", "왕의 귀환"),
    q("openai-model", "OpenAI", "openai", "GPT의 성능 향상은 실제 체감 가치로 이어지는가?", "모델 성능과 실사용", "gpt-5", "gpt5", "5.5", "최신 모델", "성능", "잘 쓰는 법", "헛소리"),
    q("openai-reliability", "OpenAI", "openai", "ChatGPT는 대규모 서비스의 안정성을 확보했는가?", "신뢰성과 장애", "먹통", "장애", "안정", "신뢰", "환각", "헛소리"),
    q("openai-economics", "OpenAI", "openai", "OpenAI의 막대한 비용 구조는 지속 가능한가?", "비용과 자금", "비용", "자금", "총알", "오라클", "클라우드", "적자", "투자"),
    q("openai-alliance", "OpenAI", "openai", "OpenAI의 파트너 연합은 경쟁 우위를 지켜줄까?", "동맹과 협상력", "마이크로소프트", "마소", "오라클", "반구글", "연합", "파트너", "균열"),

    q("google-platform", "Google", "google", "Google은 AI를 모든 서비스의 운영체제로 만들고 있는가?", "서비스 통합", "구글", "google", "모든 서비스", "모바일", "ai모드"),
    q("google-search", "Google", "google", "AI 검색은 제로클릭 시대를 얼마나 앞당길까?", "검색 생태계", "검색", "제로클릭", "ai모드", "크롬", "브라우저"),
    q("google-gemini", "Google", "google", "Gemini의 성능 반등은 일시적일까 구조적일까?", "Gemini 경쟁력", "제미나이", "gemini", "성능", "반격", "챗gpt 버린"),
    q("google-chip", "Google", "google", "Google의 자체 AI칩은 엔비디아 의존을 줄일 수 있을까?", "수직 통합", "구글 ai칩", "tpu", "반도체", "엔비디아", "자체칩"),
    q("google-robot", "Google", "google", "Google의 로봇 두뇌는 피지컬 AI의 표준이 될까?", "로봇 파운데이션 모델", "로봇 뇌", "로봇", "피지컬", "휴머노이드", "퀀텀점프"),

    q("claude-performance", "Anthropic", "anthropic", "Claude의 압도적 성능은 어디에서 나오는가?", "Claude 모델 경쟁력", "클로드", "claude", "성능", "코딩", "개발자"),
    q("claude-safety", "Anthropic", "anthropic", "Anthropic의 안전 철학은 실제 차별점이 되는가?", "안전과 정렬", "앤스로픽", "anthropic", "안전", "연구원", "위험", "정부"),
    q("claude-cloud", "Anthropic", "anthropic", "Anthropic은 빅테크 클라우드 의존에서 자유로운가?", "클라우드 종속", "아마존", "클라우드", "파트너", "뒤통수", "앤스로픽"),
    q("claude-business", "Anthropic", "anthropic", "Claude의 고성능은 수익성 있는 사업이 될 수 있을까?", "가격과 사업성", "클로드", "비용", "가격", "기업", "수익", "투자"),
    q("claude-governance", "Anthropic", "anthropic", "AI 기업은 정부와 어디까지 충돌할 수 있는가?", "규제와 거버넌스", "정부", "미국 정부", "규제", "앤스로픽", "연구원", "경고"),

    q("china-cost", "중국 AI", "china", "중국 AI의 가격 경쟁력은 글로벌 판을 바꿀까?", "비용 효율", "중국 ai", "비용", "6분의 1", "딥시크", "deepseek", "95점"),
    q("china-open", "중국 AI", "china", "중국의 오픈 모델 전략은 폐쇄형 모델을 앞설까?", "오픈 모델", "중국", "오픈소스", "qwen", "딥시크", "스타트업"),
    q("china-speed", "중국 AI", "china", "중국 AI 생태계의 확산 속도는 왜 빠른가?", "확산 속도", "중국의 ai 확산", "중국", "확산", "속도", "기업들"),
    q("china-adoption", "중국 AI", "china", "미국 스타트업도 중국 AI를 선택하게 될까?", "실제 도입", "미국 스타트업", "중국ai 홀릭", "도입", "채택", "비용"),
    q("china-geopolitics", "중국 AI", "china", "미중 AI 경쟁의 승부처는 모델인가 생태계인가?", "미중 경쟁", "중국", "미국", "mwc", "경쟁 구도", "판을 뒤집"),

    q("agent-useful", "AI 에이전트", "agents", "AI 에이전트는 실제 업무에서 쓸 만한가?", "업무 완결성", "에이전트", "agent", "느립니다", "생산성", "업무"),
    q("agent-browser", "AI 에이전트", "agents", "브라우저를 장악한 AI가 플랫폼을 지배할까?", "브라우저 에이전트", "브라우저", "크롬", "오퍼레이터", "operator", "에이전트"),
    q("agent-mcp", "AI 에이전트", "agents", "MCP는 AI 도구를 잇는 사실상의 표준이 될까?", "도구 연결 표준", "mcp", "하나로 묶", "도구", "연결", "생산성 혁명"),
    q("agent-autonomy", "AI 에이전트", "agents", "자율 에이전트가 인간을 의사결정에서 밀어낼까?", "자율성과 통제", "인간을 따돌", "자율", "다중", "협박", "에이전트"),
    q("agent-personal", "AI 에이전트", "agents", "개인 AI 에이전트는 스마트폰을 대체할까?", "개인용 인터페이스", "스마트폰", "개인", "비서", "에이전트", "모바일"),

    q("coding-replace", "AI 코딩", "coding", "AI 코딩은 개발자를 대체하는 단계에 왔는가?", "개발자 역할", "개발자를 몰아", "개발자", "코딩 ai", "대체", "취업"),
    q("coding-vibe", "AI 코딩", "coding", "바이브 코딩은 소프트웨어 제작의 기본 방식이 될까?", "자연어 개발", "바이브", "느낌만으로", "코딩", "개발", "프롬프트"),
    q("coding-tools", "AI 코딩", "coding", "어떤 AI 코딩 도구가 실제 생산성이 가장 높은가?", "도구 선택", "커서", "cursor", "코파일럿", "claude code", "코딩 도구"),
    q("coding-quality", "AI 코딩", "coding", "AI 코딩의 속도는 품질과 보안을 희생하는가?", "품질과 보안", "코드", "오류", "보안", "품질", "검증", "개발"),
    q("coding-skill", "AI 코딩", "coding", "AI 시대 개발자에게 가장 중요한 역량은 무엇인가?", "개발 역량 변화", "개발자", "역량", "회복탄력성", "문해력", "설계"),

    q("jobs-cuts", "일자리·교육", "jobs", "AI로 인한 일자리 감축은 언제 본격화될까?", "고용 충격", "일자리 감축", "일자리", "감원", "고용", "내년부터"),
    q("jobs-professional", "일자리·교육", "jobs", "딥리서치는 전문직의 진입장벽을 낮출까?", "전문직 변화", "딥리서치", "전문직", "리서치", "분석", "지식노동"),
    q("jobs-intelligence", "일자리·교육", "jobs", "AI 의존은 사람의 지능을 떨어뜨릴까?", "인지 능력", "지능을 떨어", "공부", "사고", "의존", "문해력"),
    q("jobs-resilience", "일자리·교육", "jobs", "AI 시대 최고의 인간 역량은 회복탄력성인가?", "회복탄력성", "회복탄력성", "역량", "적응", "변화", "인간"),
    q("jobs-literacy", "일자리·교육", "jobs", "AI 문해력은 모든 직업의 기본기가 될까?", "AI 문해력", "문해력", "교육", "공부", "활용 방식", "살아남는 법"),

    q("chip-nvidia", "반도체·인프라", "chips", "엔비디아의 AI 반도체 독점은 계속될까?", "플랫폼 지배력", "엔비디아", "nvidia", "독점", "플랫폼", "젠슨황"),
    q("chip-memory", "반도체·인프라", "chips", "AI 전쟁의 진짜 병목은 메모리인가?", "메모리 병목", "메모리", "hbm", "반도체", "병목", "승부처"),
    q("chip-custom", "반도체·인프라", "chips", "빅테크 자체칩은 GPU 질서를 흔들 수 있을까?", "대체 가속기", "자체칩", "구글 ai칩", "tpu", "엔비디아 아성", "위협"),
    q("infra-datacenter", "반도체·인프라", "chips", "AI 데이터센터 투자는 과잉이 될 위험이 있는가?", "컴퓨팅 투자", "데이터센터", "클라우드", "투자", "30조", "오라클"),
    q("infra-cloud", "반도체·인프라", "chips", "남는 AI 컴퓨팅을 클라우드로 팔면 수익이 될까?", "인프라 수익화", "클라우드 진출", "클라우드", "컴퓨팅", "메타", "수익"),

    q("physical-humanoid", "Physical AI", "physical", "휴머노이드는 대량생산 가능한 산업이 되었나?", "휴머노이드 양산", "휴머노이드", "양산", "현대차", "로봇", "치킨 게임"),
    q("physical-manufacturing", "Physical AI", "physical", "제조 AI가 현장에 안착하기 어려운 이유는 무엇인가?", "현장 데이터", "제조 ai", "공장", "현장", "데이터", "아직 한참"),
    q("physical-brain", "Physical AI", "physical", "범용 로봇 두뇌는 하드웨어 차이를 넘어설까?", "범용 행동 모델", "로봇 뇌", "파운데이션", "행동", "로봇", "구글"),
    q("physical-device", "Physical AI", "physical", "피지컬 AI는 스마트폰 이후의 플랫폼이 될까?", "현실 세계 플랫폼", "피지컬 ai", "스마트폰", "디바이스", "로봇", "웨어러블"),
    q("physical-autonomy", "Physical AI", "physical", "자율 시스템의 안전 기준은 어떻게 달라져야 할까?", "현실 행동 안전", "자율", "안전", "로봇", "위험", "통제"),

    q("content-image", "콘텐츠", "media", "생성형 이미지는 디자인 업계를 어떻게 바꿀까?", "디자인 자동화", "이미지", "디자이너", "참조", "생성", "디자인 업계"),
    q("content-video", "콘텐츠", "media", "AI 영상 생성은 콘텐츠 제작비를 얼마나 낮출까?", "영상 제작", "소라", "영상", "콘텐츠", "제작", "미디어"),
    q("content-copyright", "콘텐츠", "media", "AI가 참조한 콘텐츠의 저작권은 누구에게 있는가?", "저작권과 출처", "저작권", "참조", "원본", "콘텐츠", "디자인"),
    q("content-safety", "콘텐츠", "media", "생성형 AI의 성인·유해 콘텐츠 기준은 어디까지인가?", "콘텐츠 안전", "성인물", "유해", "안전", "딥페이크", "심각"),
    q("content-discovery", "콘텐츠", "media", "AI 검색은 창작자에게 트래픽을 돌려줄까?", "콘텐츠 유통", "제로클릭", "검색", "유튜브", "트래픽", "미디어"),

    q("meta-talent", "Meta", "meta", "Meta의 AI 인재 싹쓸이는 기술 우위로 이어질까?", "인재 전쟁", "메타가 ai 인재", "인재", "영입", "초지능", "메타"),
    q("meta-super", "Meta", "meta", "Meta의 초지능 투자는 현실적인 승부수인가?", "초지능 전략", "초지능", "메타", "투자", "인재", "승부수"),
    q("meta-open", "Meta", "meta", "Meta의 오픈소스 전략은 여전히 유효한가?", "오픈소스 생태계", "오픈소스", "라마", "llama", "메타", "생태계"),
    q("meta-cloud", "Meta", "meta", "Meta의 클라우드 진출은 비용센터를 사업으로 바꿀까?", "클라우드 사업화", "클라우드 진출", "클라우드", "컴퓨팅", "비용", "메타"),
    q("meta-social", "Meta", "meta", "소셜 유통망은 Meta의 AI 경쟁력이 될까?", "소셜 플랫폼 유통", "sns", "소셜", "메타", "플랫폼", "쇼핑"),

    q("business-cash", "AI 비즈니스", "business", "AI 기업의 현금 소진 속도는 감당 가능한가?", "자본 지속성", "총알이 떨어", "자금", "현금", "투자", "비용"),
    q("business-unit", "AI 비즈니스", "business", "AI 서비스의 단위 경제성은 언제 맞춰질까?", "단위 경제성", "비용", "가격", "수익", "기업", "단속"),
    q("business-adoption", "AI 비즈니스", "business", "기업은 AI를 실험에서 핵심 업무로 옮기고 있는가?", "기업 도입", "기업", "활용 방식", "업무", "도입", "생산성"),
    q("business-alliance", "AI 비즈니스", "business", "AI 플랫폼 경쟁은 결국 동맹 전쟁이 될까?", "플랫폼 동맹", "연합", "파트너", "마이크로소프트", "아마존", "오라클", "애플"),
    q("business-interface", "AI 비즈니스", "business", "AI 시대의 핵심 인터페이스는 앱·브라우저·에이전트 중 무엇인가?", "사용자 접점", "카톡", "크롬", "브라우저", "스마트폰", "에이전트", "앱"),
]


# Editorial synthesis of the recurring position across the linked episodes.
# These are paraphrases for navigation, not verbatim quotations; every timeline
# entry links back to the timestamped source so readers can verify the context.
SYNTHESIS = {
    "openai-lead": "OpenAI의 선두는 모델 점수 하나로 고정되지 않습니다. 초기의 기술 우위는 분명했지만, 이후 비용·서비스 안정성·제휴 구조·배포 채널까지 경쟁축이 넓어졌습니다. 현재 관점은 ‘여전히 가장 강한 기준점이지만, 독주를 전제할 수 없는 1위’에 가깝습니다.",
    "openai-model": "새 GPT의 평가는 벤치마크보다 실제 업무에서의 정확도·속도·도구 연결성을 함께 봐야 합니다. 출시 전 기대에서 출발해 환각과 체감 격차를 경계했고, 최근에는 성능 향상 자체보다 어떤 작업에서 확실히 나아졌는지를 구분하는 쪽으로 판단이 정교해졌습니다.",
    "openai-reliability": "대규모 AI 서비스의 신뢰성은 모델 성능과 별개의 경쟁력입니다. 이용자와 기능이 늘수록 장애와 품질 편차가 커질 수 있으므로, 중요한 업무에서는 단일 서비스 의존보다 대체 모델·검증 절차·작업 기록을 함께 준비해야 한다는 결론입니다.",
    "openai-economics": "OpenAI의 가장 큰 변수는 기술이 아니라 막대한 추론·인프라 비용을 감당할 사업 구조입니다. 자금 조달과 대형 제휴가 성장을 지탱했지만, 기능 정리와 비용 통제가 반복되면서 ‘매출 성장 속도가 컴퓨팅 지출을 따라잡을 수 있는가’가 핵심 질문으로 이동했습니다.",
    "openai-alliance": "OpenAI와 Microsoft의 관계는 단순한 후원에서 상호 의존과 견제가 공존하는 구조로 바뀌었습니다. 독자 인프라와 반구글 연합을 넓히는 움직임은 협력의 종료보다 협상력 재조정으로 읽어야 하며, 장기 우위는 어느 한 회사보다 파트너 생태계의 결속에 달려 있습니다.",
    "google-platform": "Google의 강점은 Gemini 한 모델이 아니라 검색·안드로이드·워크스페이스·클라우드에 AI를 기본 기능으로 배포할 수 있다는 점입니다. 성능 추격 국면을 지나 이제는 기존 서비스 전체를 AI 운영체제처럼 묶는 통합력이 경쟁의 중심이라는 판단입니다.",
    "google-search": "AI 검색은 링크 목록을 답변으로 바꾸며 제로클릭을 가속합니다. 이용자 편의는 커지지만 창작자 유입과 광고 구조가 흔들리므로, 검색의 승부는 답변 품질뿐 아니라 출처·보상·웹 생태계를 얼마나 지속 가능하게 설계하느냐에 달려 있습니다.",
    "google-gemini": "Gemini의 반등은 일회성 모델 점프보다 TPU, 검색 데이터, 모바일 유통망이 동시에 작동한 결과입니다. ChatGPT와의 격차를 모델별로 단정하기보다 멀티모달 성능과 제품 통합이 계속 강화되는 구조적 경쟁자로 봐야 합니다.",
    "google-chip": "Google의 자체 AI칩은 NVIDIA를 즉시 대체하기보다 자사 서비스 비용과 공급망을 통제하는 수단입니다. TPU가 강해질수록 빅테크의 수직 통합은 빨라지지만, 범용 개발 생태계에서는 GPU의 소프트웨어 우위가 여전히 큰 장벽입니다.",
    "google-robot": "Google의 로봇 경쟁력은 하드웨어 생산보다 범용 행동 모델과 현실 세계 데이터에 있습니다. ‘로봇의 뇌’가 빠르게 진화해도 안전한 반복 수행과 현장 통합이 남아 있어, 지능의 퀀텀점프가 곧바로 대량 상용화를 뜻하지는 않습니다.",
    "claude-performance": "Claude의 강점은 긴 문맥, 글쓰기, 코딩처럼 복잡한 작업에서 일관된 결과를 내는 데 있습니다. 최근의 압도적 체감은 모델 크기만이 아니라 도구 사용·추론 설계·개발자 경험을 함께 최적화한 결과로 해석됩니다.",
    "claude-safety": "Anthropic의 안전 철학은 브랜드 선언을 넘어 모델 설계와 정부·고객과의 갈등에서 실제 제약으로 작동합니다. 다만 안전을 경쟁 우위로 유지하려면 경고만이 아니라 측정 가능한 기준과 외부 검증, 사업적 지속 가능성을 함께 보여줘야 합니다.",
    "claude-cloud": "Anthropic은 Amazon과 Google의 자본·클라우드가 필요하지만 특정 파트너에 종속될 위험도 큽니다. 최근의 갈등은 독립 모델 회사가 인프라 제공자와 경쟁자 사이에서 얼마나 협상력을 확보할 수 있는지를 보여주는 사례입니다.",
    "claude-business": "Claude의 고성능은 프리미엄 가격을 정당화할 수 있지만, 지속 가능한 사업은 사용량 증가가 곧 손실 확대로 이어지지 않아야 합니다. 기업 고객의 높은 지불 의사와 추론 비용 절감이 함께 진행될 때 비로소 수익 구조가 성립합니다.",
    "claude-governance": "AI 기업과 정부의 충돌은 안전 원칙과 국가 경쟁력이 부딪히는 지점에서 커집니다. 기업의 자율 규범만으로는 부족하고, 위험 공개·감사·조달 기준처럼 검증 가능한 거버넌스가 필요하다는 쪽으로 관점이 구체화됐습니다.",
    "china-cost": "중국 AI의 가장 큰 충격은 최고 점수보다 ‘쓸 만한 성능을 훨씬 낮은 비용으로 공급한다’는 데 있습니다. 95점짜리 모델이 100점 모델의 가격 구조를 무너뜨리면 시장의 기준은 절대 성능에서 비용 대비 성능으로 이동합니다.",
    "china-open": "중국의 오픈 모델 전략은 제한된 자원 아래에서 빠른 확산과 생태계 확보를 노리는 선택입니다. 공개 범위와 투명성에는 차이가 있지만, Qwen·DeepSeek 계열의 확산은 서구 폐쇄형 모델의 가격과 배포 전략을 압박하고 있습니다.",
    "china-speed": "중국 AI 생태계의 속도는 모델 출시뿐 아니라 제조·모바일·서비스 현장에 즉시 적용하는 데서 나옵니다. 완성도를 기다리기보다 빠르게 배포하고 개선하는 방식이 누적되면서 기술 격차를 줄이는 구조로 평가됩니다.",
    "china-adoption": "미국 스타트업이 중국 AI를 고르는 이유는 이념보다 비용·성능·오픈 배포의 실용성입니다. 보안과 규제 위험은 남지만, 조달 현장에서는 출신보다 단위 경제성이 선택을 움직이기 시작했습니다.",
    "china-geopolitics": "미중 AI 경쟁은 한 개의 최고 모델보다 반도체·오픈소스·모바일·제조 생태계가 맞붙는 장기전입니다. 수출 통제가 속도를 늦출 수는 있어도 대체 기술과 비용 혁신을 자극하므로, 단선적인 승패보다 각 진영의 확산력을 봐야 합니다.",
    "agent-useful": "AI 에이전트는 ‘사람 없이 모든 일을 처리하는 존재’보다 반복 업무를 여러 도구에 걸쳐 이어주는 실행 계층에서 먼저 가치를 냅니다. 초기의 느리고 불안정한 데모를 지나, 지금은 좁은 범위·명확한 승인·로그가 있는 업무부터 쓰는 것이 현실적입니다.",
    "agent-browser": "브라우저를 장악한 AI는 검색·쇼핑·예약·업무 실행의 관문을 차지할 수 있습니다. 그러나 느린 실행과 보안·오작동 문제가 남아 있어, 브라우저가 사라진다기보다 사람이 하던 클릭을 에이전트가 대신하는 인터페이스로 재편될 가능성이 큽니다.",
    "agent-mcp": "MCP의 의미는 모델 성능을 높이는 데 있지 않고 서로 다른 데이터와 도구를 공통 방식으로 연결하는 데 있습니다. 표준이 넓게 채택될수록 에이전트 개발 비용은 낮아지지만, 권한 관리와 신뢰할 수 있는 도구 실행이 다음 병목입니다.",
    "agent-autonomy": "자율성은 한 번에 최대치로 열어줄 기능이 아니라 위험도에 따라 단계적으로 부여해야 합니다. 추천에서 실행으로 넘어갈수록 사람의 승인, 되돌리기, 감사 로그가 중요해지며 최종 의사결정 책임은 인간 조직에 남습니다.",
    "agent-personal": "개인 AI는 스마트폰을 즉시 없애기보다 스마트폰 안팎의 앱을 대신 조정하는 개인 인터페이스가 될 가능성이 큽니다. 기억·맥락·행동 권한이 모일수록 편의는 커지지만 프라이버시와 플랫폼 종속이 핵심 대가가 됩니다.",
    "coding-replace": "AI 코딩은 초급 구현과 반복 작업을 빠르게 대체하지만 개발자의 역할 전체를 없애지는 않습니다. 코드를 직접 쓰는 비중은 줄고, 문제 정의·아키텍처·검증·보안 책임이 커지면서 ‘개발자 수’보다 ‘필요한 개발자 역량’이 먼저 바뀝니다.",
    "coding-vibe": "바이브 코딩은 아이디어를 제품으로 만드는 진입 장벽을 크게 낮췄지만, 느낌만으로 운영 품질까지 보장하지는 못합니다. 프로토타입에는 강력하고, 실제 서비스에서는 요구사항·테스트·관찰 가능성을 붙이는 순간부터 전문 개발 방식과 다시 만납니다.",
    "coding-tools": "최고의 코딩 도구는 하나로 고정되지 않고 코드베이스 이해, 에이전트 실행, 검토 흐름에 따라 달라집니다. 데모 속도보다 기존 저장소에서의 정확도와 수정 통제, 비용을 비교해 작업별 도구 조합을 선택해야 합니다.",
    "coding-quality": "AI가 만든 코드는 그럴듯함과 정확함 사이의 간극이 큽니다. 생성 속도가 빨라질수록 리뷰·테스트·의존성 점검·비밀정보 보호를 자동화해야 하며, 책임 없는 자동 생성은 기술 부채를 더 빠르게 쌓을 수 있습니다.",
    "coding-skill": "AI 시대 개발자의 핵심 역량은 문법 암기보다 문제를 구조화하고 결과를 검증하는 능력입니다. 좋은 질문, 시스템 설계, 도메인 이해, 실패를 추적하는 힘이 코드를 직접 타이핑하는 속도보다 중요해졌습니다.",
    "jobs-cuts": "AI 일자리 충격은 모든 직업의 동시 소멸보다 신규 채용 축소와 업무 재편으로 먼저 나타납니다. 특히 반복적인 사무·초급 지식 노동이 압박받고, 조직이 에이전트를 운영 체계에 넣는 시점부터 감축 속도가 빨라질 수 있습니다.",
    "jobs-professional": "딥리서치와 생성형 AI는 전문직의 조사·초안·분석 시간을 크게 줄입니다. 전문직이 사라진다기보다 정보 접근의 희소성이 약해지고, 판단 책임·고객 맥락·검증 능력이 새로운 차별점이 됩니다.",
    "jobs-intelligence": "AI 의존은 생산성을 높이는 동시에 스스로 생각하고 기억하는 능력을 약화시킬 수 있습니다. 답을 받는 도구가 아니라 반론·비교·검증을 요구하는 사고 파트너로 쓸 때 인간 지능의 대체가 아니라 증폭이 됩니다.",
    "jobs-resilience": "기술 변화가 빠를수록 특정 도구 숙련보다 회복탄력성이 오래가는 경쟁력입니다. 실패를 작게 실험하고 학습 속도를 높이며 자신의 역할을 재설계하는 능력이 AI 시대의 안전망이라는 관점이 일관됩니다.",
    "jobs-literacy": "AI 문해력은 프롬프트 요령이 아니라 모델의 한계, 데이터, 비용, 저작권, 검증을 이해하고 업무에 적용하는 능력입니다. 모든 직무의 기본기가 되되 직무별 도메인 지식과 결합될 때 실제 성과로 이어집니다.",
    "chip-nvidia": "NVIDIA의 해자는 GPU 성능보다 CUDA·네트워킹·개발자 생태계를 묶은 플랫폼에 있습니다. 자체칩과 경쟁 가속기가 늘어 독점 강도는 낮아져도, AI 에이전트와 피지컬 AI가 새 수요를 만들며 플랫폼 지배력은 쉽게 사라지지 않습니다.",
    "chip-memory": "AI 경쟁의 병목은 연산칩만이 아니라 데이터를 빠르게 공급하는 HBM과 메모리 시스템입니다. 모델이 커지고 추론량이 늘수록 메모리 대역폭·전력·패키징이 성능과 비용을 함께 결정하므로 한국 산업에도 중요한 기회가 됩니다.",
    "chip-custom": "빅테크의 자체칩은 특정 워크로드에서 비용을 낮추고 NVIDIA 협상력을 줄입니다. 다만 범용성·소프트웨어 생태계·개발 편의 때문에 GPU를 완전히 밀어내기보다 혼합 인프라가 표준이 될 가능성이 큽니다.",
    "infra-datacenter": "AI 데이터센터 투자는 수요가 큰 만큼 전력·감가상각·모델 효율 개선이라는 위험을 안고 있습니다. ‘더 많이 지으면 승리’가 아니라 실제 사용량과 장기 계약, 칩 세대 전환을 견딜 자본 구조가 있는지가 관건입니다.",
    "infra-cloud": "AI 컴퓨팅을 클라우드로 팔면 거대한 수요를 매출로 바꿀 수 있지만, 높은 칩 비용과 가격 경쟁 때문에 매출이 곧 이익은 아닙니다. 가동률·전력비·고객 락인이 함께 맞아야 지속 가능한 인프라 사업이 됩니다.",
    "physical-humanoid": "휴머노이드 양산은 시연 영상보다 공장 안에서 반복 작업을 안전하고 싸게 수행할 수 있느냐가 기준입니다. 자동차 제조 역량은 강점이지만 손·배터리·학습 데이터·정비까지 해결해야 하므로 단계적 상용화가 현실적입니다.",
    "physical-manufacturing": "제조 AI가 어려운 이유는 데이터가 문서가 아니라 센서와 공정 속에 흩어져 있고 실패 비용이 크기 때문입니다. 범용 모델보다 현장 데이터 수집, 디지털 트윈, 작업자와의 통합이 선행돼야 진짜 생산성으로 이어집니다.",
    "physical-brain": "범용 로봇의 핵심은 모든 동작을 미리 코딩하지 않고 보고 이해해 행동하는 모델입니다. 로봇의 뇌가 발전해도 몸의 신뢰성, 실시간 제어, 안전 검증이 함께 올라와야 범용성이 현실이 됩니다.",
    "physical-device": "스마트폰 이후의 인터페이스는 단일 신기기보다 음성·안경·로봇·브라우저 에이전트가 결합한 형태일 가능성이 큽니다. AI가 사용자의 의도를 이해해 여러 기기를 조정하면서 화면 중심 사용은 점차 줄어들 수 있습니다.",
    "physical-autonomy": "현실 세계의 자율 시스템은 디지털 에이전트보다 훨씬 높은 안전 기준이 필요합니다. 능력이 커질수록 제한 구역, 이중 확인, 비상 정지, 책임 소재를 설계해야 하며 완전 자율보다 감독 가능한 자율이 먼저 확산됩니다.",
    "content-image": "참조 기반 이미지 생성은 디자인 제작의 속도와 접근성을 크게 높입니다. 디자이너의 역할은 픽셀 생산에서 방향 설정·브랜드 일관성·선별로 이동하고, 원본과 스타일의 권리 처리가 산업 표준이 되어야 합니다.",
    "content-video": "AI 영상은 제작비를 낮추고 소규모 팀의 표현 범위를 넓히지만, 기획·편집·일관성 유지 비용은 남습니다. 짧은 포맷부터 빠르게 상용화되고, 장편은 제어 가능성과 저작권이 개선될수록 확산될 것입니다.",
    "content-copyright": "AI 창작의 핵심 쟁점은 결과물 소유만이 아니라 학습·참조 과정의 동의와 출처입니다. 창작자를 배제한 효율화는 오래가기 어렵고, 라이선스·출처 표시·보상 구조가 도구 경쟁력의 일부가 됩니다.",
    "content-safety": "생성형 AI의 성인·유해 콘텐츠 문제는 단순 차단과 전면 허용 사이의 선택이 아닙니다. 연령 확인, 명시적 동의, 실존 인물 보호, 생성물 표시를 층별로 적용해야 표현의 자유와 피해 방지를 함께 다룰 수 있습니다.",
    "content-discovery": "AI 검색은 창작자의 콘텐츠를 요약해 이용자에게 전달하면서 원문 방문을 줄일 수 있습니다. 창작자는 검색 최적화만이 아니라 직접 구독·브랜드 신뢰·인용 가능한 원본 데이터를 강화해야 합니다.",
    "meta-talent": "Meta의 AI 인재 영입은 단기간에 연구 역량을 끌어올리지만 인재 숫자만으로 제품 우위를 보장하지는 않습니다. 컴퓨팅·조직 통합·제품 배포가 함께 맞을 때 초고액 영입이 기술 리더십으로 전환됩니다.",
    "meta-super": "Meta의 초지능 투자는 SNS 광고 사업에서 나온 현금을 차세대 플랫폼 주도권으로 바꾸려는 장기 베팅입니다. 투자 규모보다 연구 조직을 실제 제품과 클라우드 수익으로 연결할 수 있는지가 성패를 가릅니다.",
    "meta-open": "Meta의 오픈소스 전략은 개발자 생태계를 넓혀 폐쇄형 모델의 표준화를 견제해 왔습니다. 다만 비용과 수익 압력이 커지면서 완전 개방보다 선택적 공개로 이동할 수 있어, 오픈 전략 자체도 사업 모델과 함께 봐야 합니다.",
    "meta-cloud": "Meta의 클라우드 진출은 남는 컴퓨팅을 파는 부업이 아니라 막대한 AI 투자를 외부 매출로 회수하려는 시도입니다. 자체 모델·광고 데이터·인프라를 묶을 수 있지만 기존 클라우드와 다른 신뢰·지원 체계를 증명해야 합니다.",
    "meta-social": "Meta의 강점은 수십억 이용자에게 AI 기능을 즉시 배포하고 피드백을 얻는 소셜 유통망입니다. 모델 1등이 아니어도 개인화·광고·메신저 접점을 장악하면 일상 AI 경쟁에서 유리할 수 있습니다.",
    "business-cash": "AI 기업의 현금 소진은 기술 성장의 부산물이 아니라 생존을 가르는 핵심 변수입니다. 대규모 투자만으로 해결되지 않으며 추론 비용 절감, 반복 매출, 인프라 계약의 유연성이 함께 개선돼야 합니다.",
    "business-unit": "AI 서비스의 단위 경제성은 사용자 증가보다 사용자 한 명이 쓰는 컴퓨팅 비용과 지불액의 관계로 판단해야 합니다. 고성능 기능을 무제한 제공하는 단계에서 사용량별 가격·모델 라우팅·비용 통제로 이동하는 흐름이 뚜렷합니다.",
    "business-adoption": "기업 AI는 실험 계정을 늘리는 단계에서 핵심 업무의 시간·품질·매출을 바꾸는 단계로 넘어가야 합니다. 범용 도구를 배포하는 것보다 데이터 연결, 책임자, 성과 지표, 현업 재설계가 도입의 성패를 좌우합니다.",
    "business-alliance": "AI 플랫폼 경쟁은 단독 모델전보다 칩·클라우드·데이터·배포 채널을 묶는 동맹전입니다. 제휴는 약점을 빠르게 메우지만 이해관계가 바뀌면 균열도 생기므로, 파트너 수보다 대체 가능성과 협상력이 중요합니다.",
    "business-interface": "AI 시대의 핵심 인터페이스는 사용자의 의도를 가장 먼저 받아 실제 행동까지 연결하는 곳입니다. 브라우저·메신저·스마트폰·에이전트가 경쟁하며, 승자는 화면을 독점한 회사보다 맥락과 실행 권한을 신뢰받는 회사가 될 가능성이 큽니다.",
}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower()).strip()


def load_corpus() -> tuple[dict[str, Any], dict[str, str]]:
    corpus = json.loads(EPISODES_PATH.read_text(encoding="utf-8"))
    transcripts: dict[str, str] = {}
    for episode in corpus["episodes"]:
        cache = CACHE_DIR / f"{episode['videoId']}.json"
        if not cache.exists():
            raise SystemExit(f"Missing transcript cache: {cache}")
        raw = json.loads(cache.read_text(encoding="utf-8"))
        transcripts[episode["videoId"]] = normalize(" ".join(cue["text"] for cue in raw.get("cues", [])))
    return corpus, transcripts


def score(question: dict[str, Any], episode: dict[str, Any], transcript: str) -> float:
    title = normalize(f"{episode['title']} {episode['thesisSeedKo']}")
    value = 0.0
    for keyword in question["keywords"]:
        key = normalize(keyword)
        if key in title:
            value += 12
        occurrences = transcript.count(key)
        if occurrences:
            value += min(7, 1 + math.log2(occurrences + 1))
    if episode["clusterId"] == question["clusterId"]:
        value += 3
    return round(value, 2)


def month_key(date: str) -> str:
    return date[:7]


def main() -> int:
    corpus, transcripts = load_corpus()
    episodes = corpus["episodes"]
    by_id = {episode["videoId"]: episode for episode in episodes}
    matrix = {
        question["id"]: {
            episode["videoId"]: score(question, episode, transcripts[episode["videoId"]])
            for episode in episodes
        }
        for question in QUESTIONS
    }

    memberships: dict[str, set[str]] = defaultdict(set)
    for question in QUESTIONS:
        ranked = sorted(episodes, key=lambda ep: matrix[question["id"]][ep["videoId"]], reverse=True)
        selected = [ep for ep in ranked if matrix[question["id"]][ep["videoId"]] >= 5][:8]
        if len(selected) < 3:
            fallback = [ep for ep in ranked if ep["clusterId"] == question["clusterId"]]
            selected_by_id = {episode["videoId"]: episode for episode in selected}
            for episode in fallback:
                selected_by_id.setdefault(episode["videoId"], episode)
                if len(selected_by_id) >= 3:
                    break
            for episode in ranked:
                selected_by_id.setdefault(episode["videoId"], episode)
                if len(selected_by_id) >= 3:
                    break
            selected = list(selected_by_id.values())
        for episode in selected:
            memberships[question["id"]].add(episode["videoId"])

    # Guarantee that every video contributes several distinct question seeds.
    for episode in episodes:
        ranked_questions = sorted(QUESTIONS, key=lambda item: matrix[item["id"]][episode["videoId"]], reverse=True)
        existing = [question for question in QUESTIONS if episode["videoId"] in memberships[question["id"]]]
        for question in ranked_questions:
            if len(existing) >= 4:
                break
            if question not in existing:
                memberships[question["id"]].add(episode["videoId"])
                existing.append(question)

    public_questions = []
    episode_seeds: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for question in QUESTIONS:
        related = sorted(
            (by_id[video_id] for video_id in memberships[question["id"]]),
            key=lambda episode: episode["publishedAt"],
        )
        signals = []
        months = Counter()
        synthesis_steps = [part.strip() for part in re.split(r"(?<=\.)\s+", SYNTHESIS[question["id"]]) if part.strip()]
        for index, episode in enumerate(related):
            months[month_key(episode["publishedAt"])] += 1
            previous = related[index - 1] if index > 0 else None
            is_latest = index == len(related) - 1
            stage = "최초 관점" if index == 0 else "현재 관점" if is_latest else "관점 확장"
            step_index = round((index / max(len(related) - 1, 1)) * (len(synthesis_steps) - 1))
            viewpoint = synthesis_steps[step_index]
            previous_step_index = round(((index - 1) / max(len(related) - 1, 1)) * (len(synthesis_steps) - 1)) if index else 0
            previous_viewpoint = synthesis_steps[previous_step_index]
            point = viewpoint
            delta = (
                "이 질문을 본격적으로 추적하기 시작한 첫 관점입니다."
                if previous is None
                else f"이전의 ‘{previous['thesisSeedKo']}’에서 ‘{episode['thesisSeedKo']}’로 근거가 바뀌면서, "
                + (f"판단도 ‘{previous_viewpoint}’에서 ‘{viewpoint}’로 이동했습니다." if previous_viewpoint != viewpoint else "같은 판단을 다른 시장 신호로 보강했습니다.")
            )
            signal = {
                "videoId": episode["videoId"],
                "publishedAt": episode["publishedAt"],
                "title": episode["title"],
                "signalKo": f"{episode['thesisSeedKo']} · {question['lensKo']} 관점",
                "stageKo": stage,
                "viewpointKo": viewpoint,
                "pointKo": point,
                "deltaKo": delta,
                "driverKo": episode["thesisSeedKo"],
                "url": episode["url"],
                "evidenceUrl": episode["evidenceAnchor"]["url"] if episode.get("evidenceAnchor") else episode["url"],
                "score": matrix[question["id"]][episode["videoId"]],
            }
            signals.append(signal)
            episode_seeds[episode["videoId"]].append({
                "questionId": question["id"],
                "questionKo": question["questionKo"],
                "category": question["category"],
                "lensKo": question["lensKo"],
                "evidenceUrl": signal["evidenceUrl"],
            })
        earliest, latest = signals[0], signals[-1]
        if len(signals) == 1:
            change_summary = f"{earliest['publishedAt'][:7]}에 ‘{earliest['driverKo']}’를 중심으로 이 질문이 처음 포착됐습니다."
        else:
            change_summary = (
                f"초기에는 ‘{earliest['driverKo']}’가 핵심 사례였고, "
                f"최근에는 ‘{latest['driverKo']}’까지 판단 범위가 넓어졌습니다."
            )
        public_questions.append({
            "id": question["id"],
            "category": question["category"],
            "clusterId": question["clusterId"],
            "questionKo": question["questionKo"],
            "lensKo": question["lensKo"],
            "episodeCount": len(signals),
            "seedCount": len(signals),
            "firstObservedAt": earliest["publishedAt"],
            "lastObservedAt": latest["publishedAt"],
            "changeSummaryKo": change_summary,
            "synthesisKo": SYNTHESIS[question["id"]],
            "editorialNoteKo": "69편의 방송 논점을 질문 단위로 연결한 편집 요약이며, 직접 인용이 아닙니다.",
            "activityByMonth": [{"month": month, "count": count} for month, count in sorted(months.items())],
            "signals": signals,
        })

    episodes_public = []
    for episode in episodes:
        seeds = sorted(episode_seeds[episode["videoId"]], key=lambda item: item["category"])
        episodes_public.append({
            "videoId": episode["videoId"],
            "publishedAt": episode["publishedAt"],
            "title": episode["title"],
            "url": episode["url"],
            "clusterId": episode["clusterId"],
            "clusterLabel": episode["clusterLabel"],
            "durationSeconds": episode["durationSeconds"],
            "questionSeedCount": len(seeds),
            "questionSeeds": seeds,
        })

    categories = []
    for category in dict.fromkeys(question["category"] for question in QUESTIONS):
        category_questions = [question for question in public_questions if question["category"] == category]
        categories.append({
            "id": re.sub(r"[^a-z0-9]+", "-", category.lower()).strip("-") or category,
            "labelKo": category,
            "questionCount": len(category_questions),
            "episodeCount": len({signal["videoId"] for question in category_questions for signal in question["signals"]}),
        })

    seed_counts = [episode["questionSeedCount"] for episode in episodes_public]
    output = {
        "schemaVersion": "3.0.0",
        "source": {"playlistUrl": corpus["source"]["playlistUrl"], "episodeCount": len(episodes)},
        "totals": {
            "questions": len(public_questions),
            "episodes": len(episodes_public),
            "questionSeeds": sum(seed_counts),
            "minimumSeedsPerEpisode": min(seed_counts),
            "categories": len(categories),
        },
        "categories": categories,
        "questions": public_questions,
        "episodes": episodes_public,
    }
    if output["totals"]["questions"] < 50 or output["totals"]["episodes"] != 69 or output["totals"]["minimumSeedsPerEpisode"] < 4:
        raise SystemExit(f"Atlas safety check failed: {output['totals']}")
    for path in OUTPUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output["totals"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
