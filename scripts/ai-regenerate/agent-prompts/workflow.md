# Multi-Agent Question Generation Workflow

## Overview

```
Agent 1 (Claude)     Agent 2 (Claude)     Agent 3 (Gemini)     Agent 4 (ChatGPT)
토픽 기획자           문제 출제자            품질 평가자           문제 수정자
     │                    │                     │                    │
     ▼                    ▼                     ▼                    ▼
 개념 맵 생성  ──→   문제 JSON 생성  ──→   점수 + 판정   ──→   REVISE 수정
 (4회 대화)          (~50회 대화)          (~50회 대화)        (필요시)
                                               │
                                          ┌────┼────┐
                                        PASS REVISE REJECT
                                          │    │      │
                                          ▼    ▼      ▼
                                        저장  수정→재평가  폐기
```

## Step-by-Step Guide

### Step 1: Agent 1 — 토픽 기획 (30분)

1. Claude Pro에서 새 Project 생성: "CS Quiz - Topic Planner"
2. `agent1-topic-planner.md`의 시스템 프롬프트를 Project Instructions에 붙여넣기
3. 4번 대화 (토픽당 1회):
   - "Subject: Algorithm (알고리즘)"
   - "Subject: Data Structure (자료구조)"
   - "Subject: Database (데이터베이스)"
   - "Subject: Computer Security (컴퓨터 보안)"
4. 결과 JSON을 아래에 저장:
   - `generated/concepts/algorithm.json`
   - `generated/concepts/dataStructure.json`
   - `generated/concepts/database.json`
   - `generated/concepts/computerSecurity.json`

### Step 2: Agent 2 — 문제 출제 (3시간)

1. Claude Pro에서 새 Project 생성: "CS Quiz - Question Creator"
2. `agent2-question-creator.md`의 시스템 프롬프트를 Project Instructions에 붙여넣기
3. Step 1에서 생성한 concept map JSON을 Project Knowledge에 업로드
4. 카테고리 단위로 대화 (~50회):
   - "Topic: algorithm, Category: Sorting — 아래 concepts의 keyAngle별로 문제 생성: [해당 concepts 붙여넣기]"
5. 결과 JSON을 아래에 저장:
   - `generated/questions/algorithm-sorting.json`
   - `generated/questions/algorithm-graph.json`
   - ...

### Step 3: Agent 3 — 품질 평가 (2시간)

1. Gemini Pro (gemini.google.com)에서 새 대화 시작
2. `agent3-evaluator.md`의 시스템 프롬프트를 첫 메시지로 전송
3. Step 2에서 생성한 문제 JSON을 배치로 전송 (~50회):
   - "아래 문제들을 평가해주세요. [questions JSON]"
4. 결과를 판정별로 분류 저장:
   - `evaluated/pass/algorithm-sorting.json`
   - `evaluated/revise/algorithm-sorting.json`
   - `evaluated/reject/algorithm-sorting.json`

### Step 4: Agent 4 — 수정 (필요시, 1시간)

1. ChatGPT Pro (chatgpt.com)에서 새 대화 시작
2. `agent4-reviser.md`의 시스템 프롬프트를 첫 메시지로 전송
3. REVISE 판정 문제 + 평가 피드백을 함께 전송:
   - "아래 문제들을 피드백에 따라 수정해주세요. [question + evaluation pairs]"
4. 수정된 문제를 Agent 3에게 재평가 요청
5. 2회 시도 후에도 PASS 안 되면 폐기
6. 최종 PASS 문제를 `evaluated/pass/`에 추가

### Step 5: Import — DB 투입

```bash
npx ts-node scripts/ai-regenerate/import.ts
```

## Directory Structure

```
scripts/ai-regenerate/
├── agent-prompts/
│   ├── agent1-topic-planner.md       ← 시스템 프롬프트
│   ├── agent2-question-creator.md
│   ├── agent3-evaluator.md
│   ├── agent4-reviser.md
│   └── workflow.md                   ← 이 파일
├── generated/
│   ├── concepts/                     ← Agent 1 결과물
│   │   ├── algorithm.json
│   │   ├── dataStructure.json
│   │   ├── database.json
│   │   └── computerSecurity.json
│   ├── questions/                    ← Agent 2 결과물
│   │   ├── algorithm-sorting.json
│   │   ├── algorithm-graph.json
│   │   └── ...
│   └── evaluated/                    ← Agent 3 결과물
│       ├── pass/
│       ├── revise/
│       └── reject/
├── import.ts                         ← DB import 스크립트 (작성 예정)
├── prompts.ts                        ← 기존 (API용, 참고용)
└── regenerate.ts                     ← 기존 (API용, 참고용)
```

## Expected Results

| Metric | Expected |
|--------|----------|
| 생성 문제 수 | ~500 |
| PASS | ~350 (70%) |
| REVISE → PASS | ~70 (14%) |
| REVISE → REJECT | ~30 (6%) |
| REJECT | ~50 (10%) |
| **최종 사용 가능** | **~420** |
| 총 소요 시간 | 5~7시간 |
| 추가 비용 | $0 |

## Tips

- Agent 2에서 생성 시, 한 대화 내에서 같은 카테고리를 모두 처리하면 중복이 줄어듭니다.
- Agent 3 평가 시, Gemini의 출력이 가끔 JSON이 아닌 마크다운으로 올 수 있습니다. "Respond ONLY with JSON"을 강조하세요.
- JSON 파싱 오류가 나면, 해당 부분만 복사해서 다시 요청하세요.
- 문제 생성은 하루에 몰아서 할 필요 없습니다. concepts 단위로 나눠서 며칠에 걸쳐 진행해도 됩니다.
