import { resolve as resolvePath } from 'path'
import { taskRunner } from '../testRunner'

const PATH_ROOT = resolvePath(__dirname)
const PATH_OUTPUT = resolvePath(__dirname, 'output-gitignore')

const entryMap = {
  A: [ 'source/A1', 'source/A2' ],
  B: 'source/B1',
  C: 'source/C1'
}

const customOptionList = [
  { chunkName: 'vendor', filterModule: ({ moduleChunkList }) => moduleChunkList.length >= 3 },
  { chunkName: 'lib-ui', filterModule: ({ moduleChunkList }) => moduleChunkList.length >= 2 }
]

const verifyOutputContentMap = {
  'A.js': [ 'MARK_A1_DATA', 'MARK_A2_DATA', 'MARK_A3_DATA' ],
  'B.js': [ 'MARK_B1_DATA' ],
  'C.js': [ 'MARK_C1_DATA' ],
  'vendor.js': [ 'MARK_VENDOR_DATA' ],
  'lib-ui.js': [ 'MARK_UI_DATA' ]
}

taskRunner({
  PATH_ROOT,
  PATH_OUTPUT,
  entryMap,
  customOptionList,
  verifyOutputContentMap,
  taskName: 'test|basic'
})
