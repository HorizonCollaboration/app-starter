// Fixed by Horizon: don't change this file. Its rules keep every Horizon app
// from reaching other websites, reading settings or secrets, or running other
// programs; GitHub checks them on every change.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const appCode = ["src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}", "tests/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"];

// The files Horizon wrote and keeps fixed, which do the few things app code mustn't.
const fixedFiles = [
  "src/db/index.ts",
  "src/db/auth-schema.ts",
  "src/lib/auth.ts",
  "src/lib/email.ts",
  "src/lib/access.ts",
  "src/lib/session.ts",
  "src/lib/updates.ts",
  "src/db/updates-schema.ts",
  "src/app/updates/**",
  "src/app/api/updates/**",
  "src/app/api/auth/**",
  "src/app/sign-in/**",
  "src/proxy.ts",
  "tests/db.ts",
  "tests/sign-in.test.ts",
  "tests/access.test.ts",
  "tests/updates.test.ts",
  "tests/boundaries.test.ts",
];

const outside = "Horizon apps can't reach other websites; only src/lib/email.ts sends email.";

// App code tells people something happened with notify(), and uses nothing else of email updates.
const importPaths = [{ name: "@/lib/updates", allowImportNames: ["notify"], message: "Use notify() from @/lib/updates; the rest of email updates is Horizon's." }];

const importRules = [
  { group: ["node:*", "child_process", "fs", "fs/*", "net", "http", "https", "http2", "dgram", "dns", "tls", "vm", "worker_threads", "cluster", "os", "process"], message: "Horizon apps don't use Node's system modules." },
  { group: ["**/auth-schema", "@/db/auth-schema"], message: "Sessions, sign-in links and accounts are secret: use requireUser() from @/lib/session." },
  { group: ["**/prototype/**", "**/prototype"], message: "prototype/ is for reference only: copy what you need into src/." },
  { group: ["@/lib/email"], message: "Only sign-in and email updates send email: use notify() from @/lib/updates." },
  { regex: "^\\.{1,2}/(.*/)?(email|updates|updates-schema|access)$", message: "Import from @/lib/... so Horizon's rules apply: use notify() from @/lib/updates." },
  { regex: "^@/(.*/)?\\.{1,2}/|^@/.*//|^@//", message: "Write the path plainly, such as @/lib/updates." },
  { group: ["@/lib/access"], message: "Only Horizon's own files ask Horizon about people." },
  { group: ["**/updates-schema", "@/db/updates-schema"], message: "Use notify() from @/lib/updates; its tables are Horizon's." },
  { group: ["@/lib/auth", "**/lib/auth"], message: "Use currentUser() or requireUser() from @/lib/session, which check the person may still use the app." },
];

const tables = "Horizon's own tables (email updates, sign-in) are only for its fixed files: use notify() from @/lib/updates.";
const tablePattern = "(update_(recipient|manager|delivery|event)\\b|\\b(from|into|update|join|table)\\s+\\\"?(session|verification|account)\\b)";

const syntaxRules = [
  { selector: `Literal[value=/${tablePattern}/i]`, message: tables },
  { selector: `TemplateElement[value.raw=/${tablePattern}/i]`, message: tables },
  { selector: "ImportExpression", message: "Use a normal import at the top of the file." },
  { selector: "NewExpression[callee.name='Function']", message: "Don't run code from text." },
  { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: "Don't put unchecked HTML on the page." },
  { selector: "Literal[value=/^(https?:)?\\/\\/(?!www\\.w3\\.org\\/)/i]", message: outside },
  { selector: "TemplateElement[value.raw=/(https?:)?\\/\\/(?!www\\.w3\\.org\\/)/i]", message: outside },
];

// Every screen is built from Horizon's kit (KIT.md), which owns the colours, so the look can change without rewriting the app.
const kit = "Build screens from Horizon's kit (import from @/kit, see KIT.md): it sets the colours.";
const colour =
  "(?:^|[\\s:'\"`])-?(?:bg|text|border|ring|outline|fill|stroke|divide|decoration|accent|caret|placeholder|shadow|inset-shadow|drop-shadow|from|via|to)-(?:(?:slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d|white\\b|black\\b|\\[(?:#|rgb|hsl|oklch|oklab|lab|lch|color|var\\(|[a-z]+\\]))";
const kitImportRules = [
  { group: ["@/kit/*", "**/kit/ui", "**/kit/ui/*", "radix-ui", "@radix-ui/*", "class-variance-authority", "cn"], message: kit },
];
const kitSyntaxRules = [
  { selector: "JSXAttribute[name.name='style']", message: kit },
  { selector: `Literal[value=/${colour}/]`, message: kit },
  { selector: `TemplateElement[value.raw=/${colour}/]`, message: kit },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The rules can't be switched off from inside a file.
    linterOptions: { noInlineConfig: true },
  },
  {
    files: appCode,
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: outside },
        { name: "XMLHttpRequest", message: outside },
        { name: "WebSocket", message: outside },
        { name: "EventSource", message: outside },
        { name: "eval", message: "Don't run code from text." },
        { name: "Function", message: "Don't run code from text." },
        { name: "globalThis", message: "Don't reach for globals." },
        { name: "global", message: "Don't reach for globals." },
        { name: "process", message: "Settings and secrets are read only by Horizon's fixed files." },
        { name: "require", message: "Use import." },
      ],
      "no-restricted-imports": ["error", { paths: importPaths, patterns: importRules }],
      "no-restricted-syntax": ["error", ...syntaxRules],
    },
  },
  {
    // The app's own screens, outside the kit: built from the kit, never from the library under it or by hand.
    files: appCode,
    ignores: ["src/kit/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: importPaths, patterns: [...importRules, ...kitImportRules] }],
      "no-restricted-syntax": ["error", ...syntaxRules, ...kitSyntaxRules],
    },
  },
  {
    // The app's tables share `user` from the sign-in tables, and nothing else (Horizon checks that line stays as it is).
    files: ["src/db/schema.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["node:*", "**/prototype/**", "@/lib/email"], message: "Only tables belong here." }] },
      ],
    },
  },
  {
    files: fixedFiles,
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The community's prototype, kept for reference while it's turned into the app.
    "prototype/**",
  ]),
]);

export default eslintConfig;
