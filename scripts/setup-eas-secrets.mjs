#!/usr/bin/env node
/**
 * setup-eas-secrets.mjs
 *
 * Reads your local .env and pushes all EXPO_PUBLIC_* values as EAS project secrets.
 * Run once: node scripts/setup-eas-secrets.mjs
 *
 * Requires: eas-cli installed globally (npm i -g eas-cli) and logged in (eas login)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const envPath = path.resolve(import.meta.dirname, "..", ".env");

if (!fs.existsSync(envPath)) {
  console.error("No .env file found at", envPath);
  process.exit(1);
}

const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
const secrets = lines
  .map(l => l.trim())
  .filter(l => l && !l.startsWith("#") && l.includes("="))
  .map(l => { const i = l.indexOf("="); return { key: l.slice(0, i), value: l.slice(i + 1) }; })
  .filter(({ key }) => key.startsWith("EXPO_PUBLIC_"));

if (secrets.length === 0) {
  console.error("No EXPO_PUBLIC_* keys found in .env");
  process.exit(1);
}

console.log(`Setting ${secrets.length} EAS secrets...\n`);

for (const { key, value } of secrets) {
  if (!value.trim()) {
    console.warn(`  ⚠ Skipping ${key} — empty value`);
    continue;
  }
  try {
    execSync(
      `eas secret:create --scope project --name ${key} --value "${value}" --force`,
      { stdio: "pipe" }
    );
    console.log(`  ✓ ${key}`);
  } catch (err) {
    const msg = err.stderr?.toString() ?? err.message;
    console.error(`  ✗ ${key}: ${msg.trim()}`);
  }
}

console.log("\nDone. Verify at: https://expo.dev/accounts/[user]/projects/smag-mobile/secrets");
