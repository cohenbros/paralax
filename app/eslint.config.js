// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

// שכבות (ראו CLAUDE.md, "ארכיטקטורת האפליקציה"):
//   app (נתיבים) → ui → state → data → domain
// כל שכבה מייבאת רק משכבות שמתחתיה. config.ts מותר לכולם.
const layer = (files, forbidden, message) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      { patterns: forbidden.map((group) => ({ group: [`@/${group}/*`, `**/${group}/*`], message })) },
    ],
  },
});

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*", "node_modules/*"] },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["react", "react-native"].map((name) => ({ name, message: "domain הוא TypeScript טהור" })),
          patterns: [
            { group: ["expo*", "@react-native*", "@/data/*", "@/state/*", "@/ui/*", "@/app/*"], message: "domain לא תלוי בשכבות אחרות" },
          ],
        },
      ],
    },
  },
  layer(["src/data/**"], ["state", "ui", "app"], "data לא מכיר את state/ui"),
  layer(["src/state/**"], ["ui", "app"], "state לא מכיר את ui"),
  layer(["src/ui/**"], ["data", "app"], "ui ניגש לנתונים רק דרך state"),
  layer(["src/app/**"], ["data"], "נתיבים מרכיבים מסכים מ-ui ו-state בלבד"),
]);
