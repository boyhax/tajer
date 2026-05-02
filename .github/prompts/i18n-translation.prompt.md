---
description: "Apply the correct bilingual (Arabic/English) translation pattern used throughout this app. Use when adding new text, fixing untranslated strings, creating new components/pages, or when lang conditionals like `lang === 'ar' ? x : y` are used for text instead of t()."
name: "i18n Translation Pattern"
argument-hint: "Describe what to translate or fix (e.g. 'FeaturesPage data arrays', 'new component', 'fix all manual lang checks')"
agent: "agent"
---

## App Translation Rules

This app uses a bilingual (Arabic + English) system via `LanguageContext`. Follow these rules exactly — they match the patterns used throughout `src/App.tsx`, `src/pages/`, and `src/components/`.

### 1. Hook to use

In components inside `src/contexts` providers, use the hook:

```tsx
const { t, lang } = useLanguage();
// or inside App.tsx where useLanguage() is not available:
const { t, lang } = useContext(LanguageContext);
```

The `t()` function signature:
```ts
t(ls: LocalizedString | string | any): string
// Returns ls[lang] ?? ls['en'] ?? ''
```

### 2. Inline text — always use `t({ en, ar })`

```tsx
// ✅ CORRECT
<h1>{t({ en: 'Welcome', ar: 'مرحباً' })}</h1>
<button>{t({ en: 'Save', ar: 'حفظ' })}</button>

// ❌ WRONG — never do this for text
<h1>{lang === 'ar' ? 'مرحباً' : 'Welcome'}</h1>
```

### 3. Data arrays — use `LocalizedString` shape

```tsx
import { LocalizedString } from '../types';

// ✅ CORRECT
const items: { title: LocalizedString; desc: LocalizedString }[] = [
  { title: { en: 'Orders', ar: 'الطلبات' }, desc: { en: '...', ar: '...' } },
];
// Render:
{items.map(item => <p>{t(item.title)}</p>)}

// ❌ WRONG
const items = [{ titleEn: 'Orders', titleAr: 'الطلبات' }];
{items.map(item => <p>{lang === 'ar' ? item.titleAr : item.titleEn}</p>)}
```

### 4. Direction (`dir`) — component level only

```tsx
// ✅ Only set dir on the root element of a page/section:
<div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
```

Do NOT use `lang === 'ar'` for text content — only for structural/CSS concerns like `dir`, `text-right`, or `flex-row-reverse`.

### 5. `LocalizedString` type (from `src/types.ts`)

```ts
export interface LocalizedString {
  en: string;
  ar: string;
}
```

Always import it from `../types` (adjust relative path as needed).

### 6. `appSettings.appName` / `appSettings.appDescription`

These are `LocalizedString | undefined`. Access via:
```tsx
t(appSettings.appName || config.name)  // safe fallback
```

---

## Task

Apply the rules above to: **$ARGUMENTS**

Steps:
1. Identify all strings rendered with `lang === 'ar' ? arabicText : englishText` patterns.
2. Identify all data arrays with split `titleEn`/`titleAr` or `descEn`/`descAr` fields.
3. Refactor arrays to use `{ title: LocalizedString; desc: LocalizedString }` shape.
4. Replace all manual lang conditionals for text with `t({ en: '...', ar: '...' })`.
5. Import `LocalizedString` from `../types` if data arrays are typed.
6. Check for missing `useLanguage()` / `useContext(LanguageContext)` imports and add them.
7. Verify no TypeScript errors remain after changes.

Reference the existing correct pattern in [src/App.tsx](../../src/App.tsx) and [src/pages/FeaturesPage.tsx](../../src/pages/FeaturesPage.tsx).
