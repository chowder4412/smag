#!/usr/bin/env node
/**
 * Seed menu items to Firestore (run once for dev/staging environments)
 * Usage: node scripts/seed-menu.mjs
 */

const MENU_ITEMS = [
  {
    name: "Burrata di Puglia",
    description: "Creamy burrata with heirloom tomatoes, basil pesto and aged balsamic.",
    price: 18500,
    category: "Appetizers",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0qOKoHqMsh99VJhXCeCst5SaPHT2_b-qgRJJL8LWk0PxgRvDqLsdt01RVWGrpa15cmgCzpsmkxeEZjJgJY_qXQNkOO3naOil9KZMJfwU4JsYsIjajITjnb82Qsir6zU0ua9QM6GLDPr7QXZjnBgv8-SZdcwFbpPUU9B7t_KRQtyvrouIWn9YJ-HyulZBBUHYFpVozfp_vNILn0x7Mnk5KYqelbCyoOUiK-pERwECzQA8_Ig3BRI8WBPpHAMAk8eNspRb1AvCBp9Nj",
    available: true,
    restaurantId: "lartiste"
  },
  {
    name: "Pan-Seared Scallops",
    description: "Hokkaido scallops with pea puree and pancetta soil.",
    price: 22000,
    category: "Appetizers",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9G2YarreYdBkSc_DEkLtBysdSu0YDQamPvHEz11eSZ4-x39iwGEYBs-1sajhVOrVPg6ozDHI2WuM0egFDolwSnwXTR-k2jlCEqfZpa2ihy9DRmOigOcEo9k0F2XKKF2HZSbFz8PAsva1rqla02ogsXQU5vqgnR1bZamqEnw7eJkMWAkoxMlujDRQIYr9sgXB-K5yE1Df5iBX4CTpgnk3uqBCEy8VIdycgh7vqTGEcyf6brAbEY_39-HRGsEiyRn8nzPDx3gvvvpap",
    available: true,
    restaurantId: "lartiste"
  },
  {
    name: "The Truffle Wagyu",
    description: "Double-aged wagyu beef, black truffle aioli and aged gruyere on a charcoal-infused bun.",
    price: 24500,
    category: "Main Course",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWOHLD5Nups6r9qw5qra--OVwW76VlM_6hu2LxYMiBaw0H64XQ7UmJNcgDLjA0uTcHkDZ9V3wnQUf0YEcAN0xMfEmepODlV4MNpZhdW0KX-4ik6HaO88UmzZAnz9QYPjPgopqzPxhWocOp0uuthLTORIIfibyeg5xdy-5LJsONLYAZYMHnvZo0Op3tVkQtt56iOm6i9sA7ueDLB-mb2WOMZtFNyj42QAIohidoMnXHSNQ0FoXwKpnaU7nmVm6gWXkWFrsvy-f6QXzB",
    available: true,
    restaurantId: "lartiste"
  },
  {
    name: "Heirloom Margherita",
    description: "San Marzano tomatoes, buffalo mozzarella and extra virgin olive oil.",
    price: 18500,
    category: "Pizzas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-3O621cHBTCUg7WKzScZDG9dmdLmSdbFPGPsIKJ1q3OJy1jzIHDVIXcQ0IoORkyTCXenmOtZYgfkiVMLFXPgkt7e0hY2KQ5xgCKtPfuiVN_5v1QLBAC5dXhq1-JEORIqCE8RwA6SkPMktwb83HYufs36ZtVTekVuq1whVsAo8DVyAD9NrnGcb1sBWzvQY2ibo75_alOuxdyhJiXr0V8QVHjSg9vR5mthKfRp3yP02SolwgY-BXsg5UWe-IwG4H_i3oCdmMtABhq44",
    available: true,
    restaurantId: "luigi"
  },
  {
    name: "Spicy Honey Diavola",
    description: "Spicy salami, Calabrian chili, hot honey.",
    price: 21000,
    category: "Pizzas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwAJ3sy0lie3PRQO0cH1_-QNpmjhPPb_Z3KsUCa-hpMKqX3sIjBRdZbQZWsOrAWuf1oRqwrPApKJ__2fov2mu3kjSGY48wSmgJZIDtYiEo_PgoiErfKcYiH50N7jk3gnpOXjUc6PDHIJOENSJcHZdlfk2xBbhtfV2KJNgjfg8-VfNRMNyw3X8fLK5i4aZpYcDz_c2POPhRcYZlPQOt-kme-HFDTqiafhu20OgZmJclLfDso0GTRfTM3skBhZV-gzAiIPqPJSx4dFGL",
    available: true,
    restaurantId: "luigi"
  },
  {
    name: "Wild Salmon Poke Bowl",
    description: "Fresh salmon, edamame, mango salsa and sesame dressing.",
    price: 18500,
    category: "Healthy",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8DPRc_MITuKljSZXM4NsBOjJgRK0t9s7bWD7BYy-kItNdml6iABjHm4L_N4VZ1sk4yA2BT2O3cYVZpM2-YeR5MTKYDbR7KuqgzRwbKrF2RoWQhto3n0t1OSBmJZUVZuPGDt6fSQr24mCA3WgM2-RcdtGHkMMhUlfCZkRVlVx_SD-7Oz0asHPHuIXTTlisuJb9RardMiK7-x26HzDs1sSKWEw6Yru3gvyBGUaYcvdNGH0pq3buvHLpw7_zuLH0aBEoXZGREHB_rAqa",
    available: true,
    restaurantId: "ocean_garden"
  }
];

async function main() {
  const admin = await import("firebase-admin");
  const { readFileSync } = await import("fs");

  const serviceAccount = JSON.parse(
    readFileSync("./firebase/google-services.json", "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const menuRef = db.collection("menu_items");

  const existing = await menuRef.limit(1).get();
  if (!existing.empty) {
    console.log("✅ Menu items already exist. Skipping seed.");
    process.exit(0);
  }

  console.log(`📦 Seeding ${MENU_ITEMS.length} menu items...`);
  const batch = db.batch();
  MENU_ITEMS.forEach((item) => {
    const ref = menuRef.doc();
    batch.set(ref, item);
  });

  await batch.commit();
  console.log("✅ Menu seeded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
