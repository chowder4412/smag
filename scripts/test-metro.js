const Metro = require('metro');
const config = require('../metro.config.js');

async function main() {
  console.log('Loading Metro config...');
  const c = await Metro.loadConfig({}, config);
  console.log('Metro config loaded.');
  const DependencyGraph = require('metro/src/node-haste/DependencyGraph').default;
  console.log('Loading DependencyGraph...');
  try {
    const dg = await DependencyGraph.load(c, { watch: false });
    console.log('DependencyGraph loaded successfully!');
    const entry = require.resolve('expo-router/entry');
    console.log('Resolving entry:', entry);
    const res = dg.resolveDependency(entry, { name: './build/renderRootComponent', data: { isESMImport: false } }, 'web');
    console.log('Resolution result:', res);
  } catch (err) {
    console.error('Error during DependencyGraph:', err);
  }
}

main();
