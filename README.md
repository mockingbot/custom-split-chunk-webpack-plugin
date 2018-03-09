# CustomSplitChunk Webpack Plugin

[![i:npm]][l:npm]
[![i:status]][l:status]

Get custom chunk by split selected module from selected chunk list.

[Detailed concepts](./CONCEPT.md)

#### Basic Usage 

```js
const { CustomSplitChunkWebpackPlugin } = require('custom-split-chunk-webpack-plugin')

const customOptionList = [
  { // first custom split option
    useExistChunk: false,
    chunkName: 'vendor-or-lib-or-else',
    filterChunk: ({
      chunk,
      chunkList,
      initialChunkNameList
    }) => true,
    filterModule: ({
      module,
      moduleChunkList,
      selectedChunkList,
      chunkList,
      initialChunkNameList
    }) => true
  },
  { useExistChunk, chunkName, filterChunk, filterModule } // second custom split option
]

const webpackConfig = {
  plugins: [
    // ...
    new CustomSplitChunkWebpackPlugin(customOptionList)
    // ...
  ]
}
```

[i:npm]: https://img.shields.io/npm/v/custom-split-chunk-webpack-plugin.svg
[l:npm]: https://www.npmjs.com/package/custom-split-chunk-webpack-plugin
[i:status]: https://travis-ci.org/mockingbot/custom-split-chunk-webpack-plugin.svg?branch=master
[l:status]: https://travis-ci.org/mockingbot/custom-split-chunk-webpack-plugin
