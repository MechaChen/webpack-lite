const fs = require('fs');

// parse a single file and extract its dependencies
function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');

  console.log(content);
}

createAsset('./example/entry.js');
