const BABEL_ENV = process.env.BABEL_ENV || ''
const isDev = BABEL_ENV.includes('dev')
const isModule = BABEL_ENV.includes('module')

module.exports = {
  presets: [
    [ '@babel/env', { targets: { node: '10' }, modules: isModule ? false : 'commonjs' } ]
  ],
  plugins: [
    [ '@babel/proposal-class-properties' ],
    [ 'minify-replace', { replacements: [ { identifierName: '__DEV__', replacement: { type: 'booleanLiteral', value: isDev } } ] } ],
    [ 'module-resolver', {
      root: [ './' ],
      alias: isModule ? undefined : { '^@dr-js/([\\w-]+)/module/(.+)': '@dr-js/\\1/library/\\2' }
    } ]
  ],
  comments: false
}
