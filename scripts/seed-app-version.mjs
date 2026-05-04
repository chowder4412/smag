import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const envPath = path.join(rootDir, ".env");
const firebaseConfigPath = path.join(
  process.env.USERPROFILE ?? "C:\\Users\\HP",
  ".config", "configstore", "firebase-tools.json"
);

function parseEnv(source) {
  return Object.fromEntries(
    source.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"))
      .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const firebase = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const accessToken = firebase.tokens?.access_token;

if (!projectId || !accessToken) {
  console.error("Missing projectId or access token");
  process.exit(1);
}

const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/app_config/version`;

const body = JSON.stringify({
  fields: {
    min_version: { stringValue: "1.1.0" },
    updated_at: { stringValue: new Date().toISOString() }
  }
});

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body
});

if (!res.ok) {
  const text = await res.text();
  console.error("Failed:", res.status, text);
  process.exit(1);
}

console.log("✓ app_config/version created — min_version: 1.1.0");
console.log("  checkAppVersion will now enforce version 1.1.0 as the minimum.");
