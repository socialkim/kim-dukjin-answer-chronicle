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
        for episode in related:
            months[month_key(episode["publishedAt"])] += 1
            signal = {
                "videoId": episode["videoId"],
                "publishedAt": episode["publishedAt"],
                "title": episode["title"],
                "signalKo": f"{episode['thesisSeedKo']} · {question['lensKo']} 관점",
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
            "changeSummaryKo": f"{earliest['publishedAt'][:7]}의 ‘{earliest['signalKo']}’에서 {latest['publishedAt'][:7]}의 ‘{latest['signalKo']}’로 논점이 이동했습니다.",
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
        "schemaVersion": "2.0.0",
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
