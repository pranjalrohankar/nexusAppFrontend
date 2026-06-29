
// amazonq-ignore-next-line// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
// amazonq-ignore-next-line
// amazonq-ignore-next-line
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  }
]);
