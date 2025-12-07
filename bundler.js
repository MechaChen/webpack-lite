const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAst } = require('@babel/core');
const highlight = require('cli-highlight').highlight;

let id = 0;

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

  const { code } = transformFromAst(ast, null, {
    presets: ['@babel/preset-env'],
  });

  return {
    id: id++,
    filename,
    code,
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

function bundle(graph) {
  const modules = graph.reduce((accu, module) => {
    accu += `  ${module.id}: [
    function(require, module, exports) {
      ${module.code.replace(/\n/g, '\n      ')}
    },
    ${JSON.stringify(module.mapping)}
  ],
`;
    return accu;
  }, '');

  return `(function(modules) {
  function require(id) {
    const [fn, mapping] = modules[id];
    
    function localRequire(relativePath) {
      const moduleId = mapping[relativePath];
      return require(moduleId);
    }

    const localModule = { exports: {} };
    fn(localRequire, localModule, localModule.exports);
    return localModule.exports;
  }

  require(0);
})({
${modules}})`;
}

const graph = createGraph('./example/entry.js');
const result = bundle(graph);

console.log('Graph: --------------------------------');
console.log(
  highlight(JSON.stringify(graph, null, 2), {
    language: 'json',
    theme: 'github',
  }),
);
console.log('Result: --------------------------------');
console.log(highlight(result, { language: 'javascript', theme: 'github' }));
