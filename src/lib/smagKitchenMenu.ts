/**
 * Single source of truth for all Smag Kitchen dishes.
 * Imported by both SmagExploreNative and SmagMenuNative.
 */

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=92`;

export type MealDish = {
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
};

export type MealCategory = {
  label: string;
  emoji: string;
  icon: "wb-sunny" | "lunch-dining" | "dinner-dining" | "cake";
  dishes: MealDish[];
};

export type CustomOption = {
  value: string;
  detail: string;
  extraCost: number;
};

export type CustomGroup = {
  key: string;
  label: string;
  options: CustomOption[];
};

// ─── Shared image helpers ─────────────────────────────────────────────────────

const SPICE_OPTIONS: CustomOption[] = [
  { value: "No pepper", detail: "Clean flavour, no added chilli heat", extraCost: 0 },
  { value: "Classic spicy", detail: "Balanced Nigerian heat", extraCost: 0 },
  { value: "Extra spicy", detail: "Extra pepper sauce on the side", extraCost: 500 }
];

const PACKAGING_OPTIONS: CustomOption[] = [
  { value: "Standard sealed pack", detail: "Neat take-away pack", extraCost: 0 },
  { value: "Executive bowl", detail: "Premium 1,000ml sealed bowl with lid", extraCost: 1000 },
  { value: "Thermal VIP box", detail: "Insulated packaging for longer heat retention", extraCost: 1800 }
];

function dishStyleOptions(dish: MealDish, categoryLabel: string): CustomOption[] {
  const name = dish.name.toLowerCase();
  if (name.includes("jollof")) {
    return [
      { value: "Smoky party jollof", detail: "Classic firewood-style Nigerian jollof", extraCost: 0 },
      { value: "Coconut jollof", detail: "Finished with coconut milk and herbs", extraCost: 900 },
      { value: "Native jollof", detail: "Palm oil base with smoked fish notes", extraCost: 700 }
    ];
  }
  if (name.includes("yam")) {
    return [
      { value: "Boiled yam", detail: "Soft yam slices with tomato egg sauce", extraCost: 0 },
      { value: "Fried yam", detail: "Crisp golden yam wedges", extraCost: 700 },
      { value: "Extra egg sauce", detail: "Double tomato egg sauce portion", extraCost: 900 }
    ];
  }
  if (name.includes("soup") || name.includes("eba") || name.includes("fufu") || name.includes("amala")) {
    return [
      { value: "Regular swallow", detail: "Chef-selected matching swallow", extraCost: 0 },
      { value: "Extra swallow", detail: "Larger swallow portion", extraCost: 800 },
      { value: "Assorted protein", detail: "Extra meat, fish and stockfish garnish", extraCost: 1800 }
    ];
  }
  if (categoryLabel === "Dessert") {
    return [
      { value: "Classic serving", detail: "Standard dessert portion", extraCost: 0 },
      { value: "Premium topping", detail: "Fruit, syrup or house crumble finish", extraCost: 900 },
      { value: "Celebration box", detail: "Gift-ready dessert packaging", extraCost: 1500 }
    ];
  }
  return [
    { value: "Signature regular", detail: "Chef's standard serving", extraCost: 0 },
    { value: "Protein boost", detail: "Extra chicken, fish or beef pairing", extraCost: 1500 },
    { value: "Executive combo", detail: "Larger serving with house side", extraCost: 2500 }
  ];
}

export function customGroupsForDish(dish: MealDish, categoryLabel: string): CustomGroup[] {
  return [
    { key: "spice", label: "Spice preference", options: SPICE_OPTIONS },
    { key: "style", label: "Meal style", options: dishStyleOptions(dish, categoryLabel) },
    { key: "packaging", label: "Packaging", options: PACKAGING_OPTIONS }
  ];
}

export function menuItemIdForDish(name: string) {
  return `smag-kitchen-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

// ─── The 36 Smag Kitchen dishes ───────────────────────────────────────────────

export const SMAG_KITCHEN_CATEGORIES: MealCategory[] = [
  {
    label: "Breakfast",
    emoji: "☀️",
    icon: "wb-sunny",
    dishes: [
      {
        name: "Akara & Ogi",
        description: "Crispy bean cakes served with smooth warm pap. A classic Nigerian morning staple.",
        price: "₦2,500", priceValue: 2500,
        image: u("photo-1665833613236-7c1d087463b1"),
        badge: "Bestseller"
      },
      {
        name: "Moi Moi",
        description: "Steamed bean pudding with peppers, onions and fish. Rich, soft and filling.",
        price: "₦2,800", priceValue: 2800,
        image: u("photo-1661588669110-81142a5b9e57")
      },
      {
        name: "Fried Plantain & Eggs",
        description: "Golden sweet plantain paired with fluffy scrambled eggs. A beloved Nigerian breakfast combo.",
        price: "₦3,200", priceValue: 3200,
        image: u("photo-1664993101841-036f189719b6"),
        badge: "Popular"
      },
      {
        name: "Yam & Egg Sauce",
        description: "Boiled or fried yam served with a spicy tomato and egg sauce. Hearty and satisfying.",
        price: "₦3,500", priceValue: 3500,
        image: u("photo-1604329756574-bda1f2cada6f")
      },
      {
        name: "Bread & Beans",
        description: "Soft Agege bread with slow-cooked honey beans in palm oil. A street food favourite.",
        price: "₦2,200", priceValue: 2200,
        image: u("flagged/photo-1579386471443-9efb1386486c")
      },
      {
        name: "Pap (Akamu)",
        description: "Smooth fermented corn porridge served warm. Light, nourishing and easy on the stomach.",
        price: "₦1,800", priceValue: 1800,
        image: u("photo-1520319888085-12744c760434")
      },
      {
        name: "Agege Bread & Butter",
        description: "Thick, soft Nigerian bread with creamy butter and a hot cup of tea. Simple morning comfort.",
        price: "₦1,500", priceValue: 1500,
        image: u("photo-1517433367423-c7e5b0f35086")
      },
      {
        name: "Indomie Noodles",
        description: "Stir-fried instant noodles with eggs, vegetables and peppers. Quick, tasty and loved by all.",
        price: "₦2,000", priceValue: 2000,
        image: u("photo-1569718212165-3a8278d5f624")
      },
      {
        name: "Boiled Yam & Egg Sauce",
        description: "Tender boiled yam served with fresh tomato egg sauce and peppers. A filling Nigerian breakfast.",
        price: "₦3,000", priceValue: 3000,
        image: u("photo-1604329756574-bda1f2cada6f")
      }
    ]
  },
  {
    label: "Lunch",
    emoji: "🍽️",
    icon: "lunch-dining",
    dishes: [
      {
        name: "Jollof Rice",
        description: "Nigeria's iconic smoky tomato rice cooked to perfection. Served with fried chicken and plantain.",
        price: "₦5,500", priceValue: 5500,
        image: u("photo-1665332195309-9d75071138f0"),
        badge: "🔥 Most Ordered"
      },
      {
        name: "Egusi Soup & Eba",
        description: "Ground melon seed soup with assorted meat and stockfish. Served with smooth eba.",
        price: "₦6,500", priceValue: 6500,
        image: u("photo-1604329760661-e71dc83f8f26"),
        badge: "Bestseller"
      },
      {
        name: "Pounded Yam & Ofe Onugbu",
        description: "Silky pounded yam with bitter leaf soup, assorted meat and crayfish. An Igbo classic.",
        price: "₦7,000", priceValue: 7000,
        image: u("photo-1604329760661-e71dc83f8f26")
      },
      {
        name: "Afang Soup & Fufu",
        description: "Afang leaves and waterleaf cooked with periwinkle and assorted meat. A Cross River delicacy.",
        price: "₦7,500", priceValue: 7500,
        image: u("photo-1604329760661-e71dc83f8f26")
      },
      {
        name: "Ofada Rice & Ayamase",
        description: "Local unpolished rice served with spicy green pepper stew and assorted offal. Bold and earthy.",
        price: "₦6,000", priceValue: 6000,
        image: u("photo-1665556899022-9761f95769e5"),
        badge: "Spicy 🌶"
      },
      {
        name: "Efo Riro & Amala",
        description: "Rich Yoruba spinach stew with assorted meat, served with smooth dark amala.",
        price: "₦6,500", priceValue: 6500,
        image: u("photo-1604329760661-e71dc83f8f26")
      },
      {
        name: "Ogbono Soup & Eba",
        description: "Draw soup made from wild mango seeds with leafy greens and assorted protein.",
        price: "₦6,000", priceValue: 6000,
        image: u("photo-1763048443535-1243379234e2")
      },
      {
        name: "Fried Rice & Chicken",
        description: "Nigerian party-style fried rice with mixed vegetables, liver and crispy fried chicken.",
        price: "₦5,800", priceValue: 5800,
        image: u("photo-1583946193644-49fe1fe958cf"),
        badge: "Popular"
      },
      {
        name: "Suya & Yaji",
        description: "Skewered spiced beef grilled over open flame with onions, tomatoes and yaji spice mix.",
        price: "₦4,500", priceValue: 4500,
        image: u("photo-1664992960082-0ea299a9c53e"),
        badge: "Spicy 🌶"
      }
    ]
  },
  {
    label: "Dinner",
    emoji: "🌙",
    icon: "dinner-dining",
    dishes: [
      {
        name: "Asun (Peppered Goat)",
        description: "Smoky grilled goat meat tossed in a fiery pepper sauce. A Nigerian party night essential.",
        price: "₦8,500", priceValue: 8500,
        image: u("photo-1544025162-d76694265947"),
        badge: "🔥 Chef's Pick"
      },
      {
        name: "Nkwobi",
        description: "Spiced cow foot in a rich palm oil and utazi leaf sauce. A bold Igbo evening delicacy.",
        price: "₦9,000", priceValue: 9000,
        image: u("photo-1763048443535-1243379234e2")
      },
      {
        name: "Isi Ewu",
        description: "Spiced goat head in a pungent palm oil sauce with utazi. A true Igbo delicacy.",
        price: "₦10,000", priceValue: 10000,
        image: u("photo-1544025162-d76694265947")
      },
      {
        name: "Catfish Pepper Soup",
        description: "Fresh catfish in a light, aromatic pepper soup broth with scent leaves. Deeply warming.",
        price: "₦7,500", priceValue: 7500,
        image: u("photo-1665332195309-9d75071138f0"),
        badge: "Bestseller"
      },
      {
        name: "Edikang Ikong & Fufu",
        description: "Nutrient-rich waterleaf and ugwu soup with periwinkle and assorted meat. A Calabar treasure.",
        price: "₦8,000", priceValue: 8000,
        image: u("photo-1604329760661-e71dc83f8f26")
      },
      {
        name: "Boli & Groundnut",
        description: "Roasted plantain served with spiced groundnuts. A simple, smoky Lagos street dinner.",
        price: "₦2,500", priceValue: 2500,
        image: u("photo-1664993101841-036f189719b6")
      },
      {
        name: "Grilled Tilapia & Chips",
        description: "Whole tilapia marinated in peppers and spices, grilled and served with crispy chips.",
        price: "₦9,500", priceValue: 9500,
        image: u("photo-1665332195309-9d75071138f0"),
        badge: "Popular"
      },
      {
        name: "Oxtail Stew & Rice",
        description: "Slow-braised oxtail in a rich tomato stew served over steamed white rice.",
        price: "₦12,000", priceValue: 12000,
        image: u("photo-1544025162-d76694265947")
      },
      {
        name: "Chicken & Mushroom Pizza",
        description: "Hand-stretched pizza topped with chicken, mushrooms, tomato sauce and melted mozzarella.",
        price: "₦22,000", priceValue: 22000,
        image: u("photo-1565299624946-b28f40a0ae38")
      },
      {
        name: "Sushi Platter",
        description: "Chef's selection of nigiri, maki and sashimi with wasabi, ginger and soy sauce.",
        price: "₦18,500", priceValue: 18500,
        image: u("photo-1579871494447-9811cf80d66c")
      }
    ]
  },
  {
    label: "Dessert",
    emoji: "🎂",
    icon: "cake",
    dishes: [
      {
        name: "Chin Chin",
        description: "Crunchy fried dough snacks lightly sweetened and spiced. Nigeria's favourite crunchy treat.",
        price: "₦1,500", priceValue: 1500,
        image: u("photo-1665554837563-3782d21a676b"),
        badge: "Bestseller"
      },
      {
        name: "Puff Puff",
        description: "Soft, pillowy deep-fried dough balls dusted with sugar. Warm, fluffy and irresistible.",
        price: "₦1,800", priceValue: 1800,
        image: u("photo-1665833613236-7c1d087463b1")
      },
      {
        name: "Coconut Candy",
        description: "Chewy caramelised coconut sweets with a hint of ginger. A nostalgic Nigerian confection.",
        price: "₦1,200", priceValue: 1200,
        image: u("photo-1776722090281-a6aef6ea3083")
      },
      {
        name: "Zobo Chiller",
        description: "Chilled hibiscus drink with ginger and cloves. Refreshing and uniquely Nigerian.",
        price: "₦2,500", priceValue: 2500,
        image: u("photo-1488900128323-21503983a07e")
      },
      {
        name: "Waffles & Syrup",
        description: "Crispy golden waffles drizzled with maple syrup, fresh berries and whipped cream.",
        price: "₦4,500", priceValue: 4500,
        image: u("photo-1562376552-0d160a2f238d"),
        badge: "Popular"
      },
      {
        name: "Pancakes",
        description: "Fluffy stacked pancakes with butter, syrup and seasonal fruit. A sweet finish to any meal.",
        price: "₦4,000", priceValue: 4000,
        image: u("photo-1567620905732-2d1ec7ab7445")
      },
      {
        name: "Cakes & Pastries",
        description: "Freshly baked layered cakes and pastries from our in-house patisserie. Indulge yourself.",
        price: "₦5,500", priceValue: 5500,
        image: u("photo-1578985545062-69928b1d9587")
      },
      {
        name: "Gourmet Burger",
        description: "Smashed beef patty with caramelised onions, aged cheddar and house sauce in a brioche bun.",
        price: "₦8,500", priceValue: 8500,
        image: u("photo-1568901346375-23c9450c58cd"),
        badge: "🔥 Chef's Pick"
      },
      {
        name: "Ice Cream",
        description: "Artisan scoops in flavours of vanilla bean, dark chocolate and mango sorbet.",
        price: "₦3,500", priceValue: 3500,
        image: u("photo-1497034825429-c343d7c6a68f")
      }
    ]
  }
];

/** Chef's Picks — hand-selected highlights shown as the first section in Menu */
export const CHEFS_PICKS: MealDish[] = [
  SMAG_KITCHEN_CATEGORIES[1].dishes[0], // Jollof Rice
  SMAG_KITCHEN_CATEGORIES[2].dishes[0], // Asun
  SMAG_KITCHEN_CATEGORIES[3].dishes[7], // Gourmet Burger
  SMAG_KITCHEN_CATEGORIES[2].dishes[3], // Catfish Pepper Soup
  SMAG_KITCHEN_CATEGORIES[3].dishes[4], // Waffles & Syrup
];
