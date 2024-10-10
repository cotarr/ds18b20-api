import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js", "bin/www"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'off'
    }
  }
];