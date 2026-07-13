#!/usr/bin/env python3
"""Import prediction/quote features and verify them against the local corpus."""

from __future__ import annotations

import argparse
import json
import re
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / ".cache" / "dukjin-transcripts"
EPISODES_PATH = ROOT / "data" / "episodes.json"
OUTPUTS = [ROOT / "data" / "insight-features.json", ROOT / "public" / "data" / "insight-features.json"]


def seconds(value: str) -> int:
    parts = [int(part) for part in value.split(":")]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"Unsupported timestamp: {value}")


def comparable(value: str) -> str:
    return re.sub(r"[^가-힣a-z0-9]", "", value.lower())


def transcript_match(video_id: str, timestamp: int, quote: str) -> dict[str, Any]:
    raw = json.loads((CACHE_DIR / f"{video_id}.json").read_text(encoding="utf-8"))
    nearby = [
        cue for cue in raw.get("cues", [])
        if timestamp - 25 <= int(cue.get("startMs", 0)) / 1000 <= timestamp + 35
    ]
    expected = comparable(quote)
    candidates: list[str] = []
    for start in range(len(nearby)):
        combined = ""
        for end in range(start, min(len(nearby), start + 10)):
            combined += comparable(nearby[end].get("text", ""))
            candidates.append(combined)
            if len(combined) > len(expected) * 1.6:
                break
    similarity = max(
        (
            1.0 if expected and (expected in observed or observed in expected)
            else SequenceMatcher(None, expected, observed).ratio()
        )
        for observed in candidates
    ) if expected and candidates else 0.0
    return {
        "checked": True,
        "similarity": round(similarity, 3),
        "status": "matched" if similarity >= 0.72 else "approximate" if similarity >= 0.45 else "needs-review",
    }


def enrich(items: list[dict[str, Any]], episodes: dict[str, dict[str, Any]], quote_key: str, id_prefix: str) -> list[dict[str, Any]]:
    output = []
    for index, item in enumerate(items, 1):
        video_id = item["video_id"]
        if video_id not in episodes:
            raise SystemExit(f"Feature references a video outside the 69-episode corpus: {video_id}")
        start = seconds(item["timestamp"])
        episode = episodes[video_id]
        if start > episode["durationSeconds"] + 5:
            raise SystemExit(f"Timestamp exceeds video duration: {video_id} {item['timestamp']}")
        output.append({
            "id": f"{id_prefix}-{index:02d}",
            **item,
            "videoTitleKo": episode["title"],
            "startSeconds": start,
            "evidenceUrl": f"https://www.youtube.com/watch?v={video_id}&t={start}s",
            "transcriptVerification": transcript_match(video_id, start, item[quote_key]),
        })
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True, help="answer-chronicle directory from the reference repository")
    args = parser.parse_args()
    predictions = json.loads((args.source / "predictions-v2.json").read_text(encoding="utf-8"))["predictions"]
    quotes = json.loads((args.source / "quotes-v2.json").read_text(encoding="utf-8"))["quotes"]
    corpus = json.loads(EPISODES_PATH.read_text(encoding="utf-8"))
    episodes = {episode["videoId"]: episode for episode in corpus["episodes"]}
    prediction_rows = enrich(predictions, episodes, "quote_ko", "prediction")
    quote_rows = enrich(quotes, episodes, "quote_ko", "quote")
    verdicts: dict[str, int] = {}
    for prediction in prediction_rows:
        verdicts[prediction["verdict"]] = verdicts.get(prediction["verdict"], 0) + 1
    output = {
        "schemaVersion": "1.0.0",
        "source": {
            "reference": "socialkim/kdj-global-suite",
            "corpus": "Kim Duk-jin 69-episode Korean caption corpus",
            "latestEpisodeAt": max(episode["publishedAt"] for episode in episodes.values()),
        },
        "methodology": {
            "predictionKo": "방송의 미래형 발언을 이후 방송에서 확인된 사실과 비교한 AI 판정이며 참고용입니다.",
            "quoteKo": "자동 자막에서 의미가 선명한 비유·정의·한 문장 요약을 선별했습니다.",
            "verificationKo": "모든 항목의 영상 ID·타임스탬프를 69편 코퍼스와 대조하고 인접 자막 유사도를 기록했습니다.",
        },
        "totals": {
            "predictions": len(prediction_rows),
            "quotes": len(quote_rows),
            "verdicts": verdicts,
            "transcriptMatched": sum(
                item["transcriptVerification"]["status"] == "matched"
                for item in prediction_rows + quote_rows
            ),
        },
        "predictions": prediction_rows,
        "quotes": quote_rows,
    }
    for path in OUTPUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output["totals"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
