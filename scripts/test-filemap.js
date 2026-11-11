const { getDefaultConfig } = require('expo/metro-config');
const metroConfig = require('../metro.config.js');
const createFileMap = require('metro/src/node-haste/lib/createFileMap');

async function test() {
  try {
    console.log('Testing createFileMap with project config...');
    const fileMap = createFileMap(metroConfig, { throwOnModuleCollision: false, watch: false });
    console.log('Building fileMap...');
    const result = await fileMap.build();
    console.log('fileMap built successfully! File count:', result.fileSystem.getAllFiles().length);
  } catch (err) {
    console.error('fileMap build FAILED:', err);
  }
}

test();
