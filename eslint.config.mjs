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
  "src/lib/session.ts",
  "src/app/api/auth/**",
  "src/app/sign-in/**",
  "tests/db.ts",
  "tests/sign-in.test.ts",
];

const outside = "Horizon apps can't reach other websites; only src/lib/email.ts sends email.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*", "child_process", "fs", "fs/*", "net", "http", "https", "http2", "dgram", "dns", "tls", "vm", "worker_threads", "cluster", "os", "process"], message: "Horizon apps don't use Node's system modules." },
            { group: ["**/auth-schema", "@/db/auth-schema"], message: "Sessions, sign-in links and accounts are secret: use requireUser() from @/lib/session." },
            { group: ["**/prototype/**", "**/prototype"], message: "prototype/ is for reference only: copy what you need into src/." },
            { group: ["@/lib/email"], message: "Only sign-in sends email." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "ImportExpression", message: "Use a normal import at the top of the file." },
        { selector: "NewExpression[callee.name='Function']", message: "Don't run code from text." },
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: "Don't put unchecked HTML on the page." },
        { selector: "Literal[value=/^(https?:)?\\/\\/(?!www\\.w3\\.org\\/)/i]", message: outside },
        { selector: "TemplateElement[value.raw=/(https?:)?\\/\\/(?!www\\.w3\\.org\\/)/i]", message: outside },
      ],
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
