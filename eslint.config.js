// eslint.config.js
import antfu from '@antfu/eslint-config';

export default await antfu({
  stylistic: {
    semi: true,
  },
  overrides: {
    typescript: {
      'no-new': 'off',
      'no-console': 'warn',
      'node/prefer-global/process': 'off',
    },
  },
});
