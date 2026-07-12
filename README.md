# 김덕진 답변 연대기

> **Built with Codex · Powered by ChatGPT 5.6sol**

같은 AI 질문에 대한 김덕진의 답이 매주 어떻게 달라지는지 `질문 → 당시 답변 → 변화 요인 → 근거 영상`으로 추적하는 인터랙티브 아카이브입니다.

## 공개 서비스

**[김덕진 답변 연대기 바로가기](https://kim-dukjin-answer-chronicle.socialkim.chatgpt.site)**

## V3 질문 중심 답변 연대기

2026년 7월 12일 기준 플레이리스트에서 김덕진 출연분 69편을 확정했습니다.

- 공개 플레이리스트 92편 중 김덕진 주간 출연분 69편
- 영상 총 길이 23시간 33분
- 한국어 자동 자막 69/69편 확보
- 12개 카테고리, 60개 진화형 질문, 472개 질문 신호
- 모든 영상에서 최소 4개 이상의 질문 시드 추출
- 질문별 관련 방송 연대기와 에피소드별 근거 타임스탬프
- 질문마다 김덕진의 현재 종합 관점, 시점별 핵심 논점, 이전 답에서 달라진 점 제공
- 공개 JSON: [`public/data/episodes.json`](public/data/episodes.json)
- 질문 지도 JSON: [`public/data/question-atlas.json`](public/data/question-atlas.json)
- 원문 자막은 `.cache/dukjin-transcripts/`에만 저장하며 Git에 커밋하지 않음

## 재현 가능한 수집 파이프라인

Python 3.12와 `yt-dlp`가 필요합니다.

```bash
python scripts/ingest_playlist.py
python scripts/build_question_atlas.py
```

파이프라인은 다음 안전 검사를 포함합니다.

- 대상이 정확히 69편이 아니면 중단
- 원본 메타데이터와 한국어 자막을 영상별 로컬 캐시에 저장
- 공개 데이터에는 자막 본문 대신 커버리지, SHA-256, 근거 시점만 기록
- `data/episodes.json`과 `public/data/episodes.json`을 동일하게 생성
- 질문 키워드와 전체 자막을 교차 분석해 영상당 여러 질문에 연결
- 질문 50개 미만, 에피소드 69편 미만, 영상당 질문 4개 미만이면 생성 중단

## 주요 기능

- 60개 질문 검색, 카테고리 필터와 질문별 방송 타임라인
- 69편을 시간×주제로 탐색하는 인터랙티브 시그널 맵
- 영상별 4~13개 질문 연결과 원본 근거 바로가기
- 69편 대표 이미지를 활용한 방송용 V3 히어로
- 상단의 V1·V2·V3 전환기로 이전 버전 비교
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

테스트는 질문 60개, 에피소드 69편, 질문 신호 400개 이상, 영상당 최소 질문 4개가 유지되는지 확인합니다.

## 라이선스

코드는 MIT License입니다. 영상, 썸네일, 자막 등 콘텐츠의 권리는 각 원저작자에게 있습니다.
