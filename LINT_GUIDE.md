# 린트 설정 가이드

로컬에서 ESLint를 사용하여 코드 품질을 관리할 수 있습니다.

## 📦 설치된 도구

### ESLint
- **설정 파일**: `.eslintrc.json`
- **무시 파일**: `.eslintignore`
- **규칙**: Next.js 기본 규칙 + 커스텀 규칙

### VS Code/Cursor 설정
- **설정 파일**: `.vscode/settings.json`
- **권장 확장**: `.vscode/extensions.json`

## 🚀 사용 가능한 명령어

### 1. 기본 린트 실행
```bash
npm run lint
```
- 모든 파일에서 ESLint 경고와 에러를 확인합니다
- 문제가 없으면 `✔ No ESLint warnings or errors` 출력

### 2. 자동 수정
```bash
npm run lint:fix
```
- 자동으로 수정 가능한 린트 에러를 모두 수정합니다
- `let` → `const`, 불필요한 세미콜론 제거 등

### 3. 엄격한 린트 (CI용)
```bash
npm run lint:strict
```
- 경고를 에러로 취급 (경고가 하나라도 있으면 실패)
- CI/CD 파이프라인에서 사용하기 좋습니다

### 4. TypeScript 타입 체크
```bash
npm run type-check
```
- 빌드 없이 TypeScript 타입 에러만 확인
- 빠르게 타입 문제를 발견할 수 있습니다

### 5. 통합 체크
```bash
npm run check
```
- `lint` + `type-check`를 한 번에 실행
- 커밋 전에 실행하면 좋습니다

## ⚙️ 설정된 린트 규칙

### 기본 규칙 (Next.js)
- `next/core-web-vitals`: Next.js 성능과 접근성 규칙
- React Hooks 규칙
- React 규칙

### 커스텀 규칙

#### 1. `no-console` (warn)
```javascript
// ❌ 경고
console.log('debug');

// ✅ 허용
console.error('error message');
console.warn('warning message');
console.info('info message');
```

#### 2. `prefer-const` (warn)
```javascript
// ❌ 경고
let name = 'John';
name; // 재할당하지 않음

// ✅ 권장
const name = 'John';
```

#### 3. `no-var` (error)
```javascript
// ❌ 에러
var count = 0;

// ✅ 권장
const count = 0;
let mutableCount = 0;
```

#### 4. `react-hooks/exhaustive-deps` (warn)
```javascript
// ❌ 경고
useEffect(() => {
  fetchData(userId);
}, []); // userId가 dependency에 없음

// ✅ 권장
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

## 🔧 VS Code/Cursor 자동 수정

`.vscode/settings.json`에 다음이 설정되어 있습니다:

- **저장 시 자동 포맷팅**: `editor.formatOnSave: true`
- **저장 시 ESLint 자동 수정**: `source.fixAll.eslint: explicit`

파일을 저장하면 자동으로 린트 에러를 수정합니다!

## 📌 특정 규칙 비활성화

### 한 줄만 비활성화
```javascript
// eslint-disable-next-line no-console
console.log('this is okay');
```

### 여러 규칙 비활성화
```javascript
// eslint-disable-next-line no-console, prefer-const
let message = 'test';
console.log(message);
```

### 파일 전체 비활성화
```javascript
/* eslint-disable no-console */
console.log('line 1');
console.log('line 2');
/* eslint-enable no-console */
```

## 🎯 실전 활용

### 1. 커밋 전 체크
```bash
npm run check
```

### 2. PR 전 엄격한 체크
```bash
npm run lint:strict && npm run type-check
```

### 3. 코드 정리
```bash
npm run lint:fix
```

### 4. 특정 파일만 체크
```bash
npx eslint src/app/page.tsx
```

### 5. 특정 디렉토리만 체크
```bash
npx eslint src/components/
```

## 🔍 린트 무시 파일

`.eslintignore`에 다음 파일들이 제외되어 있습니다:

- `node_modules/`
- `.next/`
- `out/`, `build/`, `dist/`
- `prisma/migrations/`
- `scripts/ai-regenerate/generated/`
- 환경 변수 파일들

## 📚 권장 VS Code 확장

`.vscode/extensions.json`에서 다음을 권장합니다:

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - 실시간 린트 에러 표시
   
2. **Prettier** (`esbenp.prettier-vscode`)
   - 코드 포맷팅
   
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Tailwind 클래스 자동완성
   
4. **Prisma** (`prisma.prisma`)
   - Prisma 스키마 하이라이팅
   
5. **TypeScript Nightly** (`ms-vscode.vscode-typescript-next`)
   - 최신 TypeScript 기능

## 🐛 문제 해결

### 린트가 실행되지 않는 경우
```bash
# ESLint 캐시 삭제
rm -rf .eslintcache
rm -rf .next

# 다시 실행
npm run lint
```

### VS Code에서 자동 수정이 안 되는 경우
1. ESLint 확장 프로그램 설치 확인
2. VS Code 재시작
3. 명령 팔레트 (Cmd/Ctrl + Shift + P) → "ESLint: Restart ESLint Server"

### 특정 규칙이 너무 엄격한 경우
`.eslintrc.json`에서 규칙을 수정하세요:

```json
{
  "rules": {
    "no-console": "off",  // 완전히 비활성화
    "prefer-const": "warn"  // error → warn으로 완화
  }
}
```

## 📖 추가 자료

- [ESLint 공식 문서](https://eslint.org/docs/latest/)
- [Next.js ESLint 가이드](https://nextjs.org/docs/basic-features/eslint)
- [React Hooks 규칙](https://react.dev/warnings/invalid-hook-call-warning)
