const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// parse a single file and extract its dependencies
function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');

  // get the AST with babel parser
  const ast = parser.parse(content, {
    sourceType: 'module',
  });

  const dependencies = [];

  // traverse the AST and collect the dependencies
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  return {
    id: crypto.randomUUID(),
    filename,
    dependencies,
  };
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);
  const queue = [mainAsset];

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
    asset.mapping = {};

    asset.dependencies.forEach((relativeDependencyPath) => {
      const absoluteDependencyPath = path.join(dirname, relativeDependencyPath);
      const child = createAsset(absoluteDependencyPath);
      asset.mapping[relativeDependencyPath] = child.id;
      queue.push(child);
    });
  }

  return queue;
}

const graph = createGraph('./example/entry.js');

console.log(graph);
