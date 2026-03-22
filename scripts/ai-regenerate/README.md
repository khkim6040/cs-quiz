# AI 생성 문제 Import 가이드

이 디렉토리는 AI로 생성한 퀴즈 문제를 DB에 투입하는 스크립트들을 포함합니다.

## 📁 디렉토리 구조

```
scripts/ai-regenerate/
├── import.ts              # 문제 import 스크립트
├── add-topic.ts           # 토픽 추가 스크립트
├── generated/
│   └── evaluated/
│       └── pass/          # 검증 완료된 문제 JSON 파일들
│           ├── algorithm-1.json
│           ├── data_structure-1.json
│           ├── software_engineering-1.json
│           └── ...
└── README.md
```

## 🚀 빠른 시작

### 1. 새로운 토픽 추가

새로운 토픽(예: Software Engineering)의 문제를 추가하려면:

```bash
# 1단계: DB에 토픽 추가 (dry-run으로 먼저 검증)
npm run add-topic -- --id softwareEngineering --name-ko "소프트웨어 공학" --name-en "Software Engineering" --dry-run

# 2단계: 실제 추가
npm run add-topic -- --id softwareEngineering --name-ko "소프트웨어 공학" --name-en "Software Engineering"

# 3단계: validate.ts의 VALID_TOPIC_IDS에 추가 (스크립트가 자동으로 안내)
# 4단계: src/types/quizTypes.ts의 TopicId 타입에 추가
```

### 2. 문제 Import

```bash
# 검증만 (DB에 쓰지 않음)
npm run import-questions:dry

# 특정 파일만 검증
npm run import-questions:dry -- --file software_engineering-1.json

# 실제 import
npm run import-questions -- --file software_engineering-1.json

# 여러 파일 한번에
npm run import-questions -- --file file1.json --file file2.json

# 디렉토리 전체 import
npm run import-questions
```

## 🔧 스크립트 상세

### `add-topic.ts` - 토픽 추가

새로운 토픽을 DB에 추가합니다.

**사용법:**
```bash
npm run add-topic -- --id <id> --name-ko <name> --name-en <name> [--dry-run]
```

**예시:**
```bash
npm run add-topic -- \
  --id softwareEngineering \
  --name-ko "소프트웨어 공학" \
  --name-en "Software Engineering"
```

**옵션:**
- `--id`: 토픽 ID (camelCase 형식, 예: `softwareEngineering`)
- `--name-ko`: 한글 이름
- `--name-en`: 영문 이름
- `--dry-run`: 검증만 수행, DB에 쓰지 않음

**검증 규칙:**
- ID는 소문자로 시작하는 camelCase
- ID 길이는 3~50자
- 이미 존재하는 ID는 건너뜀

**실행 후 안내되는 다음 단계:**
1. `scripts/ai-regenerate/validate.ts`의 `VALID_TOPIC_IDS`에 추가
2. `src/types/quizTypes.ts`의 `TopicId` 타입에 추가
3. 번역 파일 확인 (필요시)

### `import.ts` - 문제 Import

JSON 파일에서 문제를 읽어 DB에 투입합니다.

**사용법:**
```bash
npm run import-questions [-- options]
```

**옵션:**
- `--dry-run`: 검증만 수행, DB에 쓰지 않음
- `--file <name>`: 특정 파일만 import (여러 번 사용 가능)
- `--dir <path>`: JSON 파일 디렉토리 지정 (기본: `generated/evaluated/pass`)
- `--clear`: ⚠️ 기존 문제 모두 삭제 후 import (주의!)

**검증 항목:**
- 필수 필드 존재 여부 (`question_ko`, `question_en`, `hint_ko`, `hint_en`, `topic`)
- 유효한 토픽 ID (`VALID_TOPIC_IDS`에 포함)
- 답안 옵션 최소 2개 이상
- 정답 1개만 존재 (`isCorrect: true`)
- 중복 문제 검사 (영문 질문 텍스트 기준)

**출력:**
- 각 문제별 검증 결과 (VALID, INVALID, DUPLICATE)
- 요약 통계 (처리/유효/import/중복/무효)
- 검증 오류 상세 목록

## 📝 JSON 파일 형식

문제 JSON 파일은 다음 형식을 따라야 합니다:

```json
[
  {
    "question_ko": "한글 질문",
    "question_en": "English question",
    "hint_ko": "한글 힌트",
    "hint_en": "English hint",
    "topic": "softwareEngineering",
    "difficulty": "medium",
    "concept": "Waterfall Model",
    "questionType": "single-choice",
    "answerOptions": [
      {
        "text_ko": "보기 1 한글",
        "text_en": "Option 1 English",
        "rationale_ko": "한글 설명",
        "rationale_en": "English rationale",
        "isCorrect": false
      },
      {
        "text_ko": "보기 2 한글",
        "text_en": "Option 2 English",
        "rationale_ko": "한글 설명",
        "rationale_en": "English rationale",
        "isCorrect": true
      }
    ]
  }
]
```

## 🎯 완전한 워크플로우 예시

새로운 토픽의 문제를 처음부터 끝까지 추가하는 전체 과정:

```bash
# 1. 토픽 추가 (검증)
npm run add-topic -- \
  --id softwareEngineering \
  --name-ko "소프트웨어 공학" \
  --name-en "Software Engineering" \
  --dry-run

# 2. 토픽 추가 (실제)
npm run add-topic -- \
  --id softwareEngineering \
  --name-ko "소프트웨어 공학" \
  --name-en "Software Engineering"

# 3. validate.ts 수정
# VALID_TOPIC_IDS 배열에 "softwareEngineering" 추가

# 4. 타입 정의 수정
# src/types/quizTypes.ts의 TopicId에 "softwareEngineering" 추가

# 5. 문제 JSON 파일 준비
# generated/evaluated/pass/software_engineering-1.json

# 6. 문제 검증
npm run import-questions:dry -- --file software_engineering-1.json

# 7. 문제 import
npm run import-questions -- --file software_engineering-1.json

# 완료! 🎉
```

## ⚠️ 주의사항

1. **토픽 추가 순서 중요**: `add-topic.ts`로 DB에 토픽을 먼저 추가한 후, `validate.ts`의 `VALID_TOPIC_IDS`에도 추가해야 합니다.

2. **중복 검사**: 영문 질문 텍스트를 기준으로 중복을 검사합니다. 같은 문제를 여러 번 import하면 자동으로 건너뜁니다.

3. **Dry-run 활용**: 항상 `--dry-run`으로 먼저 검증한 후 실제 import하는 것을 권장합니다.

4. **Clear 옵션**: `--clear` 옵션은 모든 문제를 삭제합니다. 매우 주의해서 사용하세요!

5. **Foreign Key**: `validate.ts`의 `VALID_TOPIC_IDS`에만 추가하고 DB에 토픽을 추가하지 않으면, import 시 foreign key 에러가 발생합니다.

## 🐛 트러블슈팅

### "Invalid topic" 에러

**원인**: 토픽이 `VALID_TOPIC_IDS`에 없거나 DB에 없음

**해결**:
1. `add-topic.ts`로 DB에 토픽 추가
2. `validate.ts`의 `VALID_TOPIC_IDS`에 토픽 추가

### Foreign key constraint 에러

**원인**: DB에 토픽이 없음

**해결**: `npm run add-topic`으로 토픽 먼저 추가

### "No JSON files found" 메시지

**원인**: 지정한 디렉토리나 파일이 없음

**해결**:
- `--dir` 옵션으로 올바른 디렉토리 지정
- `--file` 옵션에 `.json` 확장자 포함 여부 확인

## 📊 현재 지원 토픽

DB에 있는 토픽 목록을 확인하려면:

```bash
# import 스크립트 실행 시 자동으로 표시됨
npm run import-questions:dry
```

또는 Prisma Studio에서 확인:

```bash
npx prisma studio
```
