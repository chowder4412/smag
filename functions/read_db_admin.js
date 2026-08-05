const admin = require("firebase-admin");

// Initialize using the active Firebase project ID
admin.initializeApp({
  projectId: "smag-12fe9"
});

const db = admin.firestore();

async function runCheck() {
  console.log("=== LATEST 5 DRIVER APPLICATIONS ===");
  try {
    const snap = await db.collection("driver_applications").orderBy("appliedAtIso", "desc").limit(5).get();
    snap.forEach(doc => {
      console.log(`DocID: ${doc.id}`);
      console.log(`  Name: ${doc.data().name}`);
      console.log(`  Email: ${doc.data().email}`);
      console.log(`  Status: ${doc.data().status}`);
      console.log(`  Applied At: ${doc.data().appliedAtIso}`);
      console.log(`  Approved At: ${doc.data().approvedAtIso}`);
      console.log(`  UID: ${doc.data().uid}`);
      console.log("------------------------");
    });
  } catch (err) {
    console.error("Failed to query driver_applications:", err.message);
  }

  console.log("\n=== LATEST 5 MAIL ENTRIES ===");
  try {
    const snap = await db.collection("mail").limit(5).get();
    snap.forEach(doc => {
      console.log(`DocID: ${doc.id}`);
      console.log(`  To: ${doc.data().to}`);
      console.log(`  Subject: ${doc.data().message?.subject}`);
      console.log(`  HTML Snippet: ${doc.data().message?.html?.substring(0, 100)}...`);
      console.log(`  Delivery Status:`, doc.data().delivery);
      console.log("------------------------");
    });
  } catch (err) {
    console.error("Failed to query mail:", err.message);
  }
}

runCheck();
