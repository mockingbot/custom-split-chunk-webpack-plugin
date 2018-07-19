const PLUGIN_NAME = 'CustomSplitChunkWebpackPlugin'

// modified from: https://github.com/webpack/webpack/blob/00f70fc65cab43d682c80264c959eff81db531b4/lib/optimize/SplitChunksPlugin.js
class CustomSplitChunkWebpackPlugin {
  static name = PLUGIN_NAME // prevent code minify drop plugin name

  constructor (customOptionList) {
    this.customOptionList = verifyCustomOptionList(customOptionList)
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      let alreadyOptimized = false

      compilation.hooks.unseal.tap(PLUGIN_NAME, () => {
        alreadyOptimized = false
      })

      compilation.hooks.optimizeChunksAdvanced.tap(PLUGIN_NAME, (chunks) => {
        if (alreadyOptimized) return
        alreadyOptimized = true
        return this.customOptionList.reduce((o, customOption) => {
          __DEV__ && console.log('## SPLIT START ===', JSON.stringify(customOption))
          const isChanged = applyCustomSplitChunk(customOption, compilation, chunks)
          __DEV__ && console.log('## SPLIT DONE ====\n')
          return isChanged || o
        }, false)
      })
    })
  }
}

const devChunkList = (chunkList) => chunkList.map((chunk) => chunk.name).join(', ')
const devModuleList = (moduleList) => `[ "${moduleList.map((module) => (module.nameForCondition ? module.nameForCondition() : module.context).slice(-12)).join('", "')}" ]`

const verifyCustomOptionList = (customOptionList) => customOptionList.map(({
  chunkName,
  useExistChunk = false, // prevent mis-configuration
  filterChunk = (chunk) => true, // default select all chunk
  filterModule // = (module, moduleChunkList, selectedChunkList) => true
}, index) => {
  useExistChunk = Boolean(useExistChunk)
  if (typeof (chunkName) !== 'string') throw new Error(`[${PLUGIN_NAME}] invalid chunkName in option #${index}`)
  if (typeof (filterChunk) !== 'function') throw new Error(`[${PLUGIN_NAME}] invalid filterChunk in option #${index}`)
  if (typeof (filterModule) !== 'function') throw new Error(`[${PLUGIN_NAME}] invalid filterModule in option #${index}`)
  return { chunkName, useExistChunk, filterChunk, filterModule }
})

const applyCustomSplitChunk = ({ chunkName, useExistChunk, filterChunk, filterModule }, compilation, chunkList) => {
  const initialChunkNameList = chunkList.map((chunk) => chunk.name)
  const isFilenameTaken = initialChunkNameList.includes(chunkName)
  if (useExistChunk !== isFilenameTaken) {
    throw new Error(useExistChunk
      ? `[${PLUGIN_NAME}] no chunk exist with chunkName: ${chunkName}`
      : `[${PLUGIN_NAME}] exist chunk with chunkName: ${chunkName}, set useExistChunk?`
    )
  }

  const selectedChunkListInclusive = chunkList.filter((chunk) => filterChunk({
    chunk,
    chunkList,
    initialChunkNameList
  }))
  const selectedChunkList = useExistChunk
    ? selectedChunkListInclusive.filter((chunk) => chunk.name !== chunkName) // exclude chunkName when useExistChunk
    : selectedChunkListInclusive
  if (!selectedChunkList.length) throw new Error(`[${PLUGIN_NAME}] no chunk selected for chunkName: ${chunkName}`)
  __DEV__ && console.log('[selectedChunkList]', devChunkList(selectedChunkList))

  const selectedModuleSet = new Set([
    ...selectedChunkListInclusive.reduce((o, chunk) => o.concat(chunk.getModules()), [])
  ])
  const selectedModuleList = Array.from(selectedModuleSet).filter((module) => filterModule({
    module,
    moduleChunkList: module.getChunks().filter((chunk) => selectedChunkListInclusive.includes(chunk)),
    selectedChunkList,
    chunkList,
    initialChunkNameList
  }))
  if (!selectedModuleList.length) throw new Error(`[${PLUGIN_NAME}] no module selected for chunkName: ${chunkName}`)
  __DEV__ && console.log('[selectedModuleList]', devModuleList(selectedModuleList))

  // get the target split chunk
  const targetSplitChunk = useExistChunk
    ? chunkList.find((chunk) => chunk.name === chunkName) // reuse entry chunk
    : compilation.addChunk(chunkName) // new chunk

  // add a note to the chunk
  targetSplitChunk.chunkReason = `${PLUGIN_NAME} (chunkName: ${chunkName}, useExistChunk: ${useExistChunk})`

  // remove selected module from selected chunk
  for (const chunk of selectedChunkList) {
    const chunkModule = chunk.getModules()
    const splitModuleList = chunkModule.filter((module) => selectedModuleList.includes(module))
    if (!splitModuleList.length) continue

    __DEV__ && console.log(`try split chunk '${chunk.name}' to '${chunkName}' (current total chunk: ${chunkList.length})`)
    __DEV__ && console.log('- split module:  ', devModuleList(splitModuleList))
    __DEV__ && console.log('- remain module: ', devModuleList(chunkModule.filter((module) => !splitModuleList.includes(module))))

    // TODO: CHECK: if all module is splitted from this chunk, should remove the chunk from graph, and connect to targetSplitChunk
    if (splitModuleList.length === chunkModule.length) throw new Error(`[${PLUGIN_NAME}] all module from chunk '${chunk.name}' will be split to '${chunkName}'`)

    // add graph connections for splitted chunk
    chunk.split(targetSplitChunk)

    // remove all selected modules from the chunk
    for (const module of splitModuleList) {
      chunk.removeModule(module)
      module.rewriteChunkInReasons(chunk, [ targetSplitChunk ])
    }
  }

  // add all modules to the target split chunk
  for (const module of selectedModuleList) {
    connectChunkAndModule(targetSplitChunk, module)
  }

  return true
}

// picked from github:webpack/webpack
// https://github.com/webpack/webpack/blob/3072378892739475c2707a024677511bba3ca973/lib/GraphHelpers.js#L34
const connectChunkAndModule = (chunk, module) => {
  if (module.addChunk(chunk)) {
    chunk.addModule(module)
  }
}

export { CustomSplitChunkWebpackPlugin }
