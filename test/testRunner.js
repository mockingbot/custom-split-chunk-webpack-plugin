import { deepStrictEqual } from 'assert'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { runMain } from 'dr-dev/module/main'
import { compileWithWebpack } from 'dr-dev/module/webpack'

import { createCustomSplitChunkWebpackPlugin } from '../source'

const sortMark = (a, b) => a.localeCompare(b)
const taskRunner = ({
  PATH_ROOT,
  PATH_OUTPUT,
  entryMap,
  customOptionList,
  verifyOutputContentMap,
  taskName
}) => runMain(async (logger) => {
  const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
  const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)

  const babelOption = {
    configFile: false,
    babelrc: false,
    presets: [ [ '@babel/env', { targets: { node: '10' }, modules: false } ] ],
    plugins: [ [ '@babel/proposal-class-properties' ] ]
  }

  const config = {
    mode: 'production',
    output: { path: fromOutput(), filename: '[name].js' },
    entry: entryMap,
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: babelOption } } ] },
    plugins: [ createCustomSplitChunkWebpackPlugin(customOptionList) ],
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
}, taskName)

export { taskRunner }
