#!/usr/bin/env python3
"""Attach an exact, timestamped transcript excerpt to every atlas signal.

The public dataset keeps short evidence excerpts only. Full caption files stay
in the ignored local cache and are never published.
"""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from build_question_atlas import QUESTIONS  # noqa: E402


ATLAS_PATH = ROOT / "data" / "question-atlas.json"
EPISODES_PATH = ROOT / "data" / "episodes.json"
CACHE_DIR = ROOT / ".cache" / "dukjin-transcripts"
OUTPUTS = [ATLAS_PATH, ROOT / "public" / "data" / "question-atlas.json"]

STOPWORDS = {
    "ai", "인공지능", "어떻게", "무엇", "왜", "여전히", "있는가", "하는가",
    "될까", "인가", "대한", "에서", "으로", "그리고", "시장", "경쟁", "전략",
}
NOISE = ("구독", "좋아요", "광고", "손에 잡히는 경제", "박정호", "안녕하세요")


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def terms(value: str) -> list[str]:
    return [
        token.lower()
        for token in re.findall(r"[가-힣A-Za-z0-9][가-힣A-Za-z0-9.+-]{1,}", value)
        if token.lower() not in STOPWORDS
    ]


def cue_score(cue: dict[str, Any], keywords: list[str], question_terms: list[str], title_terms: list[str]) -> tuple[float, list[str]]:
    text = normalize(cue.get("text", ""))
    lowered = text.lower()
    matched: list[str] = []
    score = 0.0
    for keyword in keywords:
        key = normalize(keyword).lower()
        if key and key in lowered:
            matched.append(keyword)
            score += 10 + min(5, lowered.count(key))
    score += sum(2.5 for token in question_terms if token in lowered)
    score += sum(1.0 for token in title_terms if token in lowered)
    if 28 <= len(text) <= 150:
        score += 4
    elif len(text) < 12:
        score -= 5
    if any(noise in text for noise in NOISE):
        score -= 12
    return score, matched


def excerpt_window(cues: list[dict[str, Any]], index: int, minimum: int = 70, maximum: int = 210) -> tuple[str, int]:
    selected = [normalize(cues[index].get("text", ""))]
    end_index = index
    while len(" ".join(selected)) < minimum and end_index + 1 < len(cues):
        end_index += 1
        candidate = normalize(cues[end_index].get("text", ""))
        if candidate and candidate != selected[-1]:
            selected.append(candidate)
    text = normalize(" ".join(selected))
    if len(text) > maximum:
        text = text[:maximum].rsplit(" ", 1)[0].rstrip(" ,") + "…"
    return text, end_index


def evidence_for(signal: dict[str, Any], question: dict[str, Any], cues: list[dict[str, Any]]) -> dict[str, Any]:
    if not cues:
        return {
            "kind": "unavailable",
            "isDirectQuote": False,
            "quoteKo": "자막 근거를 불러오지 못했습니다.",
            "startSeconds": 0,
            "endSeconds": 0,
            "url": signal["url"],
            "matchedKeywords": [],
            "relevanceScore": 0,
        }
    keywords = [normalize(item) for item in question["keywords"] if normalize(item)]
    question_terms = terms(question["questionKo"] + " " + question["lensKo"])
    title_terms = terms(signal["title"])
    ranked = []
    for index, cue in enumerate(cues):
        score, matched = cue_score(cue, keywords, question_terms, title_terms)
        ranked.append((score, len(matched), len(normalize(cue.get("text", ""))), -index, index, matched))
    score, _, _, _, best_index, matched = max(ranked)
    quote, end_index = excerpt_window(cues, best_index)
    start_seconds = max(0, round(int(cues[best_index].get("startMs", 0)) / 1000))
    end_seconds = max(start_seconds, round(int(cues[end_index].get("endMs", 0)) / 1000))
    return {
        "kind": "youtube-auto-caption",
        "isDirectQuote": True,
        "quoteKo": quote,
        "startSeconds": start_seconds,
        "endSeconds": end_seconds,
        "url": f"https://www.youtube.com/watch?v={signal['videoId']}&t={start_seconds}s",
        "matchedKeywords": matched[:8],
        "relevanceScore": round(max(0, score), 2),
        "confidence": "high" if score >= 20 else "medium" if score >= 10 else "contextual",
    }


def clip(value: str, limit: int = 86) -> str:
    value = normalize(value)
    if len(value) <= limit:
        return value
    return value[:limit].rsplit(" ", 1)[0].rstrip(" ,") + "…"


def main() -> int:
    atlas = json.loads(ATLAS_PATH.read_text(encoding="utf-8"))
    corpus = json.loads(EPISODES_PATH.read_text(encoding="utf-8"))
    question_specs = {item["id"]: item for item in QUESTIONS}
    transcript_cache: dict[str, list[dict[str, Any]]] = {}
    for episode in corpus["episodes"]:
        raw = json.loads((CACHE_DIR / f"{episode['videoId']}.json").read_text(encoding="utf-8"))
        transcript_cache[episode["videoId"]] = raw.get("cues", [])

    direct_quotes = 0
    for question in atlas["questions"]:
        spec = question_specs[question["id"]]
        previous_quote = ""
        for index, signal in enumerate(question["signals"]):
            evidence = evidence_for(signal, spec, transcript_cache[signal["videoId"]])
            interpretation = signal["viewpointKo"]
            signal["evidence"] = evidence
            signal["evidenceUrl"] = evidence["url"]
            signal["answerQuoteKo"] = evidence["quoteKo"]
            signal["interpretationKo"] = interpretation
            signal["pointKo"] = evidence["quoteKo"]
            signal["viewpointKo"] = clip(evidence["quoteKo"])
            if evidence["isDirectQuote"]:
                direct_quotes += 1
            if index == 0:
                signal["deltaKo"] = "이 질문을 추적하는 첫 원문 근거입니다. 이후 시점의 답변은 이 문장을 기준으로 비교합니다."
            else:
                signal["deltaKo"] = (
                    f"직전 근거의 ‘{clip(previous_quote, 48)}’에서 이번 근거의 "
                    f"‘{clip(evidence['quoteKo'], 48)}’로 설명의 초점이 이동했습니다."
                )
            previous_quote = evidence["quoteKo"]
        question["evidenceCount"] = sum(1 for signal in question["signals"] if signal["evidence"]["isDirectQuote"])
        question["editorialNoteKo"] = (
            "큰따옴표 안 문장은 YouTube 한국어 자동 자막에서 가져온 직접 인용입니다. "
            "현재 종합 관점과 변화 설명은 69편을 질문 단위로 연결한 편집 해석입니다."
        )

    cue_total = sum(episode["transcript"]["cueCount"] for episode in corpus["episodes"])
    char_total = sum(episode["transcript"]["characterCount"] for episode in corpus["episodes"])
    latest = max(episode["publishedAt"] for episode in corpus["episodes"])
    atlas["schemaVersion"] = "4.0.0"
    atlas["source"].update({
        "latestEpisodeAt": latest,
        "transcriptsCaptured": corpus["totals"]["transcriptsCaptured"],
        "transcriptCues": cue_total,
        "transcriptCharacters": char_total,
    })
    atlas["totals"].update({
        "directEvidenceQuotes": direct_quotes,
        "transcriptCues": cue_total,
        "transcriptCharacters": char_total,
        "maximumAnswersPerQuestion": max(len(question["signals"]) for question in atlas["questions"]),
    })
    atlas["methodology"] = {
        "corpusCoverageKo": f"69편 전체 · 자막 {cue_total:,}구간 · {char_total:,}자 · 최신 {latest}",
        "evidenceRuleKo": "질문 키워드·제목 맥락이 가장 강한 자막 구간을 선택하고 원본 타임스탬프를 연결합니다.",
        "quoteRuleKo": "큰따옴표 안 문장만 직접 인용이며, 자동 자막의 오인식 가능성이 있습니다.",
        "interpretationRuleKo": "현재 관점·변화 요약은 여러 방송을 연결한 편집 해석으로 직접 인용과 분리합니다.",
    }
    if direct_quotes != sum(len(question["signals"]) for question in atlas["questions"]):
        raise SystemExit("Every signal must have a direct transcript excerpt")
    for output in OUTPUTS:
        output.write_text(json.dumps(atlas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(atlas["totals"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
