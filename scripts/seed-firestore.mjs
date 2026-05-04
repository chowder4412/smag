// scripts/seed-firestore.mjs
// Run: node scripts/seed-firestore.mjs
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Uses Application Default Credentials (firebase CLI login)
if (!getApps().length) {
  initializeApp({ projectId: "smag-12fe9" });
}

const db = getFirestore();

const menuItems = [
  {
    id: "burrata",
    name: "Burrata di Puglia",
    description: "Creamy burrata with heirloom tomatoes, basil pesto and aged balsamic.",
    price: 18500,
    category: "Appetizers",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0qOKoHqMsh99VJhXCeCst5SaPHT2_b-qgRJJL8LWk0PxgRvDqLsdt01RVWGrpa15cmgCzpsmkxeEZjJgJY_qXQNkOO3naOil9KZMJfwU4JsYsIjajITjnb82Qsir6zU0ua9QM6GLDPr7QXZjnBgv8-SZdcwFbpPUU9B7t_KRQtyvrouIWn9YJ-HyulZBBUHYFpVozfp_vNILn0x7Mnk5KYqelbCyoOUiK-pERwECzQA8_Ig3BRI8WBPpHAMAk8eNspRb1AvCBp9Nj",
    available: true,
    restaurantId: "lartiste"
  },
  {
    id: "scallops",
    name: "Pan-Seared Scallops",
    description: "Hokkaido scallops with pea puree and pancetta soil.",
    price: 22000,
    category: "Appetizers",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9G2YarreYdBkSc_DEkLtBysdSu0YDQamPvHEz11eSZ4-x39iwGEYBs-1sajhVOrVPg6ozDHI2WuM0egFDolwSnwXTR-k2jlCEqfZpa2ihy9DRmOigOcEo9k0F2XKKF2HZSbFz8PAsva1rqla02ogsXQU5vqgnR1bZamqEnw7eJkMWAkoxMlujDRQIYr9sgXB-K5yE1Df5iBX4CTpgnk3uqBCEy8VIdycgh7vqTGEcyf6brAbEY_39-HRGsEiyRn8nzPDx3gvvvpap",
    available: true,
    restaurantId: "lartiste"
  },
  {
    id: "wagyu",
    name: "The Truffle Wagyu",
    description: "Double-aged wagyu beef, black truffle aioli and aged gruyere on a charcoal-infused bun.",
    price: 24500,
    category: "Main Course",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWOHLD5Nups6r9qw5qra--OVwW76VlM_6hu2LxYMiBaw0H64XQ7UmJNcgDLjA0uTcHkDZ9V3wnQUf0YEcAN0xMfEmepODlV4MNpZhdW0KX-4ik6HaO88UmzZAnz9QYPjPgopqzPxhWocOp0uuthLTORIIfibyeg5xdy-5LJsONLYAZYMHnvZo0Op3tVkQtt56iOm6i9sA7ueDLB-mb2WOMZtFNyj42QAIohidoMnXHSNQ0FoXwKpnaU7nmVm6gWXkWFrsvy-f6QXzB",
    available: true,
    restaurantId: "lartiste"
  },
  {
    id: "margherita",
    name: "Heirloom Margherita",
    description: "San Marzano tomatoes, buffalo mozzarella and extra virgin olive oil.",
    price: 18500,
    category: "Pizzas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-3O621cHBTCUg7WKzScZDG9dmdLmSdbFPGPsIKJ1q3OJy1jzIHDVIXcQ0IoORkyTCXenmOtZYgfkiVMLFXPgkt7e0hY2KQ5xgCKtPfuiVN_5v1QLBAC5dXhq1-JEORIqCE8RwA6SkPMktwb83HYufs36ZtVTekVuq1whVsAo8DVyAD9NrnGcb1sBWzvQY2ibo75_alOuxdyhJiXr0V8QVHjSg9vR5mthKfRp3yP02SolwgY-BXsg5UWe-IwG4H_i3oCdmMtABhq44",
    available: true,
    restaurantId: "luigi"
  },
  {
    id: "diavola",
    name: "Spicy Honey Diavola",
    description: "Spicy salami, Calabrian chili, hot honey.",
    price: 21000,
    category: "Pizzas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwAJ3sy0lie3PRQO0cH1_-QNpmjhPPb_Z3KsUCa-hpMKqX3sIjBRdZbQZWsOrAWuf1oRqwrPApKJ__2fov2mu3kjSGY48wSmgJZIDtYiEo_PgoiErfKcYiH50N7jk3gnpOXjUc6PDHIJOENSJcHZdlfk2xBbhtfV2KJNgjfg8-VfNRMNyw3X8fLK5i4aZpYcDz_c2POPhRcYZlPQOt-kme-HFDTqiafhu20OgZmJclLfDso0GTRfTM3skBhZV-gzAiIPqPJSx4dFGL",
    available: true,
    restaurantId: "luigi"
  },
  {
    id: "poke",
    name: "Wild Salmon Poke Bowl",
    description: "Fresh salmon, edamame, mango salsa and sesame dressing.",
    price: 18500,
    category: "Healthy",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8DPRc_MITuKljSZXM4NsBOjJgRK0t9s7bWD7BYy-kItNdml6iABjHm4L_N4VZ1sk4yA2BT2O3cYVZpM2-YeR5MTKYDbR7KuqgzRwbKrF2RoWQhto3n0t1OSBmJZUVZuPGDt6fSQr24mCA3WgM2-RcdtGHkMMhUlfCZkRVlVx_SD-7Oz0asHPHuIXTTlisuJb9RardMiK7-x26HzDs1sSKWEw6Yru3gvyBGUaYcvdNGH0pq3buvHLpw7_zuLH0aBEoXZGREHB_rAqa",
    available: true,
    restaurantId: "ocean_garden"
  }
];

async function seed() {
  console.log("Seeding menu_items...");
  const batch = db.batch();
  for (const item of menuItems) {
    const ref = db.collection("menu_items").doc(item.id);
    batch.set(ref, item, { merge: true });
  }
  await batch.commit();
  console.log(`✅ Seeded ${menuItems.length} menu items.`);
}

seed().catch(console.error);
