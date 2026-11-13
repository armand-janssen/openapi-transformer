const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['.claude/', 'coverage/'] }, // agent worktrees and coverage reports are not project source
  js.configs.recommended,
  {
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      'guard-for-in': 'error',
    },
  },
];
