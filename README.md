# CustomSplitChunk Webpack Plugin

[![i:npm]][l:npm]
[![i:ci]][l:ci]
[![i:size]][l:size]
[![i:npm-dev]][l:npm]

Get custom chunk by split selected module from selected chunk list.

[i:npm]: https://img.shields.io/npm/v/custom-split-chunk-webpack-plugin?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/custom-split-chunk-webpack-plugin/dev
[l:npm]: https://npm.im/custom-split-chunk-webpack-plugin
[i:ci]: https://img.shields.io/github/workflow/status/mockingbot/custom-split-chunk-webpack-plugin/ci-test
[l:ci]: https://github.com/mockingbot/custom-split-chunk-webpack-plugin/actions?query=workflow:ci-test
[i:size]: https://packagephobia.now.sh/badge?p=custom-split-chunk-webpack-plugin
[l:size]: https://packagephobia.now.sh/result?p=custom-split-chunk-webpack-plugin

[//]: # (NON_PACKAGE_CONTENT)

[Detailed concepts](./CONCEPT.md)

#### Basic Usage 

```js
const { createCustomSplitChunkWebpackPlugin } = require('custom-split-chunk-webpack-plugin')

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
    createCustomSplitChunkWebpackPlugin(customOptionList)
    // ...
  ]
}
```
