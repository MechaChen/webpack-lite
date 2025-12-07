# webpack-lite

## Flow

- 1 先將 JS entry 傳入 `createGraph` 中，分別解析各個檔案
  - 1-1. 再利用 `createAsset`，取出檔案的內容，解析出 AST 後，將 `import` 的 file 加到該 file 的 dependency 中
  - 1-2. 再將此 file 的 code，透過 `@babel/preset-env` 轉成 ES5 的版本
  - 1-3. 以 object 形式回傳此 file 的重點資訊： `id`, `filename`, `code`, `dependencies`
- 2. 以 BFS 的方式遍歷所有檔案，組成一個扁平陣列，包含所有 file 資訊及其 dependencies id
  - 2-1. 利用 `createAsset` 取出該檔案的 asset
  - 2-2. 再將現在引用檔案的相對路徑，mapping 到實際 file asset 的 id
  - 2-3. 遍歷下一個 file
- 3. `bundle`，將所有檔案綁成一個 IIFE
  - 3-1. 將所有 file asset array 串成一包 file asset object string，包含要執行的 function & 該 file 要引入的 module，當作參數帶入 IIFE
  - 3-2. 回傳一個 IIFE string，從 entry file 開始執行 `require(0)` 函數
  - 3-3. 啟動 `require` 函式，取得現在 module 的 code & import module id
  - 3-4. 執行自定義 `require`，先取得現在 file 需要引入的值
  - 3-5. 再將自定義 `module` 傳進去，取得執行完後得到 `exports` 的結果
  - 3-6. 在底層，最終會沒有需要 `require` 的 file，此時會直接回傳 `export` 的檔案
  - 3-7. 上一層 `localRequire` 會獲得 `localModule.exports` 的結果，在執行此 file 的 code
  - 3-8. 最終再將執行完的結果，將需要的值回傳給此 file 的 `localModule.exports`，再回傳給上一層
  - 3-9. 最終回傳到最上層，完成所有的 file 執行
