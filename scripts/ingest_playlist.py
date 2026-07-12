#!/usr/bin/env python3
"""Build the public 69-episode Kim Duk-jin corpus from the YouTube playlist.

Raw caption text is cached locally and never written to the public dataset. The
published JSON contains metadata, coverage metrics, hashes, and timestamped
evidence anchors only.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import re
import threading
from pathlib import Path
from typing import Any

import yt_dlp


PLAYLIST_URL = "https://www.youtube.com/playlist?list=PL-5ePmULnsmQidzPL5DTTh6YDInCYodV3"
EXPECTED_EPISODES = 69
ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / ".cache" / "dukjin-transcripts"
OUTPUT = ROOT / "data" / "episodes.json"
PUBLIC_OUTPUT = ROOT / "public" / "data" / "episodes.json"
LOCK = threading.Lock()

CLUSTERS = [
    ("openai", "OpenAI·ChatGPT", "OpenAI와 ChatGPT는 어디로 진화하는가?", ["openai", "chatgpt", "챗gpt", "챗GPT", "gpt", "o3", "o1", "샘 올트먼", "소라"]),
    ("google", "Google·Gemini", "구글과 Gemini의 반격은 얼마나 강한가?", ["구글", "google", "제미나이", "gemini", "노트북lm", "notebooklm", "알파폴드"]),
    ("anthropic", "Anthropic·Claude", "Claude는 어떤 방식으로 차별화되는가?", ["앤트로픽", "anthropic", "클로드", "claude"]),
    ("china", "중국 AI", "중국 AI는 세계 경쟁 구도를 어떻게 바꾸는가?", ["중국", "딥시크", "deepseek", "알리바바", "큐원", "qwen"]),
    ("agents", "AI 에이전트", "AI 에이전트는 실제 업무를 어디까지 대신하는가?", ["에이전트", "agent", "오퍼레이터", "operator", "mcp", "자동화"]),
    ("coding", "AI 코딩", "AI 코딩 도구는 개발 방식을 어떻게 바꾸는가?", ["코딩", "개발자", "커서", "cursor", "코파일럿", "copilot", "바이브"]),
    ("jobs", "일자리·교육", "AI 시대의 일자리와 교육은 어떻게 달라지는가?", ["일자리", "직업", "교육", "공부", "대학", "취업", "인재", "문해력"]),
    ("chips", "반도체·인프라", "AI 반도체와 인프라 경쟁의 핵심은 무엇인가?", ["반도체", "엔비디아", "nvidia", "gpu", "칩", "데이터센터", "젠슨 황"]),
    ("physical", "로봇·Physical AI", "AI가 현실 세계로 나오면 무엇이 달라지는가?", ["로봇", "휴머노이드", "피지컬", "physical", "자율주행", "테슬라"]),
    ("media", "콘텐츠·저작권", "생성형 AI는 콘텐츠와 저작권을 어떻게 재편하는가?", ["저작권", "콘텐츠", "유튜브", "이미지", "영상", "음악", "미디어", "딥페이크"]),
    ("meta", "Meta·오픈소스", "오픈소스 AI 전략은 시장을 어떻게 바꾸는가?", ["메타", "meta", "라마", "llama", "오픈소스"]),
    ("business", "산업·비즈니스", "기업과 산업은 AI를 어떻게 실제 가치로 연결하는가?", ["기업", "산업", "비즈니스", "스타트업", "마케팅", "서비스", "삼성", "애플", "마소", "마이크로소프트"]),
]


def ydl_options(flat: bool = False) -> dict[str, Any]:
    return {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": "in_playlist" if flat else False,
        "extractor_args": {"youtube": {"lang": ["ko"]}},
        "socket_timeout": 30,
        "retries": 3,
    }


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def normalize_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", value).strip()


def parse_captions(payload: dict[str, Any]) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []
    previous = ""
    for event in payload.get("events", []):
        text = normalize_text("".join(seg.get("utf8", "") for seg in event.get("segs", [])))
        if not text or text == previous:
            continue
        start = int(event.get("tStartMs", 0))
        duration = int(event.get("dDurationMs", 0))
        cues.append({"startMs": start, "endMs": start + duration, "text": text})
        previous = text
    return cues


def choose_caption(info: dict[str, Any]) -> tuple[str | None, dict[str, Any] | None, str | None]:
    for source_name, source in (("manual", info.get("subtitles", {})), ("automatic", info.get("automatic_captions", {}))):
        for language in ("ko-orig", "ko"):
            tracks = source.get(language, [])
            track = next((item for item in tracks if item.get("ext") == "json3"), None)
            if track:
                return source_name, track, language
    return None, None, None


def fetch_json_url(ydl: yt_dlp.YoutubeDL, url: str) -> dict[str, Any]:
    response = ydl.urlopen(url)
    raw = response.read()
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    return json.loads(raw)


def extract_episode(flat: dict[str, Any], refresh: bool) -> dict[str, Any]:
    video_id = flat["id"]
    cache_path = CACHE_DIR / f"{video_id}.json"
    if cache_path.exists() and not refresh:
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        if cached.get("metadata") and cached.get("cues"):
            return cached

    url = f"https://www.youtube.com/watch?v={video_id}"
    with yt_dlp.YoutubeDL(ydl_options()) as ydl:
        info = ydl.extract_info(url, download=False)
        source_name, track, language = choose_caption(info)
        cues: list[dict[str, Any]] = []
        caption_error = None
        if track:
            try:
                cues = parse_captions(fetch_json_url(ydl, track["url"]))
            except Exception as exc:  # retain metadata even if YouTube throttles captions
                caption_error = f"{type(exc).__name__}: {exc}"
        else:
            caption_error = "No Korean caption track found"

    record = {
        "metadata": {
            "videoId": video_id,
            "playlistPosition": flat.get("_sourcePosition"),
            "title": info.get("title") or flat.get("title"),
            "publishedAt": info.get("upload_date"),
            "durationSeconds": int(info.get("duration") or 0),
            "channel": info.get("channel") or info.get("uploader"),
            "url": url,
        },
        "captionSource": source_name,
        "captionLanguage": language,
        "captionError": caption_error,
        "cues": cues,
    }
    atomic_json(cache_path, record)
    with LOCK:
        print(f"[{video_id}] {len(cues):>4} cues | {record['metadata']['title']}", flush=True)
    return record


def clean_title(title: str) -> str:
    value = re.sub(r"\s*[|｜]\s*.*$", "", title)
    value = re.sub(r"\s*[\[(].*?김덕진.*?[\])]", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*김덕진(?:\s*소장)?\s*", " ", value)
    value = re.sub(r"\s*[-–—]?\s*(?:IT)?커뮤니케이션\s*연구소(?:장|\s*소장)?\s*$", "", value, flags=re.IGNORECASE)
    return normalize_text(value).strip("-–—: ")


def select_cluster(title: str) -> tuple[str, str, str, list[str]]:
    lowered = title.lower()
    best = None
    best_hits: list[str] = []
    for cluster_id, label, question, keywords in CLUSTERS:
        hits = [keyword for keyword in keywords if keyword.lower() in lowered]
        if best is None or len(hits) > len(best_hits):
            best = (cluster_id, label, question, keywords)
            best_hits = hits
    if best_hits:
        return best[0], best[1], best[2], best_hits
    return "business", "산업·비즈니스", "기업과 산업은 AI를 어떻게 실제 가치로 연결하는가?", []


def title_tokens(title: str) -> set[str]:
    stop = {"김덕진", "소장", "박정호", "교수", "특집", "라이브", "이유", "진짜", "이것", "공개", "시작", "시대"}
    return {token.lower() for token in re.findall(r"[가-힣A-Za-z0-9]{2,}", clean_title(title)) if token.lower() not in stop}


def evidence_anchor(video_id: str, title: str, cues: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not cues:
        return None
    tokens = title_tokens(title)
    scored = []
    for cue in cues:
        cue_lower = cue["text"].lower()
        hits = sorted(token for token in tokens if token in cue_lower)
        scored.append((len(hits), len(cue["text"]), cue, hits))
    score, _, cue, hits = max(scored, key=lambda item: (item[0], item[1]))
    seconds = max(0, round(cue["startMs"] / 1000))
    return {
        "startSeconds": seconds,
        "url": f"https://www.youtube.com/watch?v={video_id}&t={seconds}s",
        "method": "title-keyword overlap over Korean caption cues",
        "matchedKeywords": hits[:8],
        "confidence": "medium" if score >= 2 else "low",
    }


def build_public(raw_records: list[dict[str, Any]], visible_count: int) -> dict[str, Any]:
    episodes = []
    for raw in sorted(raw_records, key=lambda item: item["metadata"]["publishedAt"] or "", reverse=True):
        metadata = raw["metadata"]
        cues = raw.get("cues", [])
        cluster_id, cluster_label, question, hits = select_cluster(metadata["title"])
        text = " ".join(cue["text"] for cue in cues)
        duration_ms = max((cue["endMs"] for cue in cues), default=0)
        video_ms = metadata["durationSeconds"] * 1000
        date = metadata["publishedAt"]
        published_at = f"{date[:4]}-{date[4:6]}-{date[6:8]}" if date and len(date) == 8 else None
        episodes.append({
            "videoId": metadata["videoId"],
            "playlistPosition": metadata["playlistPosition"],
            "title": metadata["title"],
            "publishedAt": published_at,
            "durationSeconds": metadata["durationSeconds"],
            "channel": metadata["channel"],
            "url": metadata["url"],
            "clusterId": cluster_id,
            "clusterLabel": cluster_label,
            "canonicalQuestionKo": question,
            "classificationKeywords": hits,
            "thesisSeedKo": clean_title(metadata["title"]),
            "answerStatus": "제목 기반 시드 · 의미 분석 및 사람 검수 대기",
            "transcript": {
                "available": bool(cues),
                "source": raw.get("captionSource"),
                "language": raw.get("captionLanguage"),
                "cueCount": len(cues),
                "characterCount": len(text),
                "coverageRatio": round(min(1, duration_ms / video_ms), 3) if video_ms else 0,
                "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest() if text else None,
                "speakerSeparation": "unavailable",
            },
            "evidenceAnchor": evidence_anchor(metadata["videoId"], metadata["title"], cues),
            "reviewStatus": "pending",
            "copyright": "원문 자막은 로컬 캐시에만 보관하며 공개 JSON에는 게시하지 않음",
        })

    for cluster_id, _, _, _ in CLUSTERS:
        group = sorted((ep for ep in episodes if ep["clusterId"] == cluster_id), key=lambda ep: ep["publishedAt"] or "")
        for index, episode in enumerate(group):
            episode["clusterSequence"] = index + 1
            episode["previousEpisodeId"] = group[index - 1]["videoId"] if index else None
            episode["deltaSeedKo"] = "최초 관찰 지점" if index == 0 else f"이전 편 이후 제목·핵심 의제의 변화 후보: {episode['thesisSeedKo']}"
            episode["deltaStatus"] = "evidence review required"

    total_seconds = sum(ep["durationSeconds"] for ep in episodes)
    transcript_count = sum(1 for ep in episodes if ep["transcript"]["available"])
    clusters = []
    for cluster_id, label, question, _ in CLUSTERS:
        group = [ep for ep in episodes if ep["clusterId"] == cluster_id]
        clusters.append({"id": cluster_id, "labelKo": label, "questionKo": question, "episodeCount": len(group)})
    return {
        "schemaVersion": "1.0.0",
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": {
            "playlistUrl": PLAYLIST_URL,
            "playlistId": "PL-5ePmULnsmQidzPL5DTTh6YDInCYodV3",
            "visiblePlaylistEntries": visible_count,
            "selectionRule": "주간 시리즈 구간(현재 플레이리스트 1-78번)에서 김덕진 출연분 69편을 선택. 김아람 편(8·26·43·61)과 과학 게스트 편(52-56)은 제외하며, 제목에 출연자 표기가 빠진 10번은 연속 편성 근거로 포함",
            "expectedKimDukjinEpisodes": EXPECTED_EPISODES,
        },
        "totals": {
            "episodes": len(episodes),
            "durationSeconds": total_seconds,
            "transcriptsCaptured": transcript_count,
            "clusters": sum(1 for cluster in clusters if cluster["episodeCount"]),
            "humanReviewed": 0,
        },
        "method": {
            "pipeline": ["playlist inventory", "Korean caption capture", "title-keyword clustering", "timestamp evidence anchor", "semantic enrichment", "human review"],
            "completed": ["playlist inventory", "Korean caption capture", "title-keyword clustering", "timestamp evidence anchor"],
            "pending": ["semantic enrichment", "human review"],
            "limitationsKo": "자동 자막에는 화자 분리가 없으며, 현재 답변·변화 문장은 제목 기반 시드다. 의미 단위 요약과 변화 판정은 API 분석과 사람 검수 후 확정한다.",
        },
        "clusters": clusters,
        "episodes": episodes,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()

    with yt_dlp.YoutubeDL(ydl_options(flat=True)) as ydl:
        playlist = ydl.extract_info(PLAYLIST_URL, download=False)
    entries = [entry for entry in playlist.get("entries", []) if entry]
    for position, entry in enumerate(entries, 1):
        entry["_sourcePosition"] = position
    # This weekly series occupies playlist positions 1-78. Positions 8, 26, 43,
    # and 61 are Kim Aram episodes; 52-56 are science guests. Episode 10 omits
    # the speaker suffix in its public title but belongs to the same Duk-jin run.
    selected_positions = ({*range(1, 52)} - {8, 26, 43}) | set(range(57, 61)) | set(range(62, 79))
    selected = [entry for entry in entries if entry["_sourcePosition"] in selected_positions]
    if len(selected) != EXPECTED_EPISODES:
        raise SystemExit(f"Selection safety check failed: expected {EXPECTED_EPISODES}, found {len(selected)}")
    print(f"Selected {len(selected)} Kim Duk-jin episodes from {len(entries)} visible playlist entries", flush=True)

    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(extract_episode, entry, args.refresh) for entry in selected]
        for future in concurrent.futures.as_completed(futures):
            records.append(future.result())

    public = build_public(records, len(entries))
    if public["totals"]["episodes"] != EXPECTED_EPISODES:
        raise SystemExit("Output safety check failed")
    atomic_json(OUTPUT, public)
    atomic_json(PUBLIC_OUTPUT, public)
    print(f"Wrote {OUTPUT} and {PUBLIC_OUTPUT} ({public['totals']['transcriptsCaptured']}/{EXPECTED_EPISODES} transcripts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
