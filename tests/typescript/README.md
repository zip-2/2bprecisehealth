# PharmGKB API Tests (TypeScript)

This folder contains API tests for the `clinicalAnnotation` endpoint of the PharmGKB API, implemented using **Playwright** with **TypeScript**.

## ✅ Technologies

- TypeScript
- Playwright Test Runner
- APIRequestContext

## 📁 Structure

```
/typescript
  ├── pharmgkb-api.spec.ts        # Main test file
  └── playwright.config.ts        # Playwright configuration with base URL
```

## ▶️ How to Run

1. **Install dependencies** (if not already):

```bash
npm install -D @playwright/test
npx playwright install
```

2. **Run the tests**:

```bash
npx playwright test typescript/pharmgkb-api.spec.ts
```

## 🔬 What It Tests

- Gene has drug **Clopidogrel** with evidence level
- Gene has at least **5 pediatric drugs**
- All evidence levels are valid according to enum
- Invalid gene returns proper error response

## 💡 Notes

This test suite is also available in Python under `/tests/python` for comparison purposes.
