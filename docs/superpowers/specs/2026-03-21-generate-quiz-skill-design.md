# CS Quiz Generator Skill — Design Spec

## Overview

`/generate-quiz <topicId>` 스킬은 CS 퀴즈 문제의 생성-평가-임포트 파이프라인을 자동화한다. 토픽 ID를 입력하면 기존 문제의 gap 분석부터 DB 임포트까지 전 과정을 에이전트 팀이 수행한다.

**목표**: 한 번 실행당 30문제 생성 (10 concept × 3 난이도)

## 선행 작업

### import.ts 리팩토링

현재 `scripts/ai-regenerate/import.ts`에 `validateQuestion(q, file, index)` 함수가 이미 존재한다 (line 123-186). 다만 `file`, `index` 파라미터가 import 컨텍스트에 종속되어 있어 재사용이 어렵다. 스킬 구현 전에:

1. `validateQuestion(q): ValidationResult` 형태로 리팩토링 — `file`, `index` 파라미터를 제거하고, 실패 시 단순 boolean이 아닌 구체적인 에러 메시지와 실패 필드명을 배열로 반환
2. `scripts/ai-regenerate/validate.ts`로 분리하여 export
3. `import.ts`가 이 유틸을 import하여 사용하도록 변경
4. 스킬의 Step 4(Evaluator)에서도 동일 함수를 재사용

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;      // 실패한 필드명 (e.g., "answerOptions[2].rationale_ko")
    message: string;    // 구체적 에러 메시지
  }>;
}
```

이를 통해 validation 규칙이 한 곳에서 관리되고, dry-run 실패를 사전에 방지하며, 에러 발생 시 어떤 문제의 어떤 필드에서 실패했는지 추적이 가능하다.

### DB 스키마 참고사항

현재 Prisma 스키마의 `Question` 모델에는 `difficulty`, `questionType` 컬럼이 없다. 이 필드들은 생성 JSON 파일에만 기록되며, import 시 DB에 저장되지 않는다. 향후 난이도별 필터링 등이 필요하면 별도 스키마 마이그레이션으로 추가할 수 있으나, 이 스킬의 초기 버전에서는 기존 import 동작을 그대로 유지한다.

## 스킬 인터페이스

```
/generate-quiz <topicId>
```

- `topicId`: `VALID_TOPIC_IDS` 중 하나 (예: `algorithm`, `database`, `operatingSystem`)
- 별도 인자 없이 topicId만 받으면, 에이전트가 기존 문제를 분석하여 gap을 찾고 concept map부터 자동 생성

## 모델 설정

기본값은 전부 opus. 실행 후 리포트의 Timing 섹션을 보고 Question Generator에 병목이 있으면 sonnet으로 내릴 수 있다.

```
models: {
  gapAnalyzer: "opus",
  conceptMapGenerator: "opus",
  questionGenerator: "opus",     // 병목 시 sonnet으로 변경
  evaluator: "opus"
}
```

## 파이프라인 전체 흐름

```
/generate-quiz algorithm
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 1: Gap Analyzer (opus)                            │
│  DB에서 해당 토픽의 모든 문제 조회                        │
│  + generated/concepts/ 기존 concept map 참조             │
│  → 이미 다뤄진 concept 목록 추출 → forbidden zone 생성    │
│  ※ DB에 difficulty/questionType이 없으므로               │
│    난이도/유형별 gap 분석은 수행하지 않음                  │
│    순수하게 '새로운 Concept 발굴'에만 집중                 │
│  실패 시: DB 연결 오류 → 파이프라인 중단 + 에러 리포트     │
│                                                         │
│  출력: {                                                 │
│    coveredConcepts: string[],                            │
│    totalExisting: number                                 │
│  }                                                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 2: Concept Map Generator (opus)                   │
│  입력: topicId + forbidden zone + references.json       │
│  references.json의 실러버스 목차를 프롬프트에 주입        │
│  (LLM 내부 지식 1순위 + 실러버스로 커버리지 검증)         │
│  forbidden zone 제외하고 10 concept × 3 keyAngle 생성    │
│                                                         │
│  저장: generated/concepts/{topicId}-{YYYYMMDD}.json     │
│                                                         │
│  출력 형식: (아래 "Concept Map 출력 형식" 섹션 참조)      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 3: Question Generator (opus, 배치 3~5개 병렬)      │
│  입력: concept별 3개 keyAngle + 실러버스 컨텍스트         │
│  concept당 3문제 (easy/medium/hard 각 1개) 생성           │
│  10개 concept → 3개 배치 (4+3+3)로 나눠 병렬 실행         │
│                                                         │
│  저장: generated/questions/{topicId}-{YYYYMMDD}.json    │
│  출력: GeneratedQuestion[] (30개)                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 4-5 통합 루프 (totalRetryBudget = 10)              │
│                                                         │
│  4a. validateQuestion() 사전 검증                        │
│      import.ts와 동일한 validation 로직 재사용            │
│      실패 → 즉시 REJECT (budget 소비 안 함)              │
│                                                         │
│  4b. LLM 평가 (4a 통과한 문제만)                         │
│      answer_correctness < 8 → REJECT                    │
│      3차원 평균 >= 8.0 → PASS                            │
│      3차원 평균 5.0~7.9 → REVISE                         │
│      3차원 평균 < 5.0 → REJECT                           │
│                                                         │
│  4c. REVISE 처리 (budget -1 per question)                │
│      구조화 피드백 JSON → Agent 3 재생성                  │
│      → 4a부터 재평가 (이전 평가 이력 포함)                │
│                                                         │
│  4d. 30개 미달 시 보충 (budget -1 per round)             │
│      Agent 2(추가 concept) → Agent 3 → 4a부터 평가       │
│                                                         │
│  5a. dry-run 실행                                        │
│      성공 → import + auto-tag                            │
│      중복 오류 → 해당 문제 제거 +                         │
│      Agent 3 대체 생성 (budget -1) → 4a부터 재평가        │
│                                                         │
│  budget 소진 → 현재 결과물로 확정                         │
│  30개 충족 + dry-run 통과 → import + auto-tag            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 6: Report                                         │
│  (아래 "리포트 형식" 섹션 참조)                           │
└─────────────────────────────────────────────────────────┘
```

## 에이전트 구성

| 에이전트 | 모델 | 역할 |
|---|---|---|
| Gap Analyzer | opus | DB 조회 + concept/angle 추출 + gap 판단 |
| Concept Map Generator | opus | 레퍼런스 참조 + forbidden zone 제외 + concept map 생성 |
| Question Generator | opus | keyAngle별 bilingual 문제 생성 (배치 3~5개 병렬) |
| Evaluator | opus | 룰 기반 사전 검증 + LLM 3차원 평가 |
| Coordinator | - | 파이프라인 오케스트레이션 (스킬 본체) |

## Concept Map 출력 형식

```json
{
  "subject": "Algorithm",
  "totalConcepts": 10,
  "categories": [
    {
      "name": "Category Name",
      "name_ko": "카테고리명",
      "concepts": [
        {
          "name": "Concept Name",
          "name_ko": "개념명",
          "questionCount": 3,
          "keyAngles": [
            {
              "angle": "Specific scenario or question angle",
              "difficulty": "easy",
              "questionType": "conceptual"
            },
            {
              "angle": "Another angle requiring deeper analysis",
              "difficulty": "medium",
              "questionType": "comparative"
            },
            {
              "angle": "Edge case or common misconception",
              "difficulty": "hard",
              "questionType": "trap"
            }
          ],
          "why": "1-sentence justification for why this concept is exam-worthy"
        }
      ]
    }
  ]
}
```

**keyAngle 설계 원칙**:
- angle은 구체적이어야 한다. "Test binary search"가 아니라 "이진 탐색에서 mid = (low + high) / 2의 정수 오버플로우 가능성 분석"
- 각 angle에 difficulty가 명시되어 concept당 easy/medium/hard가 각 1개
- questionType: conceptual, code_trace, comparative, trap 중 택 1

## Question 출력 형식

`GeneratedQuestion` 인터페이스를 그대로 따른다 (import.ts 호환):

```json
{
  "question_ko": "한국어 질문",
  "question_en": "English question",
  "hint_ko": "힌트 (정답 미노출)",
  "hint_en": "Hint (no answer reveal)",
  "topic": "algorithm",
  "difficulty": "easy",
  "concept": "Concept Name",
  "questionType": "conceptual",
  "answerOptions": [
    {
      "text_ko": "선택지",
      "text_en": "Option",
      "rationale_ko": "왜 맞는지/틀린지 2-3문장",
      "rationale_en": "2-3 sentence rationale",
      "isCorrect": true
    }
  ]
}
```

**True/False 문제 형식**:
- `answerOptions` 배열에 정확히 2개 항목: `text_ko: "참"` / `text_en: "True"`, `text_ko: "거짓"` / `text_en: "False"`
- `question_ko`/`question_en`은 하나의 주장(statement) 형태로 작성
- 각 선택지의 rationale은 내용이 중복되지 않아야 함 (정답은 핵심 원리, 오답은 논리적 어긋남)

**Multiple Choice 문제 형식**:
- `answerOptions` 배열에 4개 항목 (1 정답 + 3 오답)
- `question_ko`/`question_en`은 질문 형태로 작성

**문제 스타일 규칙**:
- True/False와 Multiple Choice를 약 50:50으로 배분
- easy: 학부 2~3학년이 교과서를 읽고 바로 풀 수 있는 수준
- medium: 두 개 이상의 개념을 연결하거나 구체적 시나리오에 적용
- hard: 엣지 케이스, 흔한 오해 함정. 대학원 입시 수준은 넘지 않는다
- bilingual: 한국어와 영어 동일 내용, 각 언어에 자연스러운 표현
- code_trace 유형은 pseudo-code 수준
- 정답 위치 셔플은 백엔드에서 처리하므로 신경 쓰지 않음

## 평가 루브릭

### 룰 기반 사전 검증 (validateQuestion)

import.ts에서 추출한 동일 로직:
- `topic`이 `VALID_TOPIC_IDS`에 포함
- 필수 필드: `question_ko`, `question_en`, `hint_ko`, `hint_en`, `topic`
- `answerOptions` 배열 길이 >= 2
- `isCorrect === true`가 정확히 1개
- 각 option: `text_ko`, `text_en`, `rationale_ko`, `rationale_en` 필수
- `difficulty`가 `easy` | `medium` | `hard` 중 하나

실패 시 즉시 REJECT, budget 소비 없음.

### LLM 3차원 평가

기존 workflow의 7차원 루브릭(answer_correctness, distractor_quality, educational_value, difficulty_accuracy, rationale_quality, bilingual_quality, hint_quality)에서 핵심 품질 게이트 3차원으로 축소한다. 나머지 4차원(educational_value, rationale_quality, bilingual_quality, hint_quality)은 Question Generator의 프롬프트 지시사항에서 커버하며, 평가 단계에서 별도 점수를 매기지 않는다.

| 차원 | 설명 | 점수 범위 |
|---|---|---|
| answer_correctness | 정답이 실제로 맞고 rationale이 논리적인지 | 1-10 |
| distractor_quality | 오답이 그럴듯한 함정으로 기능하는지 | 1-10 |
| difficulty_accuracy | 태깅된 난이도와 체감 난이도가 일치하는지 | 1-10 |

**판정 규칙**:
- `answer_correctness < 8` → 자동 REJECT
- 3차원 평균 >= 8.0 → PASS
- 3차원 평균 5.0~7.9 → REVISE
- 3차원 평균 < 5.0 → REJECT

**code_trace 유형 특별 규칙**:

code_trace 문제는 의사코드 실행 결과를 추적해야 하므로 LLM의 환각(hallucination) 위험이 높다. Evaluator 프롬프트에 다음을 강제한다:

1. 코드의 각 단계를 명시적으로 실행하여 **단계별 상태 변화(State change step-by-step)**를 작성
2. 최종 실행 결과를 도출한 뒤, 정답 선택지의 주장과 대조
3. 상태 추적 결과와 정답이 일치하지 않으면 `answer_correctness`를 자동으로 5 이하로 부여

이를 통해 Question Generator가 만든 잘못된 코드 실행 결과를 Evaluator가 동조하여 "맞다"고 평가하는 편향을 방지한다.

## REVISE 피드백 구조

Evaluator → Question Generator로 전달되는 구조화 피드백:

```json
{
  "questionIndex": 5,
  "verdict": "REVISE",
  "scores": {
    "answer_correctness": 7.0,
    "distractor_quality": 6.5,
    "difficulty_accuracy": 9.0
  },
  "feedback": [
    {
      "dimension": "answer_correctness",
      "issue": "선택지 B의 rationale이 정답과 모순 — O(n²)이라고 하지만 worst case는 O(n log n)",
      "action": "선택지 B의 rationale 수정 또는 더 그럴듯한 오답으로 교체"
    },
    {
      "dimension": "distractor_quality",
      "issue": "선택지 C가 너무 명백히 틀려서 함정으로 기능하지 않음",
      "action": "학생들이 실제로 혼동하는 오개념 기반 선택지로 교체"
    }
  ],
  "originalQuestion": { ... }
}
```

**재평가 시 평가 이력 포함**: Evaluator가 REVISE 후 재평가할 때, 이전 평가의 점수 + 피드백 + 수정 내역을 함께 받는다. 이를 통해:
- "이전에 이런 피드백을 줬는데 어떻게 수정되었는지" 평가 가능
- 같은 문제를 다른 관점에서 또 REVISE 주는 루프 방지

```json
{
  "question": { ... },
  "evaluationHistory": [
    {
      "round": 1,
      "scores": { "answer_correctness": 7.0, "distractor_quality": 6.5, "difficulty_accuracy": 9.0 },
      "feedback": [ ... ]
    }
  ]
}
```

## 에러 처리

### 에러 처리 원칙

- **인프라 오류** (DB 연결 실패 등) → 즉시 파이프라인 중단 + 에러 리포트
- **생성/평가 오류** → totalRetryBudget(10회) 내에서 자동 재시도
- **budget 소진** → 가능한 만큼만 import + 리포트에 미달 사유 기재

### totalRetryBudget (기본값: 10, 설정 가능)

Step 4~5를 합쳐서 총 재시도 횟수를 파이프라인 레벨에서 관리한다. 30문제 기준 REVISE율 20% (6문제)를 감안하여 기본값은 10으로 설정하며, 보충 루프와 dry-run 대체 생성까지 커버할 수 있는 여유를 둔다. 30개 미만으로 끝나는 것은 허용 가능한 결과이며, 리포트에 미달 사유가 기재된다.

| 상황 | budget 소비 |
|---|---|
| REVISE → 재생성 1회 | -1 |
| 보충 루프 1라운드 | -1 |
| dry-run 중복 → 대체 생성 1회 | -1 |
| validateQuestion 실패 → 즉시 REJECT | 0 (소비 안 함) |

### dry-run 실패 분기

- **구조적 오류**: validateQuestion()을 사전에 돌리므로 발생하지 않아야 함
- **중복 오류**: 해당 문제 제거 + Agent 3로 같은 concept의 새 angle로 대체 생성 (budget -1)

### 레퍼런스 관련

references.json은 실러버스 목차를 하드코딩하여 프롬프트에 직접 주입하므로, WebFetch 의존성이 없다. 외부 네트워크 호출 없이 안정적으로 동작한다.

## 레퍼런스 관리

### 파일 위치

`scripts/ai-regenerate/references.json` — 토픽별 참고 사이트를 하나의 파일로 관리

### 설계 철학

CS 기초 과목은 지식의 휘발성이 낮다. 알고리즘, OS, 네트워킹 등의 커리큘럼은 수십 년간 안정적이므로, 불안정한 WebFetch에 의존하기보다 LLM의 내부 지식을 1순위로 활용하고, 레퍼런스는 **커리큘럼 목차(Syllabus) 형태로 하드코딩**하여 프롬프트에 주입한다.

### 구조

```json
{
  "algorithm": {
    "sources": [
      "MIT 6.006 Introduction to Algorithms",
      "CLRS (Introduction to Algorithms, Cormen et al.)",
      "Khan Academy — Algorithms"
    ],
    "syllabus": [
      "Asymptotic Analysis (Big-O, Omega, Theta)",
      "Sorting: Insertion, Merge, Quick, Heap, Counting, Radix",
      "Searching: Binary Search, Hash Tables",
      "Graph Algorithms: BFS, DFS, Topological Sort",
      "Shortest Paths: Dijkstra, Bellman-Ford, Floyd-Warshall",
      "Minimum Spanning Trees: Prim, Kruskal",
      "Dynamic Programming: LCS, Knapsack, Edit Distance",
      "Greedy Algorithms: Activity Selection, Huffman Coding",
      "Divide and Conquer: Master Theorem, Strassen's",
      "String Matching: KMP, Rabin-Karp",
      "Network Flow: Ford-Fulkerson, Max-Flow Min-Cut",
      "NP-Completeness: Reductions, Approximation Algorithms",
      "Amortized Analysis, Randomized Algorithms"
    ]
  },
  "dataStructure": {
    "sources": [
      "Open Data Structures (Pat Morin)",
      "MIT 6.851 Advanced Data Structures"
    ],
    "syllabus": [
      "Arrays, Linked Lists (Singly, Doubly, Circular)",
      "Stacks, Queues, Deques",
      "Hash Tables: Chaining, Open Addressing, Load Factor",
      "Trees: Binary Tree, BST, AVL, Red-Black Tree",
      "Heaps: Binary Heap, Priority Queue",
      "Tries, Suffix Trees",
      "Graphs: Adjacency List, Adjacency Matrix",
      "Disjoint Set (Union-Find)",
      "B-Trees, B+ Trees",
      "Skip Lists, Bloom Filters"
    ]
  },
  "database": {
    "sources": [
      "CMU 15-445/645 Intro to Database Systems",
      "Stanford DB Course (Jennifer Widom)"
    ],
    "syllabus": [
      "Relational Model, Relational Algebra",
      "SQL: DDL, DML, Joins, Subqueries, Aggregation",
      "Normalization: 1NF, 2NF, 3NF, BCNF",
      "Indexing: B+ Tree, Hash Index, Composite Index",
      "Query Processing and Optimization",
      "Transactions: ACID, Serializability",
      "Concurrency Control: 2PL, MVCC, Deadlock",
      "Recovery: WAL, Checkpointing, ARIES",
      "Distributed Databases: CAP Theorem, Replication",
      "NoSQL: Key-Value, Document, Column-Family, Graph DB"
    ]
  },
  "operatingSystem": {
    "sources": [
      "OSTEP (Remzi Arpaci-Dusseau)",
      "MIT 6.1810 Operating System Engineering"
    ],
    "syllabus": [
      "Process Management: PCB, Context Switching, Fork/Exec",
      "CPU Scheduling: FCFS, SJF, Round Robin, MLFQ, CFS",
      "Threads: User vs Kernel, POSIX Threads",
      "Synchronization: Mutex, Semaphore, Monitor, Condition Variable",
      "Deadlock: Detection, Prevention, Avoidance (Banker's)",
      "Memory Management: Paging, Segmentation, TLB",
      "Virtual Memory: Page Replacement (LRU, Clock), Thrashing",
      "File Systems: Inode, FAT, Journaling, Log-Structured",
      "I/O Management: DMA, Interrupt Handling",
      "Inter-Process Communication: Pipe, Shared Memory, Message Queue"
    ]
  },
  "computerNetworking": {
    "sources": [
      "Computer Networking: A Top-Down Approach (Kurose/Ross)",
      "MIT 6.033 Computer System Engineering"
    ],
    "syllabus": [
      "OSI 7-Layer & TCP/IP 4-Layer Models",
      "Application Layer: HTTP, DNS, SMTP, FTP, WebSocket",
      "Transport Layer: TCP (3-way handshake, Flow/Congestion Control), UDP",
      "Network Layer: IP, CIDR, NAT, ICMP, Routing (RIP, OSPF, BGP)",
      "Data Link Layer: Ethernet, ARP, MAC Addressing, VLAN",
      "Physical Layer: Encoding, Multiplexing",
      "Network Security: TLS/SSL, Firewall, VPN, IPSec",
      "Wireless: Wi-Fi (802.11), Cellular",
      "SDN, Multicast, CDN",
      "Socket Programming, REST API Design"
    ]
  },
  "computerArchitecture": {
    "sources": [
      "Nand2Tetris",
      "Computer Organization and Design (Patterson/Hennessy)",
      "MIT 6.823 Computer System Architecture"
    ],
    "syllabus": [
      "Number Systems, Boolean Algebra, Logic Gates",
      "Combinational Circuits: MUX, Decoder, ALU",
      "Sequential Circuits: Flip-Flops, Registers, Counters",
      "Instruction Set Architecture: RISC vs CISC",
      "CPU Datapath and Control Unit",
      "Pipelining: Hazards (Data, Control, Structural), Forwarding",
      "Cache Memory: Direct-Mapped, Set-Associative, Write Policies",
      "Virtual Memory: Page Table, TLB, Multi-Level Paging",
      "I/O: Polling, Interrupt, DMA",
      "Parallelism: ILP, SIMD, Multicore, GPU Architecture"
    ]
  },
  "computerSecurity": {
    "sources": [
      "UC Berkeley CS161 Textbook",
      "MIT 6.857 Network and Computer Security",
      "NIST SP 800 Series"
    ],
    "syllabus": [
      "Memory Safety: Buffer Overflow, Stack Smashing, ROP",
      "Defense Mechanisms: ASLR, DEP/NX, Stack Canaries",
      "Symmetric Cryptography: AES, DES, Block Cipher Modes",
      "Asymmetric Cryptography: RSA, Diffie-Hellman, ECC",
      "Hash Functions: SHA, HMAC, Digital Signatures",
      "PKI: Certificates, Certificate Authorities, TLS Handshake",
      "Web Security: SQL Injection, XSS, CSRF, CORS",
      "Authentication: Password Hashing, MFA, OAuth/OIDC",
      "Network Security: Firewall, IDS/IPS, VPN",
      "Access Control: DAC, MAC, RBAC, Bell-LaPadula"
    ]
  },
  "softwareEngineering": {
    "sources": [
      "SWEBOK v4 (IEEE Computer Society)",
      "MIT 6.033 Computer System Engineering"
    ],
    "syllabus": [
      "SDLC Models: Waterfall, Agile (Scrum, Kanban), Spiral",
      "Requirements Engineering: Elicitation, Specification, Validation",
      "Software Design: Modularity, Coupling, Cohesion",
      "Design Patterns: Creational, Structural, Behavioral (GoF)",
      "Software Architecture: Layered, Microservices, Event-Driven",
      "Testing: Unit, Integration, System, Acceptance, TDD",
      "Version Control: Git, Branching Strategies",
      "CI/CD: Build Automation, Deployment Pipelines",
      "Software Quality: Code Review, Static Analysis, Metrics",
      "Project Management: Estimation, Risk Management"
    ]
  },
  "springBoot": {
    "sources": [
      "Spring Boot Official Documentation",
      "Spring.io Guides",
      "Baeldung — Spring Boot Series"
    ],
    "syllabus": [
      "Spring Core: IoC Container, DI, Bean Lifecycle, AOP",
      "Auto-Configuration, @SpringBootApplication, Starter Dependencies",
      "Spring MVC: @Controller, @RestController, Request Mapping",
      "Data Access: Spring Data JPA, Repository Pattern, Transactions",
      "Security: Spring Security, Authentication, Authorization, JWT",
      "Testing: @SpringBootTest, MockMvc, @DataJpaTest",
      "Configuration: application.yml, Profiles, @Value, @ConfigurationProperties",
      "Exception Handling: @ControllerAdvice, @ExceptionHandler",
      "Actuator: Health Checks, Metrics, Custom Endpoints",
      "Deployment: Embedded Server, Docker, Cloud Deployment"
    ]
  }
}
```

### 활용 방식

1. Concept Map Generator의 프롬프트에 해당 토픽의 `syllabus` 배열을 주입 → LLM이 커리큘럼 전체를 조망하면서 gap을 찾도록 유도
2. Question Generator의 프롬프트에 `sources` 정보를 주입 → 출처 수준의 학술적 정확성 기대치를 설정
3. LLM 내부 지식이 1순위, syllabus는 커버리지 검증용 체크리스트 역할

## 파일 저장 경로

기존 디렉토리 구조를 따르되 날짜 기반 네이밍으로 기존 파일과 충돌 방지:

| 산출물 | 경로 |
|---|---|
| Concept map | `scripts/ai-regenerate/generated/concepts/{topicId}-{YYYYMMDD}.json` |
| Generated questions | `scripts/ai-regenerate/generated/questions/{topicId}-{YYYYMMDD}.json` |
| PASS questions | `scripts/ai-regenerate/generated/evaluated/pass/{topicId}-{YYYYMMDD}.json` |
| REJECT questions | `scripts/ai-regenerate/generated/evaluated/reject/{topicId}-{YYYYMMDD}.json` |
| Validation utility | `scripts/ai-regenerate/validate.ts` |
| References | `scripts/ai-regenerate/references.json` |

## 리포트 형식

파이프라인 완료 후 터미널에 출력:

```
═══════════════════════════════════════════════════════
  CS Quiz Generator Report — algorithm (2026-03-21)
═══════════════════════════════════════════════════════

📊 Summary
  Target: 30 questions    Generated: 34    Imported: 30
  PASS: 30    REVISE: 3 (→ 2 recovered)    REJECT: 4
  Supplement rounds: 1
  Retry budget used: 3/10

📂 Files
  Concept map:  generated/concepts/algorithm-20260321.json
  Questions:    generated/questions/algorithm-20260321.json
  PASS:         generated/evaluated/pass/algorithm-20260321.json
  REJECT:       generated/evaluated/reject/algorithm-20260321.json

📝 Concept Breakdown
  ┌────────────────────────┬───────┬────────┬──────┬─────────┐
  │ Concept                │ Easy  │ Medium │ Hard │ Status  │
  ├────────────────────────┼───────┼────────┼──────┼─────────┤
  │ Amortized Analysis     │  1    │  1     │  1   │ 3/3 ✓   │
  │ Randomized Algorithms  │  1    │  1     │  1   │ 3/3 ✓   │
  │ String Matching        │  1    │  1     │  1   │ 3/3 ✓   │
  │ ...                    │       │        │      │         │
  └────────────────────────┴───────┴────────┴──────┴─────────┘
  Difficulty distribution: Easy 10 / Medium 10 / Hard 10

📋 Evaluation Scores (PASS avg)
  answer_correctness:  9.2
  distractor_quality:  8.5
  difficulty_accuracy: 8.8

❌ REJECT Details
  #12 (String Matching / hard)
      Reason: answer_correctness 6.0 — 정답 rationale에 논리적 오류
      Retry history: REVISE x2 → REJECT
  #27 (Network Flow / medium)
      Reason: distractor_quality 5.5 — 2회 REVISE 후에도 미달

⚠️  Warnings
  Retry budget used 8/10 — target 30 not fully met (28 imported)
  code_trace question #15: step-by-step trace required 2 correction rounds

⏱️  Timing
  Gap Analysis:           12s
  Concept Map Generation: 45s
  Question Generation:    3m 22s  (3 batches × ~67s)
  Evaluation + REVISE:    2m 15s
  Import & Tag:           8s
  ─────────────────────────────
  Total:                  6m 42s
```

## 톤앤매너 가이드라인

생성된 문제는 기존 문제(evaluated/pass/ 내 약 800문제)와 동일한 톤앤매너를 유지해야 한다:

- 학부 수준의 지식 기반 문제 (특정 언어/도구 의존 X)
- True/False와 Multiple Choice 약 50:50
- 한국어: 자연스러운 학술 문체, 기술 용어는 영어 원어 괄호 병기 가능
- 영어: 명확하고 간결한 학술 문체
- rationale: 정답은 "왜 맞는지", 오답은 "왜 틀린지"를 구체적으로. T/F에서 양쪽 rationale 내용 중복 금지
- hint: 정답을 직접 노출하지 않되 올바른 방향으로 유도
- code_trace 유형은 pseudo-code (5-15줄)

에이전트 프롬프트에 기존 문제 2-3개를 few-shot 예시로 포함하여 톤 일관성을 확보한다.
