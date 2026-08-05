const fs = require("node:fs");
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Ignore backend node_modules and project-root build outputs to speed up Metro
config.resolver.blockList = [
  new RegExp("^" + escapeRegExp(path.join(__dirname, "functions", "node_modules")) + ".*"),
  new RegExp("^" + escapeRegExp(path.join(__dirname, ".firebase")) + ".*"),
  new RegExp("^" + escapeRegExp(path.join(__dirname, "dist")) + ".*"),
];

const idbEsmEntry = path.join(__dirname, "node_modules", "idb", "build", "index.js");
const idbCjsEntry = path.join(__dirname, "node_modules", "idb", "build", "index.cjs");

function resolveIdbEntry() {
  if (fs.existsSync(idbEsmEntry)) return idbEsmEntry;
  if (fs.existsSync(idbCjsEntry)) return idbCjsEntry;
  return null;
}

// Modules that are native-only and crash on web
const WEB_STUBS = new Set([
  "react-native-maps",
  "expo-location"
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub native-only modules on web to prevent white screen crashes
  if (platform === "web" && WEB_STUBS.has(moduleName)) {
    return {
      filePath: path.join(__dirname, "src", "lib", "web-stubs", `${moduleName}.js`),
      type: "sourceFile"
    };
  }

  if (moduleName === "idb") {
    const filePath = resolveIdbEntry();
    if (filePath) {
      return {
        filePath,
        type: "sourceFile"
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
