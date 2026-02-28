// scripts/ai-regenerate/prompts.ts
/**
 * AI 문제 재가공을 위한 프롬프트 템플릿 라이브러리
 */

export const PromptTemplates = {
  /**
   * 알고리즘 문제 재생성
   */
  algorithmProblem: (concept: string, difficulty: string) => `
You are an expert computer science educator creating original algorithm problems.

Task: Create a completely new algorithm problem that teaches the same concept, but with an entirely different scenario and context.

Concept to teach: ${concept}
Target difficulty: ${difficulty}

Requirements:
1. Create a unique, real-world scenario
2. Define new input/output specifications
3. Include different constraints and edge cases
4. Provide 2-3 example test cases
5. DO NOT copy any existing problem text

Output in JSON format:
{
  "title_ko": "문제 제목",
  "title_en": "Problem Title",
  "description_ko": "문제 설명 (300-500자)",
  "description_en": "Problem description (300-500 words)",
  "hint_ko": "힌트",
  "hint_en": "Hint",
  "difficulty": "Easy|Medium|Hard",
  "topic": "algorithm",
  "answerOptions": [
    {
      "text_ko": "선택지 1",
      "text_en": "Option 1",
      "rationale_ko": "해설",
      "rationale_en": "Rationale",
      "isCorrect": false
    }
  ]
}
`,

  /**
   * 이론 문제 변형
   */
  theoryQuestion: (topic: string, concept: string) => `
You are a computer science educator creating assessment questions.

Task: Create an original multiple-choice question about the following concept.

Topic: ${topic}
Concept: ${concept}

Requirements:
1. Test the same underlying knowledge
2. Use a different scenario or context
3. Include 4 answer options (1 correct, 3 plausible distractors)
4. Provide detailed rationale for each option
5. Make it engaging and practical

Output in JSON format:
{
  "question_ko": "질문 내용",
  "question_en": "Question content",
  "hint_ko": "힌트",
  "hint_en": "Hint",
  "topic": "${topic}",
  "answerOptions": [
    {
      "text_ko": "선택지",
      "text_en": "Option",
      "rationale_ko": "왜 맞는지/틀린지 설명",
      "rationale_en": "Why correct/incorrect",
      "isCorrect": true
    }
  ]
}
`,

  /**
   * 코드 분석 문제
   */
  codeAnalysis: (topic: string, concept: string) => `
You are creating a code analysis question for computer science students.

Topic: ${topic}
Concept to test: ${concept}

Task: Create an original code snippet and ask a question about it.

Requirements:
1. Write a SHORT code snippet (5-15 lines)
2. Ask what the code does, what the output is, or identify the bug
3. Create 4 answer options
4. Provide detailed explanation

Output in JSON format:
{
  "question_ko": "다음 코드의 출력은? (코드 포함)",
  "question_en": "What is the output? (include code)",
  "hint_ko": "힌트",
  "hint_en": "Hint",
  "topic": "${topic}",
  "answerOptions": [...]
}
`,

  /**
   * 품질 검증 프롬프트
   */
  qualityCheck: (generatedProblem: string) => `
You are a content quality reviewer.

Task: Check if this generated problem is high quality and original.

Generated Problem:
${generatedProblem}

Evaluate:
1. Originality (1-10): Is it sufficiently different from common problems?
2. Clarity (1-10): Is the question clear and unambiguous?
3. Educational value (1-10): Does it effectively test the concept?
4. Answer quality (1-10): Are the options plausible and well-explained?

Output in JSON:
{
  "originality_score": 8,
  "clarity_score": 9,
  "educational_value": 8,
  "answer_quality": 7,
  "overall_score": 8,
  "recommendation": "ACCEPT|REVISE|REJECT",
  "feedback": "Specific feedback and improvement suggestions"
}
`
};
