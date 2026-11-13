// Fixed by Horizon: don't change this file.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/*
 * The app's own code may only use Horizon's email updates through
 * `import { notify } from "@/lib/updates"`, and may not reach Horizon's
 * other files or the tables behind them at all. This checks every import as
 * TypeScript resolves it, so no way of writing a path gets round it.
 */

const root = process.cwd();

/** Horizon's files, which do what app code mustn't. Kept as Horizon made them, so not checked here. */
const fixed = [
  "src/db/index.ts",
  "src/db/auth-schema.ts",
  "src/db/updates-schema.ts",
  "src/lib/auth.ts",
  "src/lib/email.ts",
  "src/lib/access.ts",
  "src/lib/session.ts",
  "src/lib/updates.ts",
  "src/app/api/auth/",
  "src/app/api/updates/",
  "src/app/sign-in/",
  "src/app/updates/",
  "src/app/layout.tsx",
  "src/components/Banner.tsx",
  "src/proxy.ts",
  "src/kit/",
  "tests/",
];

/** What app code may never import, however the path is written. */
const privateFiles = [
  "src/lib/auth.ts",
  "src/lib/email.ts",
  "src/lib/access.ts",
  "src/db/auth-schema.ts",
  "src/db/updates-schema.ts",
  "src/app/api/auth/",
  "src/app/api/updates/",
  "src/app/sign-in/",
  "src/app/updates/",
];

const updatesModule = "src/lib/updates.ts";

/** Email updates' tables and the secret sign-in ones, by name: raw SQL or a table defined again. */
const privateTables = /\bupdate_(recipient|manager|delivery|event)\b|\b(from|into|update|join|table)\s+"?(session|verification|account)\b|pgTable\(\s*["\'`](session|verification|account|user)["\'`]/i;

const options: ts.CompilerOptions = {
  baseUrl: root,
  paths: { "@/*": ["./src/*"] },
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  allowJs: true,
  jsx: ts.JsxEmit.ReactJSX,
};

function filesIn(directory: string): string[] {
  return readdirSync(join(root, directory)).flatMap((name) => {
    const path = `${directory}/${name}`;

    return statSync(join(root, path)).isDirectory() ? filesIn(path) : /\.(m|c)?[jt]sx?$/.test(name) ? [path] : [];
  });
}

const appFiles = filesIn("src").filter((path) => !fixed.some((prefix) => path === prefix || path.startsWith(prefix)));

/** Every module a file imports or re-exports, with the statement it's in. */
function importsOf(path: string): { specifier: string; node: ts.Node }[] {
  const source = ts.createSourceFile(path, readFileSync(join(root, path), "utf8"), ts.ScriptTarget.Latest, true);
  const found: { specifier: string; node: ts.Node }[] = [];

  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push({ specifier: node.moduleSpecifier.text, node });
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && ts.isStringLiteral(node.moduleReference.expression)) {
      found.push({ specifier: node.moduleReference.expression.text, node });
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      found.push({ specifier: node.arguments[0].text, node });
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      found.push({ specifier: node.argument.literal.text, node });
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  return found;
}

/** Where a specifier resolves, relative to the app, or null for a package. */
function resolve(specifier: string, from: string): string | null {
  const resolved = ts.resolveModuleName(specifier, join(root, from), options, ts.sys).resolvedModule;

  if (!resolved || resolved.isExternalLibraryImport) {
    return null;
  }

  return relative(root, resolved.resolvedFileName).split("\\").join("/");
}

/** Exactly `import { name } from ...`: that one thing, not renamed, and nothing else with it. */
function onlyImports(node: ts.Node, name: string): boolean {
  if (!ts.isImportDeclaration(node) || !node.importClause || node.importClause.name) {
    return false;
  }

  const bindings = node.importClause.namedBindings;

  return (
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length === 1 &&
    bindings.elements[0].name.text === name &&
    (bindings.elements[0].propertyName === undefined || bindings.elements[0].propertyName.text === name)
  );
}

/** The only things app code takes from Horizon's own files: signing out, and sharing `user` in its tables. */
function isAllowedUse(path: string, target: string, node: ts.Node): boolean {
  return (
    (target === "src/app/sign-in/actions.ts" && onlyImports(node, "signOut")) ||
    (path === "src/db/schema.ts" && target === "src/db/auth-schema.ts" && (onlyImports(node, "user") || isExportOf(node, "user")))
  );
}

function isExportOf(node: ts.Node, name: string): boolean {
  return (
    ts.isExportDeclaration(node) &&
    node.exportClause !== undefined &&
    ts.isNamedExports(node.exportClause) &&
    node.exportClause.elements.length === 1 &&
    node.exportClause.elements[0].name.text === name
  );
}

describe("the app's own code and Horizon's files", () => {
  it("never imports Horizon's own files, and uses email updates only through notify()", () => {
    const problems = appFiles.flatMap((path) =>
      importsOf(path).flatMap(({ specifier, node }) => {
        const target = resolve(specifier, path);

        if (target === null) {
          return [];
        }

        if (privateFiles.some((file) => target === file || target.startsWith(file)) && !isAllowedUse(path, target, node)) {
          return [`${path} imports ${specifier}, which is one of Horizon's own files.`];
        }

        if (target === updatesModule && !onlyImports(node, "notify")) {
          return [`${path} uses more of email updates than notify(): write import { notify } from "@/lib/updates".`];
        }

        return [];
      }),
    );

    expect(problems).toEqual([]);
  });

  it("never reaches email updates' tables or the sign-in tables by name", () => {
    const problems = appFiles.filter((path) => privateTables.test(readFileSync(join(root, path), "utf8")));

    expect(problems).toEqual([]);
  });
});
