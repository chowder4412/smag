#!/usr/bin/env node
/**
 * Seeds the app_config/version document in Firestore.
 * Run once after deploying a new minimum version:
 *   node scripts/seed-app-config.mjs
 *
 * To force-update users below a certain version, bump min_version here and re-run.
 */

async function main() {
  const admin = await import("firebase-admin");
  const { readFileSync } = await import("fs");

  const serviceAccount = JSON.parse(
    readFileSync("./android/app/google-services.json", "utf8")
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  await db.collection("app_config").doc("version").set({
    min_version: "1.1.0",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("✅ app_config/version set to min_version: 1.1.0");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
