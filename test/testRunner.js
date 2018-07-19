import { deepStrictEqual } from 'assert'
import { readFileSync } from 'fs'
import { resolve as resolvePath } from 'path'

import { runMain } from 'dev-dep-tool/library/main'
import { getLogger } from 'dev-dep-tool/library/logger'
import { compileWithWebpack } from 'dev-dep-tool/library/webpack'

import { CustomSplitChunkWebpackPlugin } from '../source'

const sortMark = (a, b) => a.localeCompare(b)
const taskRunner = ({
  PATH_ROOT,
  PATH_OUTPUT,
  entryMap,
  customOptionList,
  verifyOutputContentMap,
  taskName
}) => runMain(async (logger) => {
  const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)
  const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

  const babelOption = {
    configFile: false,
    babelrc: false,
    presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ] ],
    plugins: [ [ '@babel/proposal-class-properties' ] ]
  }

  const config = {
    mode: 'production',
    output: { path: fromOutput(), filename: '[name].js' },
    entry: entryMap,
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: babelOption } } ] },
    plugins: [ new CustomSplitChunkWebpackPlugin(customOptionList) ],
    optimization: { runtimeChunk: { name: 'runtime' }, minimize: false }
  }

  logger.padLog(`compile with webpack`)
  await compileWithWebpack({ config, isWatch: false, profileOutput: fromRoot('profile-stat-gitignore.json'), logger })

  logger.padLog(`verify output`)
  for (const [ fileName, markList ] of Object.entries(verifyOutputContentMap)) {
    const fileContent = readFileSync(fromOutput(fileName), { encoding: 'utf8' })
    const fileMarkList = Array.from(new Set(fileContent.match(/MARK_\w+/g)))
    logger.log(`verify file '${fileName}' to have: ${markList.join(', ')}`)
    deepStrictEqual(fileMarkList.sort(sortMark), markList.sort(sortMark), `verify file: ${fileName}`)
  }
}, getLogger(taskName))

export { taskRunner }
