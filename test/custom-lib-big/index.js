import { resolve as resolvePath } from 'path'
import { taskRunner } from '../testRunner'

const PATH_ROOT = resolvePath(__dirname)
const PATH_OUTPUT = resolvePath(__dirname, 'output-gitignore')

const entryMap = {
  A: 'source/A1',
  B: 'source/B1',
  C: 'source/C1',
  D: 'source/D1',
  E: 'source/E1',
  F: 'source/F1'
}

const customOptionList = [ {
  chunkName: 'lib-big',
  // only for `chunk-A` and `chunk-B`
  filterChunk: ({ chunk }) => [ 'A', 'B' ].includes(chunk.name),
  // split the module used in both `chunk-A` and `chunk-B`
  filterModule: ({ module, moduleChunkList }) => {
    let isInChunkA = false
    let isInChunkB = false
    moduleChunkList.forEach((chunk) => {
      isInChunkA |= chunk.name === 'A'
      isInChunkB |= chunk.name === 'B'
    })
    return isInChunkA && isInChunkB
  }
}, {
  chunkName: 'vendor',
  // select all except `chunk-lib-big`
  filterChunk: ({ chunk }) => chunk.name !== 'lib-big',
  // this module must be used in at least 4 of selected chunks
  filterModule: ({ module, moduleChunkList }) => moduleChunkList.length >= 4
}, {
  chunkName: 'lib-ui',
  // select all except `chunk-lib-big`
  filterChunk: ({ chunk }) => chunk.name !== 'lib-big',
  // this module must be used in at least 2 of selected chunks
  filterModule: ({ module, moduleChunkList }) => moduleChunkList.length >= 2
} ]

const verifyOutputContentMap = {
  'A.js': [ 'MARK_A1_DATA' ],
  'B.js': [ 'MARK_B1_DATA' ],
  'C.js': [ 'MARK_C1_DATA' ],
  'D.js': [ 'MARK_D1_DATA' ],
  'E.js': [ 'MARK_E1_DATA' ],
  'F.js': [ 'MARK_F1_DATA' ],
  'lib-big.js': [ 'MARK_VENDOR_DATA', 'MARK_UI_DATA', 'MARK_DATA_DATA' ],
  'vendor.js': [ 'MARK_VENDOR_DATA' ],
  'lib-ui.js': [ 'MARK_UI_DATA' ]
}

taskRunner({
  PATH_ROOT,
  PATH_OUTPUT,
  entryMap,
  customOptionList,
  verifyOutputContentMap,
  taskName: 'test|custom-lib-big'
})
