const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "smag-12fe9"
  });
}

const db = admin.firestore();

async function runCheck() {
  console.log("=== LATEST KITCHEN APPLICATIONS ===");
  try {
    const snap = await db.collection("kitchen_applications").orderBy("appliedAtIso", "desc").limit(5).get();
    if (snap.empty) {
      console.log("No kitchen applications found.");
    } else {
      snap.forEach(doc => {
        console.log(`Table / Collection Name: kitchen_applications`);
        console.log(`Document ID: ${doc.id}`);
        console.log(`Data:`, JSON.stringify(doc.data(), null, 2));
        console.log("------------------------");
      });
    }
  } catch (err) {
    console.error("Error querying kitchen_applications:", err.message);
  }
}

runCheck();
