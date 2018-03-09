# CustomSplitChunkWebpackPlugin

Get custom chunk by split selected module from selected chunk list.

> - [Usage](#usage)
> - [Detail](#detail)
>   - [What is the problem](#what-is-the-problem)
>   - [Why this plugin](#why-this-plugin)
>   - [How this plugin solves the problem](#how-this-plugin-solves-the-problem)
>   - [More custom](#more-custom)
> - [Reference](#reference)

**[WARNING]** Do not use this plugin, 
if do not (think you should) know how `split` works in webpack.

**[WARNING]** This plugin tries to be as non-auto as possible, 
so the custom chunk will and must be splitted and generated.

## Usage

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

- `customOptionList`: Array
  - list of `customOption`s, the order is the order for chunk split.
- `customOption`: Object
  * `chunkName`: Required
    - name of `targetSplitChunk`
  * `useExistChunk`: Default: `false` (must create a new chunk) 
    - Indicate if we must create a new chunk, or reuse on exist chunk as `targetSplitChunk`.
  * `filterChunk`: Default: `() => true` (select all chunks)
    - return `true` to select chunks to apply split with
    - Param: `chunk`: webpack [Chunk.js](https://github.com/webpack/webpack/blob/master/lib/Chunk.js)
    - Param: `chunkList`: list of currently exists chunks (will increase during split)
    - Param: `initialChunkNameList`: list of names for chunks at the beginning of split (will not change during split)
  * `filterModule`: Required
    - return `true` to select module to be split to `targetSplitChunk`
    - Param: `module`: webpack [Module.js](https://github.com/webpack/webpack/blob/master/lib/Module.js)
    - Param: `moduleChunkList`: list of module chunks **in selected chunk** (get all module chunks by `module.getChunks()`)
    - Param: `selectedChunkList`: the result chunk list of `filterChunk`
    - Param: `chunkList`: list of currently exists chunks (will increase during split)
    - Param: `initialChunkNameList`: list of names for chunks at the beginning of split (will not change during split)


## Detail

    [insert webpack basic here]
    [insert webpack basic here]
    [insert webpack basic here]

And about basic [webpack data structure](https://webpack.js.org/api/stats/)
like `asset, chunk, module`.

Normally each `entry` in `webpack.config` should result in one single `chunk` of `modules`,
and then being output as one single JS file, 
and then to be loaded in HTML.

For example we have 3 HTML to add JS to, 
so we need 3 entry for webpack, 
and our sample code could be like this:

    entry-A ─ A.js ─ A.html
    entry-B ─ B.js ─ B.html
    entry-C ─ C.js ─ C.html

What webpack will do to pack the code will be like:

    entry-A ┬ file-A1.js ┬ module-A1 ────┬ chunk-A (A1, A2, A3, lib-ui, vendor) ─ A.js
            │            ├ module-A2 ────┤
            │            └ module-vendor ┤
            └ file-A2.js ┬ module-A3 ────┤
                         ├ module-lib-ui ┤
                         └ module-vendor ┘

    entry-B ─ file-B1.js ┬ module-B1 ────┬ chunk-B (B1,                 vendor) ─ B.js
                         └ module-vendor ┘

    entry-C ─ file-C1.js ┬ module-C1 ────┬ chunk-C (C1,         lib-ui, vendor) ─ C.js
                         ├ module-lib-ui ┤
                         └ module-vendor ┘

So basically webpack is doing:

    entry-A ─ chunk-A (A1, A2, A3, lib-ui, vendor) ─ A.js
    entry-B ─ chunk-B (B1,                 vendor) ─ B.js
    entry-C ─ chunk-C (C1,         lib-ui, vendor) ─ C.js

And let's assume the code has size:
    
    module-lib-ui is 1.0MB
    module-vendor is 0.5MB

Now we load `A.js`, `B.js`, `C.js` to 3 out pages, 
and we get our JS code working just fine.

There's a problem, 
the `vendor` and `lib-ui` code is big,
and we do not want to load the same `vendor` code 3 times.

if user go through page `A.html`, `B.html`, `C.html` one by one, 
`0.5MB + 1.0MB + 0.5MB` download is unnecessary.

We want the output file to be split like this, 
so big sized `module` is cached and reused between pages:

    entry-A ─ chunk-A      (A1, A2, A3) ─ A.js (require: vendor, lib-ui)
    entry-B ─ chunk-B      (B1        ) ─ B.js (require: vendor)
    entry-C ─ chunk-C      (C1        ) ─ C.js (require: vendor, lib-ui)
              chunk-vendor (vendor    ) ─ vendor.js
              chunk-lib-ui (lib-ui    ) ─ lib-ui.js

We can use `optimization.splitChunk` or previously `CommonsChunkPlugin` to do that, and that's fine. 
([step by step chunk split](#tetris-example))

##### What is the problem

So a more complex problem, with more pages and entries:

    entry-A ─ chunk-A (A1, lib-data, lib-ui, vendor) ─ A.js
    entry-B ─ chunk-B (B1, lib-data, lib-ui, vendor) ─ B.js
    entry-C ─ chunk-C (C1,                   vendor) ─ C.js
    entry-D ─ chunk-D (D1,                   vendor) ─ D.js
    entry-E ─ chunk-E (E1,           lib-ui, vendor) ─ E.js
    entry-F ─ chunk-F (F1,           lib-ui, vendor) ─ F.js

And let's assume:
    
    module-lib-data is 2.0MB (SUPER-BIG)
    module-lib-ui   is 1.0MB
    module-vendor   is 0.5MB

We want to specifically optimize output size for `entry-A` and `entry-B`,
so we want to create a super big chunk just for page `A` and `B` to load.
So we expect the output be like:

    entry-A ─ chunk-A       (A1                      ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                      ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1                      ) ─ C.js (require: vendor)
    entry-D ─ chunk-D       (D1                      ) ─ D.js (require: vendor)
    entry-E ─ chunk-E       (E1                      ) ─ E.js (require: vendor, lib-ui)
    entry-F ─ chunk-F       (F1                      ) ─ F.js (require: vendor, lib-ui)
              chunk-lib-big (lib-data, lib-ui, vendor) ─ lib-big.js
              chunk-vendor  (                  vendor) ─ vendor.js
              chunk-lib-ui  (          lib-ui        ) ─ lib-ui.js

Previously with `webpack@3`, we can use `CommonsChunkPlugin` to do that,
but not with `optimization.splitChunk` in `webpack@4`.

The reason is `optimization.splitChunk` always perform split on **all chunks**.

If we try split `lib-big` first, we get:

    entry-A ─ chunk-A       (A1                      ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                      ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1                      ) ─ C.js (require: lib-big)
    entry-D ─ chunk-D       (D1                      ) ─ D.js (require: lib-big)
    entry-E ─ chunk-E       (E1                      ) ─ E.js (require: lib-big)
    entry-F ─ chunk-F       (F1                      ) ─ F.js (require: lib-big)
              chunk-lib-big (lib-data, lib-ui, vendor) ─ lib-big.js

Or we try split `vendor` first, we get:

    entry-A ─ chunk-A      (A1, lib-data, lib-ui) ─ A.js (require: vendor)
    entry-B ─ chunk-B      (B1, lib-data, lib-ui) ─ B.js (require: vendor)
    entry-C ─ chunk-C      (C1,                 ) ─ C.js (require: vendor)
    entry-D ─ chunk-D      (D1,                 ) ─ D.js (require: vendor)
    entry-E ─ chunk-E      (E1,           lib-ui) ─ E.js (require: vendor)
    entry-F ─ chunk-F      (F1,           lib-ui) ─ F.js (require: vendor)
              chunk-vendor (              vendor) ─ vendor.js

Further trying to split `lib-big` with `optimization.splitChunk` will get us this result:

    entry-A ─ chunk-A       (A1                      ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                      ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1                      ) ─ C.js (require: lib-big)
    entry-D ─ chunk-D       (D1                      ) ─ D.js (require: lib-big)
    entry-E ─ chunk-E       (E1                      ) ─ E.js (require: lib-big)
    entry-F ─ chunk-F       (F1                      ) ─ F.js (require: lib-big)
              chunk-vendor  (                        ) ─ vendor.js (require: lib-big)
              chunk-lib-big (lib-data, lib-ui, vendor) ─ lib-big.js

So the split can either be `vendor` or `lib-big`, but not both.
For there is no scope, or range to limit the split.

##### Why this plugin

The option for `optimization.splitChunk` do allow us to specify:
- split order
- select module
and also provide more loops for auto chunk optimization.

But to better directly define chunk split, `CustomSplitChunkWebpackPlugin` option include:
- split order (order of `customOption` in `customOptionList`)
- select chunk (`filterChunk`)
- select module (`filterModule`)
and the split only apply to selected chunks.

##### How this plugin solves the problem

With some config like this:

```js
new CustomSplitChunkWebpackPlugin([ {
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
} ])
```

We can get what we want after 3 splits.
The first split will produce `lib-big` only from `chunk-A` and `chunk-B`:

    entry-A ─ chunk-A       (A1                          ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                          ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1,                   vendor) ─ C.js
    entry-D ─ chunk-D       (D1,                   vendor) ─ D.js
    entry-E ─ chunk-E       (E1,           lib-ui, vendor) ─ E.js
    entry-F ─ chunk-F       (F1,           lib-ui, vendor) ─ F.js
              chunk-lib-big (    lib-data, lib-ui, vendor) ─ lib-big.js

Next split will generate `vendor` from chunks except `chunk-lib-big`:

    entry-A ─ chunk-A       (A1                      ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                      ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1                      ) ─ C.js (require: vendor)
    entry-D ─ chunk-D       (D1                      ) ─ D.js (require: vendor)
    entry-E ─ chunk-E       (E1,               lib-ui) ─ E.js (require: vendor)
    entry-F ─ chunk-F       (F1,               lib-ui) ─ F.js (require: vendor)
              chunk-lib-big (lib-data, lib-ui, vendor) ─ lib-big.js
              chunk-vendor  (                  vendor) ─ vendor.js

Last split will generate `lib-ui` from chunks except `chunk-lib-big`:

    entry-A ─ chunk-A       (A1                      ) ─ A.js (require: lib-big)
    entry-B ─ chunk-B       (B1                      ) ─ B.js (require: lib-big)
    entry-C ─ chunk-C       (C1                      ) ─ C.js (require: vendor)
    entry-D ─ chunk-D       (D1                      ) ─ D.js (require: vendor)
    entry-E ─ chunk-E       (E1                      ) ─ E.js (require: vendor, lib-ui)
    entry-F ─ chunk-F       (F1                      ) ─ F.js (require: vendor, lib-ui)
              chunk-lib-big (lib-data, lib-ui, vendor) ─ lib-big.js
              chunk-vendor  (                  vendor) ─ vendor.js
              chunk-lib-ui  (          lib-ui        ) ─ lib-ui.js

###### Test code at [`test/custom-lib-big/index.js`](test/custom-lib-big/index.js)

##### More custom

And if we change the order of `customOption`, like:

```js
new CustomSplitChunkWebpackPlugin([ {
  chunkName: 'vendor',
  // split modules used in all chunks
  filterModule: ({ moduleChunkList, initialChunkNameList }) => moduleChunkList.length === initialChunkNameList.length
}, {
  chunkName: 'lib-data-ui',
  // only for `chunk-A` and `chunk-B`
  filterChunk: ({ chunk }) => [ 'A', 'B' ].includes(chunk.name),
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
  chunkName: 'lib-ui',
  // select all except `chunk-lib-big`
  filterChunk: ({ chunk }) => ![ 'vendor', 'lib-data-ui' ].includes(chunk.name),
  // this module must be used in at least 2 of selected chunks
  filterModule: ({ module, moduleChunkList }) => moduleChunkList.length >= 2
} ])
```

We can get different split result, optimized for better `vendor` cache:

    entry-A ─ chunk-A           (A1              ) ─ A.js (require: vendor, lib-data-ui)
    entry-B ─ chunk-B           (B1              ) ─ B.js (require: vendor, lib-data-ui)
    entry-C ─ chunk-C           (C1              ) ─ C.js (require: vendor)
    entry-D ─ chunk-D           (D1              ) ─ D.js (require: vendor)
    entry-E ─ chunk-E           (E1              ) ─ E.js (require: vendor, lib-ui)
    entry-F ─ chunk-F           (F1              ) ─ F.js (require: vendor, lib-ui)
              chunk-vendor      (vendor          ) ─ vendor.js
              chunk-lib-data-ui (lib-data, lib-ui) ─ lib-data-ui.js
              chunk-lib-ui      (          lib-ui) ─ lib-ui.js

###### Test code at [`test/custom-lib-data-ui/index.js`](test/custom-lib-data-ui/index.js)

And we can also write even weirder `customOptionList` to split `lib-data-vendor` or `lib-ui-vendor`, you get the idea.


## Reference

This plugin is modified from: (commit: 00f70fc65cab43d682c80264c959eff81db531b4)
  - [webpack/lib/optimize/SplitChunksPlugin.js](https://github.com/webpack/webpack/blob/00f70fc65cab43d682c80264c959eff81db531b4/lib/optimize/SplitChunksPlugin.js)
  - [webpack/lib/GraphHelpers.js](https://github.com/webpack/webpack/blob/00f70fc65cab43d682c80264c959eff81db531b4/lib/GraphHelpers.js)




> ###### Tetris Example
> 
> The step by step chunk split, the initial state of chunks:
> 
>     entry-A ─ chunk-A      (A1, A2, A3, lib-ui, vendor) ─ A.js
>     entry-B ─ chunk-B      (B1                  vendor) ─ B.js
>     entry-C ─ chunk-C      (C1          lib-ui, vendor) ─ C.js
> 
> First `vendor` split, now `A.js`, `B.js`, `C.js` 
> all require code from `vendor.js` to work properly:
> 
>     entry-A ─ chunk-A      (A1, A2, A3, lib-ui        ) ─ A.js (require: vendor)
>     entry-B ─ chunk-B      (B1                        ) ─ B.js (require: vendor)
>     entry-C ─ chunk-C      (C1          lib-ui        ) ─ C.js (require: vendor)
>               chunk-vendor (                    vendor) ─ vendor.js
> 
> Then `lib-ui` split, now `A.js`, `C.js` 
> will require code from both `vendor.js` and `lib-ui.js` to work properly:
> 
>     entry-A ─ chunk-A      (A1, A2, A3                ) ─ A.js (require: vendor, lib-ui)
>     entry-B ─ chunk-B      (B1                        ) ─ B.js (require: vendor)
>     entry-C ─ chunk-C      (C1                        ) ─ C.js (require: vendor, lib-ui)
>               chunk-vendor (                    vendor) ─ vendor.js
>               chunk-lib-ui (            lib-ui        ) ─ lib-ui.js
> 
> So we're basically split chunk by columns, like playing a rotated Tetris.
> If we need `entry-C` in page, we need to add 3 lines of code: (in `webpack@4` order does not matter)
> 
> ```html
> <script src="vendor.js"></script>
> <script src="lib-ui.js"></script>
> <script src="C.js"></script>
> ```
> 
> ###### Test code at [`test/basic/index.js`](test/basic/index.js)
