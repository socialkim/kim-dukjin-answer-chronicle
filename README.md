# 김덕진 답변 연대기

> **Built with Codex · Powered by ChatGPT 5.6sol**

같은 AI 질문에 대한 김덕진의 답이 매주 어떻게 달라지는지 `질문 → 당시 답변 → 변화 요인 → 근거 영상`으로 추적하는 인터랙티브 아카이브입니다.

## 공개 서비스

**[김덕진 답변 연대기 바로가기](https://kim-dukjin-answer-chronicle.socialkim.chatgpt.site)**

## V5 원문 근거에서 예측 채점까지

2026년 7월 12일 기준 플레이리스트에서 김덕진 출연분 69편을 확정했습니다.

- 공개 플레이리스트 92편 중 김덕진 주간 출연분 69편
- 영상 총 길이 23시간 33분
- 한국어 자동 자막 69/69편 확보
- 최신 방송: 2026년 7월 6일
- 자막 39,700구간, 약 75만 자
- 12개 카테고리, 60개 진화형 질문, 639개 질문 신호
- 28개 정밀 질문: 방송별 발언·상세 맥락·명시적 변곡점 308개
- 32개 확장 질문: 정밀 질문이 다루지 않는 추가 논점
- 모든 질문 신호에 짧은 원문 자막 직접 인용과 타임스탬프 연결
- 질문별 최대 28개 관련 방송 답변 연대기
- 예측 채점표 20개: 적중 9, 부분적중 5, 빗나감 3, 미확정 3
- 명언 아카이브 19개와 원본 시점 연결
- 모든 영상에서 최소 4개 이상의 질문 시드 추출
- 질문별 관련 방송 연대기와 에피소드별 근거 타임스탬프
- V2의 질문 카드 → 답변 연대기 흐름을 60개 질문 전체 데이터로 확장
- 질문마다 김덕진의 현재 종합 관점, 시점별 핵심 논점, 이전 답에서 달라진 점 제공
- 공개 JSON: [`public/data/episodes.json`](public/data/episodes.json)
- 질문 지도 JSON: [`public/data/question-atlas.json`](public/data/question-atlas.json)
- 원문 자막은 `.cache/dukjin-transcripts/`에만 저장하며 Git에 커밋하지 않음

## 재현 가능한 수집 파이프라인

Python 3.12와 `yt-dlp`가 필요합니다.

```bash
python scripts/ingest_playlist.py
python scripts/build_question_atlas.py
python scripts/enrich_transcript_evidence.py
python scripts/merge_deep_chronicle.py --source /path/to/kdj-global-suite/answer-chronicle
python scripts/import_v5_features.py --source /path/to/kdj-global-suite/answer-chronicle
```

파이프라인은 다음 안전 검사를 포함합니다.

- 대상이 정확히 69편이 아니면 중단
- 원본 메타데이터와 한국어 자막을 영상별 로컬 캐시에 저장
- 공개 데이터에는 전체 자막 대신 각 질문을 뒷받침하는 짧은 직접 인용만 기록
- `data/episodes.json`과 `public/data/episodes.json`을 동일하게 생성
- 질문 키워드와 전체 자막을 교차 분석해 영상당 여러 질문에 연결
- 질문 50개 미만, 에피소드 69편 미만, 영상당 질문 4개 미만이면 생성 중단

## 주요 기능

- 60개 질문 검색, 카테고리 필터와 질문별 전체 방송 타임라인
- 각 시점의 직접 인용, 편집 해석, 직전 답변과의 변화, 근거 신뢰도 분리 표시
- 적중과 빗나감을 함께 남기는 20개 예측 채점표
- 타임스탬프가 연결된 19개 명언 아카이브
- 전체 코퍼스 최신일·자막 구간·직접 인용 수 상시 표시
- 69편을 시간×주제로 탐색하는 인터랙티브 시그널 맵
- 영상별 4~13개 질문 연결과 원본 근거 바로가기
- 이미지 없이 안정적인 텍스트 중심 V5 히어로
- 시그널 맵과 김덕진 에피소드 69편 전수조사 탐색
- 상단의 V1·V2·V3·V4·V5 전환기로 이전 버전 비교
- 원본 YouTube 영상 연결
- Dukjin Global Video Studio 확장 프로그램 다운로드와 설치 안내
- 모바일 반응형 UI와 키보드 접근성

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

검증:

```bash
npm test
npm run lint
```

테스트는 정밀 질문 28개+확장 질문 32개, 에피소드 69편, 질문 신호·직접 인용 639개, 최신일 2026-07-06, 예측 20개와 명언 19개가 유지되는지 확인합니다.

## 라이선스

코드는 MIT License입니다. 영상, 썸네일, 자막 등 콘텐츠의 권리는 각 원저작자에게 있습니다.
