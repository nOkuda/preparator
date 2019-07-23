module.exports = {
  use: [
    ['@neutrinojs/standardjs', {
      eslint: {
        rules: {
          semi: 'off',
          'space-before-function-paren': 'off'
        }
      }
    }],
    '@neutrinojs/react-components',
    '@neutrinojs/jest'
  ]
};
