module.exports = {
  extends: [
    'plugin:node/recommended',
    '.eslintrc',
    // 'eslint:recommended',
    // 'plugin:jest/recommended',
    // 'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:@typescript-eslint/recommended',
    // 'prettier/@typescript-eslint',
  ],
  rules: {
    'node/no-unsupported-features/es-syntax': 0,
    'node/no-missing-import': [
      2,
      {
        tryExtensions: ['.ts', '.js', '.mjs', '.json', '.node'],
      },
    ],
  },
};
