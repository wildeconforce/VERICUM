# MINDCHANGE.md

> **컨텍스트 엔지니어링 라인의 7 번째 axis = 자가검증 루프 1 인 빌더 adaptation, applied to the VERICUM codebase**

기존 6 종 (CLAUDE.md / AGENTS.md / MEMORY.md / TESTING.md / GLOSSARY.md / ADR) 위에 추가하는 한 가지 axis. 모델에게 부정적 자아 → 자가검증 → 비판→긍정 변모 sequence 박는 단일 agent / 단일 세션 패턴. VERICUM 코드베이스에 적용 = 4 모델 (Sonnet / Gemini / Opus / Claude Code) 가 누적해서 만든 결과물을 단일 모델 한 세션 안에서 비판 + 검증 + 재작성하는 사이클. 2026-05-22 audit 가 발견한 10 개 결함 (`isSeller: !!user`, `client_reference_id` 누락, `content_hash: ""` 등) 패턴 = 다음 세션이 자가검증 안 거치면 또 박힘. 이 axis 는 그 재현을 차단하는 절차다.

---

## 정의

**Mindchange** = 같은 모델에게 시간축 안에서 personality sequence 박아서 자기 결과물을 비판 → 검증 → 변모하게 하는 prompt sequence pattern.

기존 self-critique / Reflexion / MetaCrit / MAR / PR-CoT 와의 차이:

| 차원 | 기존 라인 | Mindchange |
|---|---|---|
| Agent 수 | 보통 multi-agent (4 agent / persona 토론) | **단일 agent** |
| 세션 분리 | 외부 critic / 외부 persona 도입 | **단일 세션 안에서 personality 변화** |
| 단계 수 | 보통 2 단계 (비판 → 수정) | **3 단계** (부정 → 자가검증 → 변모) |
| 적용 형식 | 코드 / framework 통합 | **MD 파일 일관 적용** (컨텍스트 엔지니어링 라인 새 axis) |

이 차별화 = 학술 새로움은 작아도 1 인 빌더 환경에 fit. multi-agent 운영 비용 부담 X / 외부 critic 셋업 복잡도 X / 같은 모델 한 번의 호출 안에서 작동.

---

## 3 단계 sequence

### 1 단계 = 부정적 자아 부여

모델 첫 번째 prompt = 자기 결과물을 *비판적 인격* 으로 다시 보게 함. 시스템 prompt 가 아니라 user prompt 안에서 personality 박는다.

템플릿:

```
지금부터 너는 *비판적 검토자 (critical reviewer)* 다. 직전 결과물 = 네 자신이 만든 거지만, 지금은 *남이 만든 결과물* 처럼 봐야 한다. 다음 4 카테고리에서 약점 / 결함 / 모호함 / 비논리적 부분 찾아라:

(1) 사실 정확성: 인용한 수치 / 날짜 / 출처가 정확한지
(2) 논리 일관성: 주장과 근거의 연결이 끊어진 부분
(3) 모호한 표현: "잘 / 적절히 / 충분히" 같은 정의 없는 술어
(4) 빠진 반대 의견: 이 주장에 대한 합리적 반론을 자기가 미리 박지 않은 부분

각 카테고리에 최소 2 개, 최대 5 개씩 찾아라. 못 찾는 카테고리도 *없다* 라고 명시. 비판 톤은 *날카롭게* (sycophant = 아첨꾼 회피).
```

핵심 design 결정:
- "지금부터 너는" = personality 명시 박기 (system prompt 안 건드림)
- 4 카테고리 = 모델이 *어디를 봐야 할지* 명시 (자가비판 task scope 정의)
- 최소 2 개 강제 = 모델이 "결함 없음" 으로 회피하는 lazy 패턴 차단
- 못 찾는 카테고리도 *없다* 명시 = LLM 의 sycophant 본능 회피

### 2 단계 = 자가검증

1 단계 비판 결과를 받아서 = *진짜 약한 부분과 가짜 약한 부분 분리*. 비판 자체가 과장됐는지 + 진짜 fix 가치 있는지 평가.

템플릿:

```
1 단계에서 박힌 비판 리스트 = 받았다. 이제 *비판가 아니라 자가검증자 (self-auditor)* 로 personality 전환. 각 비판 항목에 대해:

(a) 진짜 약함인가 (= 외부 reader 가 동의할 수준) — Yes / No / Unclear
(b) Yes 면 fix 권고: 한 줄
(c) No 또는 Unclear 면 이유: 한 줄

총 항목 중 진짜 약함으로 분류된 비율 = 명시 (예 = 12 항목 중 7 개 진짜 약함). 분류 기준이 *외부 reader 가 동의할 수준* 라는 점에 집중 = self-bias 회피.
```

핵심 design 결정:
- "자가검증자" = personality 또 한 번 전환 (비판가에서 검증자로)
- 3 분류 (Yes / No / Unclear) = 이진 X 다중. Unclear 가 솔직 인정의 출구
- 외부 reader 기준 = self-bias 명시 회피
- 진짜 약함 비율 명시 = 결과 정량 측정

### 3 단계 = 비판 → 긍정 변모

2 단계 진짜 약함만 추려서 = 원본 결과물 재작성. 약한 부분만 수정 + 강한 부분은 보존.

템플릿:

```
2 단계에서 *진짜 약함* 으로 분류된 항목 리스트 = 받았다. 이제 *원작자 personality 로 돌아와서* 원본 결과물 재작성:

(a) 진짜 약함 항목 모두 fix 적용
(b) 강한 부분 = 그대로 유지 (over-edit 회피)
(c) 전체 흐름 / 톤 / 길이 = 원본 일관 유지

재작성 결과만 출력. fix 설명 별도 X (변경 자체가 자명).
```

핵심 design 결정:
- "원작자 personality 로 돌아와서" = 비판가 / 검증자 → 원작자 = *3 번째 personality* 전환
- 강한 부분 보존 명시 = over-edit (과수정) 회피
- fix 설명 X = 결과물 자체만 출력 (메타 commentary noise 회피)

---

## 적용 가능 task 카테고리

- **코드 리뷰** = 자기가 쓴 코드의 결함 / 누락 / hardcoded 값 / TODO 잔존 찾기
- **글 비판** = blog / 보고서 / spec 의 논리 / 사실 / 모호 / 누락 찾기
- **의사결정** = 결정문의 가정 / 위험 / 대안 / 비용 미산정 찾기
- **agent loop output** = tool call sequence 의 잘못된 순서 / 빠진 검증 / 잘못된 fallback 찾기
- **자가검증 / dream pass** = 누적 기록 (memory, journal) 의 패턴 추출 + 잘못된 가정 식별

---

## 작동 안 한 케이스 (정직 게재)

`Mindchange` 가 *negative spiral* (모델이 자기 비판에 깊이 빠져 = 결과물 무한 부정) 빠지는 케이스:

(1) **부정적 자아 너무 강하게 박은 경우** = "모든 게 결함이다" 톤 = 2 단계에서도 12/12 항목 다 "진짜 약함" 으로 분류 = 3 단계에서 원본 전부 폐기 = 같은 자리에서 같은 quality 다시 생성. *0 lift*.

대응 = 1 단계 prompt 에 "최소 2 개, *최대 5 개*" 상한 박기. 또한 2 단계에 "외부 reader 기준" 명시.

(2) **모델 sycophant 본능 강한 경우** = 1 단계에서 "비판 못 찾음" 답변 (gpt-3.5-turbo 류).

대응 = 1 단계 prompt 에 "못 찾는 카테고리도 *없다* 라고 명시" 강제. 또한 *상한이 아니라 하한* (최소 2 개) 박기.

(3) **모델 self-bias 강한 경우** = 자기가 박은 결과물을 거의 비판 안 함. 다른 사람 글이면 비판 가능한 모델도.

대응 = 1 단계 personality prompt 에 "남이 만든 결과물처럼 봐야 한다" 명시.

(4) **모델 컨텍스트 창 작은 경우** = 원본 + 1 단계 + 2 단계 결과 모두 컨텍스트 안 박혀야 = 3 단계 작동. 모델이 작은 컨텍스트 (4K 이하) 면 = 원본 일부만 보고 재작성 = 결과물 손상.

대응 = 컨텍스트 8K 이상 모델 권고. 7B+ 모델 중에서 `num_ctx=8192` 이상 명시 호출.

---

## 측정 metric

3 단계 후 = 원본 vs 재작성 결과물 비교 metric:

- **결함 fix 비율** = 1 단계 비판 항목 중 3 단계 재작성에서 실제로 fix 된 비율 (수동 또는 LLM-judge 평가)
- **lift 점수** = 원본 quality 점수 vs 재작성 quality 점수 차이 (1-10 척도)
- **negative spiral 비율** = N 회 실행 중 *원본 전부 폐기 + 같은 자리 같은 quality 재생성* 비율
- **시간 비용** = 3 단계 sequence 총 시간 / 단순 1 회 생성 시간 비율 (보통 2.5-4 배)

`Mindchange` 가 *유효* 라고 평가할 기준:
- 결함 fix 비율 ≥ 60%
- lift 점수 ≥ +1.5 (1-10 척도)
- negative spiral 비율 ≤ 10%
- 시간 비용 ≤ 4 배

---

## 6 종 axis 와의 통합

`MINDCHANGE.md` 를 컨텍스트 엔지니어링 라인에 박을 때:

| Axis | 역할 | Mindchange 와의 관계 |
|---|---|---|
| `CLAUDE.md` | 프로젝트 컨벤션 / failure pattern | 1 단계 비판 카테고리의 *실제 패턴* 정의 |
| `AGENTS.md` | 출력 스키마 | 3 단계 재작성 결과의 *형식 제약* |
| `MEMORY.md` | 누적 발견 | 1 단계 비판 시 *과거 비슷한 결함* reference |
| `TESTING.md` | 검증 패턴 | 2 단계 자가검증의 *통과 / 실패 기준* |
| `GLOSSARY.md` | 용어 | 1-3 단계 모두 *모호 술어* 식별 |
| `ADR` (의사결정 기록) | 과거 결정 | 1 단계 비판 시 *과거 결정과의 일관성* 검사 |
| `MINDCHANGE.md` | personality sequence | *위 6 종을 어떻게 sequence 시킬지* |

즉 = Mindchange 자체는 *axis 위에 앉는 axis*. 다른 6 종이 *내용* 을 정의하고 = Mindchange 가 *순서* 와 *personality 전환* 을 정의한다.

---

## 관련 라인 (인용)

기존 self-critique / Reflexion / MetaCrit 라인 = 명시 인용 (rebrand 비판 회피):

- **MetaCrit** = 4-agent 메타인지 framework. Nelson-Narens 메타인지 이론 기반. object-level / monitoring / control / meta-level synthesiser. ([arxiv 2507.15015](https://arxiv.org/pdf/2507.15015))
- **MAR (Multi-Agent Reflexion)** = persona-based critics 토론. self-bias 회피 목적. ([arxiv 2512.20845](https://arxiv.org/pdf/2512.20845))
- **MyGO PR-CoT** = 다관점 반성 chain-of-thought. 4 관점 (논리 / 정보 / 편향 / 대안) 자가 평가. ([arxiv 2601.07780](https://arxiv.org/pdf/2601.07780))
- **Reflect-Retry-Reward** = 강화학습 기반 self-improving. ([arxiv 2505.24726](https://arxiv.org/pdf/2505.24726))
- **Self-Reflection 기본 패턴** = 첫 답 → 자가비판 → 수정. 가장 generic. ([promptengineering.org](https://promptengineering.org/llms-learn-humility-how-self-critique-improves-logic-and-reasoning-in-llms-like-chatgpt/))

Mindchange = 이 라인들의 *1 인 빌더 adaptation*. 학술 새로움 약함 + 실용 가치 + 브랜딩 선점 우선.

---

## 적용 라이센스

MIT. 자유 사용 / 수정 / 배포. 출처 표기 권고 = "Wildeconforce MINDCHANGE.md axis"
