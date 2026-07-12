#!/usr/bin/env python3
"""Merge 28 deeply analyzed topics with 32 non-duplicate atlas questions."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ATLAS_PATH = ROOT / "data" / "question-atlas.json"
OUTPUTS = [ATLAS_PATH, ROOT / "public" / "data" / "question-atlas.json"]

# Each removed broad question is covered more deeply by one of the 28 imported
# topics. The remaining 32 preserve the original atlas's additional breadth.
DROP_EXTENDED = {
    "openai-lead", "agent-useful", "china-geopolitics", "business-cash",
    "chip-nvidia", "china-open", "jobs-cuts", "physical-autonomy",
    "business-adoption", "content-image", "google-search", "content-copyright",
    "openai-reliability", "physical-humanoid", "infra-datacenter", "content-safety",
    "jobs-resilience", "google-platform", "coding-vibe", "business-unit",
    "claude-governance", "agent-browser", "meta-talent", "business-alliance",
    "meta-super", "claude-safety", "chip-memory", "content-discovery",
}

CATEGORY = {
    "openai-strategy": "OpenAI", "ai-agents": "AI 에이전트",
    "korea-ai-strategy": "AI 비즈니스", "us-china-tech-rivalry": "중국 AI",
    "ai-bubble-monetization": "AI 비즈니스", "nvidia-chip-war": "반도체·인프라",
    "open-vs-closed": "중국 AI", "ai-and-jobs": "일자리·교육",
    "ai-safety-control": "Anthropic", "enterprise-ai-adoption": "AI 비즈니스",
    "ai-image-video-generation": "콘텐츠", "ai-search-browser-war": "Google",
    "ai-copyright": "콘텐츠", "ai-trust-hallucination": "OpenAI",
    "physical-ai-humanoid": "Physical AI", "ai-infra-datacenter-power": "반도체·인프라",
    "ai-companion-emotion": "콘텐츠", "ai-era-human-skills": "일자리·교육",
    "google-ai-strategy": "Google", "vibe-coding-devtools": "AI 코딩",
    "ai-pricing-token-economy": "AI 비즈니스", "ai-regulation-governance": "Anthropic",
    "ai-startup-solo-founder": "AI 비즈니스", "ai-talent-war": "일자리·교육",
    "bigtech-alliances-frenemy": "AI 비즈니스", "meta-ai-strategy": "Meta",
    "ai-military-national-security": "Anthropic", "korea-memory-hbm": "반도체·인프라",
}


def seconds(value: str) -> int:
    parts = [int(part) for part in value.split(":")]
    return parts[-2] * 60 + parts[-1] if len(parts) == 2 else parts[-3] * 3600 + parts[-2] * 60 + parts[-1]


def clip(value: str, limit: int = 110) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) <= limit:
        return value
    return value[:limit].rsplit(" ", 1)[0].rstrip(" ,") + "…"


def delta(previous: dict[str, Any] | None, current: dict[str, Any], shifts: dict[str, str]) -> str:
    if current["date"] in shifts:
        return shifts[current["date"]]
    if previous is None:
        return "이 질문을 장기 추적하는 첫 발언입니다. 이후 방송의 판단은 이 시점과 비교합니다."
    return (
        f"직전 시점의 ‘{clip(previous['stance_ko'], 55)}’에서 이번에는 "
        f"‘{clip(current['stance_ko'], 55)}’로 근거와 판단 범위가 확장됐습니다."
    )


def deep_question(topic: dict[str, Any], titles: dict[str, str]) -> dict[str, Any]:
    entries = topic["entries"]
    shifts = {item["date"]: item["change_ko"] for item in topic.get("shift_points", [])}
    signals = []
    previous = None
    for index, entry in enumerate(entries):
        start = seconds(entry["timestamp"])
        url = f"https://www.youtube.com/watch?v={entry['video_id']}&t={start}s"
        stage = "최초 관점" if index == 0 else "현재 관점" if index == len(entries) - 1 else "관점 확장"
        signals.append({
            "videoId": entry["video_id"],
            "publishedAt": entry["date"],
            "title": entry.get("video_title_ko") or titles[entry["video_id"]],
            "signalKo": entry["stance_ko"],
            "stageKo": stage,
            "viewpointKo": clip(entry["quote_ko"]),
            "pointKo": entry["quote_ko"],
            "answerQuoteKo": entry["quote_ko"],
            "interpretationKo": entry["stance_ko"],
            "detailKo": entry["detail_ko"],
            "deltaKo": delta(previous, entry, shifts),
            "driverKo": entry["context_ko"],
            "url": f"https://www.youtube.com/watch?v={entry['video_id']}",
            "evidenceUrl": url,
            "score": 100,
            "sourceDepth": "deep",
            "evidence": {
                "kind": "youtube-auto-caption",
                "isDirectQuote": True,
                "quoteKo": entry["quote_ko"],
                "startSeconds": start,
                "endSeconds": start,
                "url": url,
                "matchedKeywords": [],
                "relevanceScore": 100,
                "confidence": "curated",
            },
        })
        previous = entry
    shift_summary = " ".join(item["change_ko"] for item in topic.get("shift_points", [])[-2:])
    return {
        "id": f"deep-{topic['cluster_id']}",
        "category": CATEGORY[topic["cluster_id"]],
        "clusterId": topic["cluster_id"],
        "questionKo": topic["question_ko"],
        "lensKo": topic["topic_ko"],
        "depth": "deep",
        "episodeCount": len(signals),
        "seedCount": len(signals),
        "evidenceCount": len(signals),
        "firstObservedAt": signals[0]["publishedAt"],
        "lastObservedAt": signals[-1]["publishedAt"],
        "changeSummaryKo": shift_summary or topic["evolution_summary_ko"],
        "synthesisKo": topic["evolution_summary_ko"],
        "backgroundKo": topic.get("background_ko", ""),
        "editorialNoteKo": "큰따옴표 안 문장은 YouTube 자동 자막 직접 인용입니다. 상세 해석과 변곡점 설명은 전체 방송 맥락을 연결한 편집 분석입니다.",
        "activityByMonth": [],
        "signals": signals,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    atlas = json.loads(ATLAS_PATH.read_text(encoding="utf-8"))
    source = json.loads((args.source / "data-v2.json").read_text(encoding="utf-8"))
    titles = {episode["videoId"]: episode["title"] for episode in atlas["episodes"]}
    extended = [question for question in atlas["questions"] if question["id"] not in DROP_EXTENDED and question.get("depth") != "deep"]
    for question in extended:
        question["depth"] = "extended"
        for signal in question["signals"]:
            signal["sourceDepth"] = "extended"
    deep = [deep_question(topic, titles) for topic in source["topics"]]
    questions = deep + extended
    if len(deep) != 28 or len(extended) != 32 or len(questions) != 60:
        raise SystemExit(f"Question merge safety check failed: deep={len(deep)} extended={len(extended)}")

    question_by_id = {question["id"]: question for question in questions}
    episode_seeds: dict[str, list[dict[str, Any]]] = {episode["videoId"]: [] for episode in atlas["episodes"]}
    for question in questions:
        for signal in question["signals"]:
            seed = {
                "questionId": question["id"], "questionKo": question["questionKo"],
                "category": question["category"], "lensKo": question["lensKo"],
                "evidenceUrl": signal["evidenceUrl"], "depth": question["depth"],
            }
            if not any(item["questionId"] == question["id"] for item in episode_seeds[signal["videoId"]]):
                episode_seeds[signal["videoId"]].append(seed)
    for episode in atlas["episodes"]:
        seeds = sorted(episode_seeds[episode["videoId"]], key=lambda item: (item["depth"] != "deep", item["category"]))
        episode["questionSeeds"] = seeds
        episode["questionSeedCount"] = len(seeds)

    category_order = ["OpenAI", "Google", "Anthropic", "중국 AI", "AI 에이전트", "AI 코딩", "일자리·교육", "반도체·인프라", "Physical AI", "콘텐츠", "Meta", "AI 비즈니스"]
    categories = []
    for category in category_order:
        group = [question for question in questions if question["category"] == category]
        categories.append({
            "id": re.sub(r"[^a-z0-9]+", "-", category.lower()).strip("-") or category,
            "labelKo": category,
            "questionCount": len(group),
            "episodeCount": len({signal["videoId"] for question in group for signal in question["signals"]}),
        })
    atlas["schemaVersion"] = "5.0.0"
    atlas["questions"] = questions
    atlas["categories"] = categories
    atlas["source"].update({"deepQuestions": 28, "extendedQuestions": 32, "reference": "socialkim/kdj-global-suite"})
    atlas["totals"].update({
        "questions": 60,
        "deepQuestions": 28,
        "extendedQuestions": 32,
        "questionSeeds": sum(len(question["signals"]) for question in questions),
        "directEvidenceQuotes": sum(question["evidenceCount"] for question in questions),
        "maximumAnswersPerQuestion": max(len(question["signals"]) for question in questions),
        "minimumSeedsPerEpisode": min(episode["questionSeedCount"] for episode in atlas["episodes"]),
    })
    if atlas["totals"]["minimumSeedsPerEpisode"] < 4:
        raise SystemExit(f"Episode seed safety check failed: {atlas['totals']['minimumSeedsPerEpisode']}")
    atlas["methodology"]["depthRuleKo"] = "정밀 질문 28개는 방송별 발언·상세 맥락·명시적 변곡점을 연결하고, 확장 질문 32개는 추가 논점을 넓게 탐색합니다."
    for output in OUTPUTS:
        output.write_text(json.dumps(atlas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(atlas["totals"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
