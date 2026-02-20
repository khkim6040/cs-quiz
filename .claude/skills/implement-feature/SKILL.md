---
name: implement-feature
description: 이슈 생성 → 브랜치 → 구현 → 단위 커밋 → PR 올리기까지 전체 기능 구현 워크플로우
disable-model-invocation: true
user-invocable: true
argument-hint: [기능 설명]
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Task
---

# 기능 구현 워크플로우

$ARGUMENTS 를 기반으로 아래 워크플로우를 순서대로 수행한다.

## 1단계: 이슈 생성

- `gh issue create`로 GitHub 이슈를 생성한다.
- 이슈 제목: `feat: {기능 요약}` 형식
- 이슈 본문에 배경, 목표, 구현 계획, 수정 대상 파일을 포함한다.

## 2단계: 브랜치 생성

- `feat/{기능-키워드}` 형태의 브랜치를 main에서 생성한다.
- 브랜치 이름은 영문 소문자 + 하이픈, 간결하게 짓는다.

## 3단계: 구현 및 단위 커밋

- 기능을 구현하면서 **작은 작업 단위로 커밋**을 쌓는다.
- 커밋 메시지 컨벤션:
  - 접두사: `feat:`, `fix:`, `chore:`, `refactor:` 등
  - 한글 메시지 사용
  - 본문은 **최대 2줄**까지만 작성
  - Co-Authored-By 라인 **포함하지 않음**
  - 예시: `feat: Feedback 모델에 questionId 필드 추가`
- 각 커밋 전 `npm run build`로 빌드가 깨지지 않는지 확인한다.

## 4단계: PR 생성

- 브랜치를 push하고 `gh pr create`로 PR을 생성한다.
- PR 제목: 이슈 제목과 동일하게
- PR 본문 형식:
  ```
  ## Summary
  - 변경 사항 요약 (bullet points)

  ## Test plan
  - [ ] 테스트 항목들

  Closes #이슈번호
  ```
- 완료 후 PR URL을 사용자에게 알려준다.
