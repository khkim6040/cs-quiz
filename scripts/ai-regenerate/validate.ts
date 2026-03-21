// scripts/ai-regenerate/validate.ts

export const VALID_TOPIC_IDS = [
  "computerSecurity",
  "database",
  "algorithm",
  "dataStructure",
  "computerNetworking",
  "operatingSystem",
  "computerArchitecture",
  "softwareEngineering",
  "springBoot",
];

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const MIN_RATIONALE_LENGTH = 30;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateQuestion(q: any): ValidationResult {
  const errors: ValidationError[] = [];

  // ── Structural validation ──

  // Required string fields
  const requiredFields = [
    "question_ko",
    "question_en",
    "hint_ko",
    "hint_en",
    "topic",
  ];
  for (const field of requiredFields) {
    if (!q[field] || typeof q[field] !== "string" || q[field].trim() === "") {
      errors.push({ field, message: `Missing or empty field: ${field}` });
    }
  }

  // Topic ID validation
  if (q.topic && !VALID_TOPIC_IDS.includes(q.topic)) {
    errors.push({
      field: "topic",
      message: `Invalid topic "${q.topic}". Must be one of: ${VALID_TOPIC_IDS.join(", ")}`,
    });
  }

  // Difficulty validation
  if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty)) {
    errors.push({
      field: "difficulty",
      message: `Invalid difficulty "${q.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
    });
  }

  // Answer options: must be array
  if (!Array.isArray(q.answerOptions)) {
    errors.push({
      field: "answerOptions",
      message: "answerOptions must be an array",
    });
    return { valid: false, errors };
  }

  // Answer options: minimum count
  if (q.answerOptions.length < 2) {
    errors.push({
      field: "answerOptions",
      message: `Need at least 2 answer options, got ${q.answerOptions.length}`,
    });
  }

  // Answer options: exactly 1 correct
  const correctCount = q.answerOptions.filter(
    (o: any) => o && o.isCorrect === true
  ).length;
  if (correctCount === 0) {
    errors.push({
      field: "answerOptions",
      message: "No correct answer marked (isCorrect: true)",
    });
  }
  if (correctCount > 1) {
    errors.push({
      field: "answerOptions",
      message: `Multiple correct answers marked (${correctCount})`,
    });
  }

  // Validate each answer option
  const optFields = ["text_ko", "text_en", "rationale_ko", "rationale_en"];
  for (let i = 0; i < q.answerOptions.length; i++) {
    const opt = q.answerOptions[i];
    if (!opt || typeof opt !== "object") {
      errors.push({
        field: `answerOptions[${i}]`,
        message: "Answer option must be a non-null object",
      });
      continue;
    }
    for (const field of optFields) {
      if (
        !opt[field] ||
        typeof opt[field] !== "string" ||
        opt[field].trim() === ""
      ) {
        errors.push({
          field: `answerOptions[${i}].${field}`,
          message: `${field} is missing or empty`,
        });
      }
    }
    if (typeof opt.isCorrect !== "boolean") {
      errors.push({
        field: `answerOptions[${i}].isCorrect`,
        message: "isCorrect must be a boolean",
      });
    }
  }

  // ── Semantic validation ──

  // Rationale minimum length
  for (let i = 0; i < q.answerOptions.length; i++) {
    const opt = q.answerOptions[i];
    if (!opt || typeof opt !== "object") continue;
    if (
      opt.rationale_ko &&
      typeof opt.rationale_ko === "string" &&
      opt.rationale_ko.trim().length < MIN_RATIONALE_LENGTH
    ) {
      errors.push({
        field: `answerOptions[${i}].rationale_ko`,
        message: `Rationale too short (${opt.rationale_ko.trim().length} chars, min ${MIN_RATIONALE_LENGTH})`,
      });
    }
    if (
      opt.rationale_en &&
      typeof opt.rationale_en === "string" &&
      opt.rationale_en.trim().length < MIN_RATIONALE_LENGTH
    ) {
      errors.push({
        field: `answerOptions[${i}].rationale_en`,
        message: `Rationale too short (${opt.rationale_en.trim().length} chars, min ${MIN_RATIONALE_LENGTH})`,
      });
    }
  }

  // Hint must not contain correct answer text (both languages)
  if (Array.isArray(q.answerOptions)) {
    const correctOption = q.answerOptions.find((o: any) => o && o.isCorrect);
    if (correctOption) {
      // Check hint_en vs text_en
      if (q.hint_en && correctOption.text_en) {
        const hintLower = q.hint_en.toLowerCase();
        const answerLower = correctOption.text_en.toLowerCase();
        if (answerLower.length > 5 && hintLower.includes(answerLower)) {
          errors.push({
            field: "hint_en",
            message: "Hint contains the correct answer text",
          });
        }
      }
      // Check hint_ko vs text_ko
      if (q.hint_ko && correctOption.text_ko) {
        const answerKo = correctOption.text_ko.trim();
        if (answerKo.length > 1 && q.hint_ko.includes(answerKo)) {
          errors.push({
            field: "hint_ko",
            message: "힌트에 정답 텍스트가 포함되어 있습니다",
          });
        }
      }
    }
  }

  // Concept keyword must appear in question_en
  if (
    q.concept &&
    typeof q.concept === "string" &&
    q.question_en &&
    typeof q.question_en === "string"
  ) {
    const conceptLower = q.concept.toLowerCase();
    const questionLower = q.question_en.toLowerCase();
    // Split multi-word concepts and check if any significant word appears
    const conceptWords = conceptLower
      .split(/[\s/,\-()]+/)
      .filter((w: string) => w.length > 7);
    // For short single-word concepts (e.g., "Heap", "SQL", "BFS"),
    // use word boundary matching to avoid false positives from substrings
    const allWords = conceptLower.split(/[\s/,\-()]+/).filter((w: string) => w.length > 0);
    const isSingleShortConcept = conceptWords.length === 0 && allWords.length <= 2;
    let hasConceptKeyword: boolean;
    if (isSingleShortConcept && allWords.length > 0) {
      // Match any word from the concept as a whole word in the question
      hasConceptKeyword = allWords.some((w: string) => {
        const wordBoundary = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return wordBoundary.test(q.question_en);
      });
    } else {
      hasConceptKeyword =
        conceptWords.length === 0 ||
        conceptWords.some((w: string) => questionLower.includes(w));
    }
    if (!hasConceptKeyword) {
      errors.push({
        field: "question_en",
        message: `Concept keyword "${q.concept}" not found in question text`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
