/**
 * Seed script for external restaurants and their menus.
 * Run: node scripts/seed-external-restaurants.mjs
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK credentials.
 * Uses the same project as the app (reads .env for project ID).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load project ID from app.json
const appJson = JSON.parse(readFileSync(resolve(__dirname, "../app.json"), "utf8"));
const projectId = appJson.expo?.extra?.firebaseProjectId
  ?? appJson.expo?.android?.googleServicesFile
  ?? "smag-12fe9"; // fallback

console.log(`Seeding external restaurants for project: ${projectId}`);
console.log("─".repeat(60));

// ─── Restaurant data ──────────────────────────────────────────────────────────
// Coordinates are sample Lagos, Nigeria locations.
// Replace with real coordinates for your target city.

const restaurants = [
  {
    id: "chicken_republic_vi",
    name: "Chicken Republic",
    cuisine: "Fast Food",
    imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800",
    rating: 4.2,
    reviewCount: 1840,
    deliveryMinutes: "20-30",
    deliveryFee: 500,
    minimumOrder: 2000,
    isOpen: true,
    latitude: 6.4281,
    longitude: 3.4219,
    address: "Victoria Island, Lagos",
    tags: ["Chicken", "Burgers", "Fast Food"]
  },
  {
    id: "dominos_lekki",
    name: "Domino's Pizza",
    cuisine: "Pizza",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    rating: 4.4,
    reviewCount: 2310,
    deliveryMinutes: "25-40",
    deliveryFee: 800,
    minimumOrder: 3500,
    isOpen: true,
    latitude: 6.4474,
    longitude: 3.4722,
    address: "Lekki Phase 1, Lagos",
    tags: ["Pizza", "Pasta", "Sides"]
  },
  {
    id: "kilimanjaro_ikeja",
    name: "Kilimanjaro",
    cuisine: "Nigerian",
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
    rating: 4.5,
    reviewCount: 3120,
    deliveryMinutes: "30-45",
    deliveryFee: 600,
    minimumOrder: 2500,
    isOpen: true,
    latitude: 6.6018,
    longitude: 3.3515,
    address: "Ikeja, Lagos",
    tags: ["Nigerian", "Rice", "Soups", "Grills"]
  },
  {
    id: "the_place_surulere",
    name: "The Place",
    cuisine: "Nigerian",
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    rating: 4.6,
    reviewCount: 4200,
    deliveryMinutes: "25-35",
    deliveryFee: 700,
    minimumOrder: 3000,
    isOpen: true,
    latitude: 6.5059,
    longitude: 3.3573,
    address: "Surulere, Lagos",
    tags: ["Nigerian", "Pepper Soup", "Grills", "Seafood"]
  },
  {
    id: "mr_biggs_maryland",
    name: "Mr. Bigg's",
    cuisine: "Fast Food",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
    rating: 3.9,
    reviewCount: 980,
    deliveryMinutes: "15-25",
    deliveryFee: 400,
    minimumOrder: 1500,
    isOpen: true,
    latitude: 6.5629,
    longitude: 3.3596,
    address: "Maryland, Lagos",
    tags: ["Fast Food", "Pies", "Snacks"]
  },
  {
    id: "nandos_vi",
    name: "Nando's",
    cuisine: "Peri-Peri",
    imageUrl: "https://images.unsplash.com/photo-1598514982901-3f3a5e5e5e5e?w=800",
    rating: 4.3,
    reviewCount: 1560,
    deliveryMinutes: "30-45",
    deliveryFee: 900,
    minimumOrder: 4000,
    isOpen: true,
    latitude: 6.4295,
    longitude: 3.4201,
    address: "Victoria Island, Lagos",
    tags: ["Chicken", "Peri-Peri", "Grills"]
  },
  {
    id: "tantalizers_festac",
    name: "Tantalizers",
    cuisine: "Nigerian",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    rating: 4.0,
    reviewCount: 720,
    deliveryMinutes: "20-30",
    deliveryFee: 500,
    minimumOrder: 2000,
    isOpen: false,
    latitude: 6.4667,
    longitude: 3.2833,
    address: "Festac Town, Lagos",
    tags: ["Nigerian", "Rice", "Snacks"]
  },
  {
    id: "ocean_basket_lekki",
    name: "Ocean Basket",
    cuisine: "Seafood",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
    rating: 4.7,
    reviewCount: 890,
    deliveryMinutes: "35-50",
    deliveryFee: 1200,
    minimumOrder: 6000,
    isOpen: true,
    latitude: 6.4480,
    longitude: 3.4750,
    address: "Lekki Phase 1, Lagos",
    tags: ["Seafood", "Fish", "Calamari", "Fine Dining"]
  }
];

// ─── Menu items per restaurant ────────────────────────────────────────────────

const menuItems = {
  chicken_republic_vi: [
    { name: "Full Chicken", description: "Whole roasted chicken with sides", price: 8500, category: "Chicken", imageUrl: "https://images.unsplash.com/photo-1598514982901-3f3a5e5e5e5e?w=400", available: true, customisations: [{ label: "Spice Level", options: [{ name: "Mild", extraCost: 0 }, { name: "Hot", extraCost: 0 }, { name: "Extra Hot", extraCost: 0 }] }] },
    { name: "Chicken Burger", description: "Crispy chicken fillet in a toasted bun", price: 2800, category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", available: true, customisations: [] },
    { name: "Chips & Chicken", description: "Quarter chicken with seasoned fries", price: 3500, category: "Combos", imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400", available: true, customisations: [] },
    { name: "Coleslaw", description: "Creamy homemade coleslaw", price: 800, category: "Sides", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", available: true, customisations: [] }
  ],
  dominos_lekki: [
    { name: "Pepperoni Passion", description: "Double pepperoni on rich tomato sauce", price: 7500, category: "Pizzas", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", available: true, customisations: [{ label: "Size", options: [{ name: "Medium", extraCost: 0 }, { name: "Large", extraCost: 2000 }] }, { label: "Crust", options: [{ name: "Classic", extraCost: 0 }, { name: "Thin & Crispy", extraCost: 0 }, { name: "Stuffed Crust", extraCost: 1500 }] }] },
    { name: "Veggie Supreme", description: "Loaded with fresh garden vegetables", price: 6800, category: "Pizzas", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400", available: true, customisations: [{ label: "Size", options: [{ name: "Medium", extraCost: 0 }, { name: "Large", extraCost: 2000 }] }] },
    { name: "Garlic Bread", description: "Toasted garlic bread with herb butter", price: 1800, category: "Sides", imageUrl: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400", available: true, customisations: [] },
    { name: "Chicken Wings", description: "6 crispy wings with dipping sauce", price: 4200, category: "Sides", imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", available: true, customisations: [{ label: "Sauce", options: [{ name: "BBQ", extraCost: 0 }, { name: "Buffalo", extraCost: 0 }, { name: "Honey Garlic", extraCost: 0 }] }] }
  ],
  kilimanjaro_ikeja: [
    { name: "Jollof Rice & Chicken", description: "Party jollof with grilled chicken", price: 3500, category: "Rice", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400", available: true, customisations: [{ label: "Protein", options: [{ name: "Chicken", extraCost: 0 }, { name: "Fish", extraCost: 500 }, { name: "Beef", extraCost: 300 }] }] },
    { name: "Egusi Soup", description: "Rich egusi with assorted meat and stockfish", price: 4200, category: "Soups", imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", available: true, customisations: [{ label: "Swallow", options: [{ name: "Eba", extraCost: 0 }, { name: "Pounded Yam", extraCost: 200 }, { name: "Amala", extraCost: 0 }] }] },
    { name: "Suya Platter", description: "Spiced beef suya with onions and tomatoes", price: 5500, category: "Grills", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400", available: true, customisations: [] },
    { name: "Pepper Soup", description: "Spicy catfish pepper soup", price: 4800, category: "Soups", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", available: true, customisations: [{ label: "Spice Level", options: [{ name: "Medium", extraCost: 0 }, { name: "Very Hot", extraCost: 0 }] }] }
  ],
  the_place_surulere: [
    { name: "Grilled Tilapia", description: "Whole tilapia with pepper sauce and plantain", price: 6500, category: "Seafood", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400", available: true, customisations: [{ label: "Sauce", options: [{ name: "Pepper Sauce", extraCost: 0 }, { name: "Tomato Sauce", extraCost: 0 }] }] },
    { name: "Fried Rice Combo", description: "Fried rice with chicken and moi moi", price: 4000, category: "Rice", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400", available: true, customisations: [] },
    { name: "Ofe Onugbu", description: "Bitter leaf soup with assorted meat", price: 4500, category: "Soups", imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", available: true, customisations: [{ label: "Swallow", options: [{ name: "Eba", extraCost: 0 }, { name: "Fufu", extraCost: 0 }, { name: "Pounded Yam", extraCost: 200 }] }] }
  ],
  ocean_basket_lekki: [
    { name: "Calamari Rings", description: "Crispy calamari with tartare sauce", price: 8500, category: "Starters", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400", available: true, customisations: [] },
    { name: "Grilled Prawns", description: "Tiger prawns with garlic butter and lemon", price: 14500, category: "Mains", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", available: true, customisations: [{ label: "Sides", options: [{ name: "Chips", extraCost: 0 }, { name: "Rice", extraCost: 0 }, { name: "Salad", extraCost: 0 }] }] },
    { name: "Fish & Chips", description: "Beer-battered hake with seasoned fries", price: 9800, category: "Mains", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400", available: true, customisations: [] }
  ]
};

// ─── Output instructions ──────────────────────────────────────────────────────

console.log("\nRestaurants to seed:");
restaurants.forEach((r) => console.log(`  • ${r.name} (${r.cuisine}) — ${r.isOpen ? "OPEN" : "CLOSED"}`));

console.log(`\nTotal restaurants: ${restaurants.length}`);
const totalItems = Object.values(menuItems).reduce((sum, items) => sum + items.length, 0);
console.log(`Total menu items: ${totalItems}`);

console.log("\n─".repeat(60));
console.log("To seed via Firebase Admin SDK, run:");
console.log("  node scripts/seed-external-restaurants.mjs --write");
console.log("\nOr use the Firebase Console to import the following JSON:");
console.log("\nexternal_restaurants collection:");
console.log(JSON.stringify(restaurants.slice(0, 2), null, 2));
console.log("\n... (truncated — full data in script)");

// ─── Write mode ───────────────────────────────────────────────────────────────

if (process.argv.includes("--write")) {
  try {
    const { initializeApp, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))
      : null;

    if (!serviceAccount) {
      console.error("\nERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.");
      process.exit(1);
    }

    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log("\nWriting to Firestore...");

    for (const restaurant of restaurants) {
      const { id, ...data } = restaurant;
      await db.collection("external_restaurants").doc(id).set(data);
      console.log(`  ✓ ${restaurant.name}`);

      const items = menuItems[id] ?? [];
      for (const item of items) {
        await db.collection("external_menu_items").add({ ...item, restaurantId: id });
      }
      if (items.length > 0) console.log(`    └─ ${items.length} menu items`);
    }

    console.log("\n✅ Seed complete.");
  } catch (err) {
    console.error("\nSeed failed:", err.message);
    process.exit(1);
  }
}
