module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "work/**",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs" },
    rules: {
      "constructor-super": "error",
      "no-async-promise-executor": "error",
      "no-constant-condition": "error",
      "no-dupe-class-members": "error",
      "no-dupe-keys": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-unreachable": "error",
      "no-unused-private-class-members": "error",
      "no-use-before-define": [
        "error",
        { functions: false, classes: true, variables: false },
      ],
    },
  },
];
