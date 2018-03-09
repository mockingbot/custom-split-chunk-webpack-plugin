import { resolve } from 'path'
import { execSync } from 'child_process'

import { binary as formatBinary } from 'dr-js/library/common/format'
import { getFileList } from 'dr-js/library/node/file/Directory'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { wrapFileProcessor, fileProcessorBabel } from 'dev-dep-tool/library/fileProcessor'
import { initOutput, packOutput, publishOutput } from 'dev-dep-tool/library/commonOutput'
import { MODULE_OPTION, minifyFileListWithUglifyEs } from 'dev-dep-tool/library/uglify'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }

runMain(async (logger) => {
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })
  if (!argvFlag('pack')) return

  if (argvFlag('publish', 'publish-dev')) {
    logger.padLog('test source')
    execSync(`npm run test`, execOptionRoot)
  }

  logger.padLog(`build library`)
  execSync('npm run build-library', execOptionRoot)

  logger.padLog(`minify`)
  await minifyFileListWithUglifyEs({
    fileList: (await getFileList(fromOutput('library'))).filter((path) => path.endsWith('.js') && !path.endsWith('.test.js')),
    option: MODULE_OPTION,
    rootPath: PATH_OUTPUT,
    logger
  })

  logger.padLog(`process library`)
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })
  let sizeCodeReduceLibrary = 0
  for (const filePath of await getFileList(fromOutput('library'))) sizeCodeReduceLibrary += await processBabel(filePath)
  logger.log(`library size reduce: ${formatBinary(sizeCodeReduceLibrary)}B`)

  await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({
    flagList: process.argv,
    packageJSON,
    onPublish: () => execSync('npm publish --tag latest --userconfig ~/thatbean.npmrc', execOptionOutput),
    onPublishDev: () => execSync('npm publish --tag dev --userconfig ~/thatbean.npmrc', execOptionOutput),
    logger
  })
}, getLogger(process.argv.slice(2).join('+')))