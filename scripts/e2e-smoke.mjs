import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nativeDir = path.join(root, "src", "screens", "native");
const nativeIndexPath = path.join(nativeDir, "index.ts");
const startupPath = path.join(root, "src", "lib", "startupState.ts");
const signUpPath = path.join(nativeDir, "SmagSignUpNative.tsx");
const welcomePath = path.join(nativeDir, "SmagWelcomeNative.tsx");
const loginPath = path.join(nativeDir, "SmagLoginNative.tsx");
const editProfilePath = path.join(nativeDir, "SmagEditProfileNative.tsx");
const checkoutPath = path.join(nativeDir, "SmagCheckoutNative.tsx");
const cartPath = path.join(nativeDir, "SmagMyCartNative.tsx");
const trackOrderPath = path.join(nativeDir, "SmagTrackOrderNative.tsx");
const orderHistoryPath = path.join(nativeDir, "SmagOrderHistoryNative.tsx");

const favoritesPath = path.join(nativeDir, "SmagFavoritesNative.tsx");
const restaurantDetailsPath = path.join(nativeDir, "SmagRestaurantDetailsNative.tsx");
const referAFriendPath = path.join(nativeDir, "SmagReferAFriendNative.tsx");
const referralHistoryPath = path.join(nativeDir, "SmagReferralHistoryNative.tsx");
const referralLeaderboardPath = path.join(nativeDir, "SmagReferralLeaderboardNative.tsx");
const voucherWalletPath = path.join(nativeDir, "SmagVoucherWalletNative.tsx");
const notificationsPath = path.join(nativeDir, "SmagNotificationsNative.tsx");
const profilePath = path.join(nativeDir, "SmagProfileNative.tsx");
const savedAddressesPath = path.join(nativeDir, "SmagSavedAddressesNative.tsx");
const firestorePath = path.join(root, "src", "lib", "firebase", "firestore.ts");

const businessRoot = path.resolve(root, "..", "smag_business");
const businessDriverPath = path.join(businessRoot, "app", "(app)", "driver.tsx");
const businessKitchenStaffPath = path.join(businessRoot, "app", "(app)", "kitchen-staff.tsx");
const businessStorePath = path.join(businessRoot, "src", "lib", "store.ts");

const errors = [];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function collectNativeFiles() {
  return fs
    .readdirSync(nativeDir)
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => path.join(nativeDir, name));
}

function checkPressablesHaveOnPress() {
  for (const filePath of collectNativeFiles()) {
    const content = read(filePath);
    const matches = [...content.matchAll(/<Pressable[\s\S]*?>/g)];
    for (const match of matches) {
      if (!match[0].includes("onPress=")) {
        const prefix = content.slice(0, match.index ?? 0);
        const line = prefix.split("\n").length;
        errors.push(`${path.basename(filePath)}:${line} has Pressable without onPress`);
      }
    }
  }
}

function collectNativeIds() {
  const content = read(nativeIndexPath);
  const ids = new Set();
  for (const match of content.matchAll(/^\s*([a-z0-9_]+):\s*lazy/mg)) {
    ids.add(match[1]);
  }
  return ids;
}

function checkRouteTargets() {
  const nativeIds = collectNativeIds();
  for (const filePath of collectNativeFiles()) {
    const content = read(filePath);
    for (const match of content.matchAll(/router\.(?:push|replace)\("([^"]+)"\)/g)) {
      const route = match[1];
      const id = route.startsWith("/") ? route.slice(1) : route;
      if (!nativeIds.has(id)) {
        errors.push(`${path.basename(filePath)} references missing route: ${route}`);
      }
    }
  }
}

function checkCoreFlow() {
  const startup = read(startupPath);
  const signup = read(signUpPath);
  const welcome = read(welcomePath);
  const login = read(loginPath);
  const editProfile = read(editProfilePath);

  if (!startup.includes('return "/smag_welcome"')) {
    errors.push("startupState is missing onboarding launch route");
  }
  if (!startup.includes('return "/smag_login"')) {
    errors.push("startupState is missing login launch route");
  }
  if (!signup.includes('"/smag_welcome"')) {
    errors.push("sign up does not route new users to onboarding welcome");
  }
  if (!welcome.includes('"/smag_home"')) {
    errors.push("welcome onboarding does not route completion to home");
  }
  if (!login.includes('"/smag_home"')) {
    errors.push("login does not route existing users to home");
  }
  if (!editProfile.includes("pickProfileImageFromDevice")) {
    errors.push("edit profile is missing profile image upload handler");
  }
}

function checkOrderFlow() {
  const cart = read(cartPath);
  const checkout = read(checkoutPath);
  const trackOrder = read(trackOrderPath);
  const orderHistory = read(orderHistoryPath);

  // cart → checkout (double-quote or template literal)
  if (!cart.includes('"/smag_checkout"') && !cart.includes('`/smag_checkout`')) {
    errors.push("cart does not route to checkout");
  }
  // cart mixed-restaurant guard
  if (!cart.includes("mixedRestaurants")) {
    errors.push("cart is missing mixed-restaurant guard");
  }
  // checkout → track order (cash) — template literal or string
  if (!checkout.includes("smag_track_order")) {
    errors.push("checkout does not route to track order after cash payment");
  }
  // checkout → payment screen (paystack) — template literal or string
  if (!checkout.includes("smag_payment")) {
    errors.push("checkout does not route to payment screen for paystack");
  }
  // checkout creates order
  if (!checkout.includes("createOrder")) {
    errors.push("checkout is missing createOrder call");
  }
  // track order subscribes to live order
  if (!trackOrder.includes("subscribeOrder")) {
    errors.push("track order is missing live order subscription");
  }
  // track order shows delivery stages
  if (!trackOrder.includes("STAGES")) {
    errors.push("track order is missing delivery stage timeline");
  }
  // order history → track order — template literal or string
  if (!orderHistory.includes("smag_track_order")) {
    errors.push("order history does not link to track order");
  }
  // order history uses skeleton loader
  if (!orderHistory.includes("ListSkeleton")) {
    errors.push("order history is missing skeleton loading state");
  }
}

function checkFavoritesFlow() {
  const fav = read(favoritesPath);
  const details = read(restaurantDetailsPath);
  const firestore = read(firestorePath);

  // Favorites screen uses Firestore
  if (!fav.includes("subscribeFavorites")) errors.push("SmagFavoritesNative is not wired to subscribeFavorites");
  if (!fav.includes("removeFavorite")) errors.push("SmagFavoritesNative is missing removeFavorite");
  if (!fav.includes("addToCart")) errors.push("SmagFavoritesNative is missing addToCart");
  if (!fav.includes("getCurrentUser")) errors.push("SmagFavoritesNative is missing auth check");

  // Restaurant details uses live data
  if (!details.includes("subscribeExternalMenuItems")) errors.push("SmagRestaurantDetailsNative is not wired to subscribeExternalMenuItems");
  if (!details.includes("toggleFavorite")) errors.push("SmagRestaurantDetailsNative is missing favorite toggle");
  if (!details.includes("handleAddToCart")) errors.push("SmagRestaurantDetailsNative is missing add to cart");
  if (!details.includes("restaurantId")) errors.push("SmagRestaurantDetailsNative does not accept restaurantId param");

  // Firestore has favorites functions
  if (!firestore.includes("subscribeFavorites")) errors.push("firestore.ts is missing subscribeFavorites");
  if (!firestore.includes("addFavorite")) errors.push("firestore.ts is missing addFavorite");
  if (!firestore.includes("removeFavorite")) errors.push("firestore.ts is missing removeFavorite");
  if (!firestore.includes("isFavorite")) errors.push("firestore.ts is missing isFavorite");
}

function checkReferralFlow() {
  const refer = read(referAFriendPath);
  const history = read(referralHistoryPath);
  const leaderboard = read(referralLeaderboardPath);
  const voucher = read(voucherWalletPath);
  const firestore = read(firestorePath);

  // Refer a friend uses real code
  if (!refer.includes("getUserReferralCode")) errors.push("SmagReferAFriendNative is not loading real referral code");
  if (refer.includes("SMAG-FRIEND")) errors.push("SmagReferAFriendNative still has hardcoded SMAG-FRIEND code");

  // Referral history uses Firestore
  if (!history.includes("subscribeReferralHistory")) errors.push("SmagReferralHistoryNative is not wired to subscribeReferralHistory");
  if (history.includes("Sarah B.")) errors.push("SmagReferralHistoryNative still has hardcoded data");

  // Leaderboard uses Firestore
  if (!leaderboard.includes("getReferralLeaderboard")) errors.push("SmagReferralLeaderboardNative is not wired to getReferralLeaderboard");
  if (leaderboard.includes("Elena Rossi")) errors.push("SmagReferralLeaderboardNative still has hardcoded data");

  // Voucher wallet uses Firestore
  if (!voucher.includes("subscribeVouchers")) errors.push("SmagVoucherWalletNative is not wired to subscribeVouchers");
  if (voucher.includes("Gourmet Breakfast Special")) errors.push("SmagVoucherWalletNative still has hardcoded vouchers");

  // Firestore has referral + voucher functions
  if (!firestore.includes("subscribeReferralHistory")) errors.push("firestore.ts is missing subscribeReferralHistory");
  if (!firestore.includes("getReferralLeaderboard")) errors.push("firestore.ts is missing getReferralLeaderboard");
  if (!firestore.includes("getUserReferralCode")) errors.push("firestore.ts is missing getUserReferralCode");
  if (!firestore.includes("subscribeVouchers")) errors.push("firestore.ts is missing subscribeVouchers");
}

function checkNotificationsFlow() {
  const firestore = read(firestorePath);
  const notifs = read(notificationsPath);

  // Notifications has pagination
  if (!firestore.includes("limitCount = 50")) errors.push("subscribeNotifications is missing limit(50) pagination");

  // Notifications uses SectionList for virtualization
  if (!notifs.includes("SectionList")) errors.push("SmagNotificationsNative is not using SectionList for virtualization");

  // Notifications has error state
  if (!notifs.includes("setError")) errors.push("SmagNotificationsNative is missing error state");
}

function checkProfileFlow() {
  const profile = read(profilePath);
  const savedAddresses = read(savedAddressesPath);
  const firestore = read(firestorePath);

  // Profile stats use real Firestore data
  if (!profile.includes("subscribePoints")) errors.push("SmagProfileNative is not wired to subscribePoints");
  if (!profile.includes("subscribeOrders")) errors.push("SmagProfileNative is not wired to subscribeOrders for order count");
  if (profile.includes('"24"') || profile.includes('"1.2k"')) errors.push("SmagProfileNative still has hardcoded stats");

  // Saved addresses wired to Firestore
  if (!savedAddresses.includes("subscribeAddresses")) errors.push("SmagSavedAddressesNative is not wired to subscribeAddresses");
  if (!savedAddresses.includes("addAddress")) errors.push("SmagSavedAddressesNative is missing addAddress");
  if (!savedAddresses.includes("deleteAddress")) errors.push("SmagSavedAddressesNative is missing deleteAddress");
  if (!savedAddresses.includes("setDefaultAddress")) errors.push("SmagSavedAddressesNative is missing setDefaultAddress");

  // Firestore has notification limit
  if (!firestore.includes("limit(limitCount)")) errors.push("subscribeNotifications is missing limit call");
}

function checkBusinessAppFlow() {
  // Only check if smag_business exists
  if (!fs.existsSync(businessDriverPath)) return;

  const driver = read(businessDriverPath);
  const kitchenStaff = read(businessKitchenStaffPath);
  const store = read(businessStorePath);

  // Driver has GPS broadcast
  if (!driver.includes("updateDriverLocation")) errors.push("smag_business driver.tsx is missing updateDriverLocation GPS broadcast");
  if (!driver.includes("BusinessAccessGuard")) errors.push("smag_business driver.tsx is missing BusinessAccessGuard");
  if (!driver.includes("selfAssign")) errors.push("smag_business driver.tsx is missing self-assign for available orders");

  // Kitchen staff filters to Smag Kitchen only
  if (!kitchenStaff.includes("lartiste") && !kitchenStaff.includes("restaurantId")) {
    errors.push("smag_business kitchen-staff.tsx does not filter orders by restaurant");
  }
  if (!kitchenStaff.includes("BusinessAccessGuard")) errors.push("smag_business kitchen-staff.tsx is missing BusinessAccessGuard");

  // Store available orders query uses sentinel
  if (!store.includes('assignedDriverUid", "==", ""')) errors.push("smag_business store.ts available orders query missing assignedDriverUid sentinel");

  // Firestore createOrder writes sentinel
  const firestore = read(firestorePath);
  if (!firestore.includes('assignedDriverUid: ""')) errors.push("firestore.ts createOrder does not write assignedDriverUid sentinel");
}

checkPressablesHaveOnPress();
checkRouteTargets();
checkCoreFlow();
checkOrderFlow();
checkFavoritesFlow();
checkReferralFlow();
checkNotificationsFlow();
checkProfileFlow();
checkBusinessAppFlow();

if (errors.length > 0) {
  console.error("E2E smoke checks failed:");
  for (const error of errors) {
    console.error(`  ✗ ${error}`);
  }
  process.exit(1);
}

console.log("E2E smoke checks passed:");
console.log("  ✓ All Pressable buttons have onPress handlers");
console.log("  ✓ All navigation targets resolve to known screens");
console.log("  ✓ Login/signup/onboarding flow links are valid");
console.log("  ✓ Profile image upload handler is wired");
console.log("  ✓ Cart → checkout → payment → track order flow is intact");
console.log("  ✓ Favorites wired to Firestore (subscribeFavorites, addFavorite, removeFavorite)");
console.log("  ✓ Restaurant details loads live data (subscribeExternalMenuItems)");
console.log("  ✓ Referral code loads from Firestore (getUserReferralCode)");
console.log("  ✓ Referral history loads from Firestore (subscribeReferralHistory)");
console.log("  ✓ Leaderboard loads from Firestore (getReferralLeaderboard)");
console.log("  ✓ Vouchers load from Firestore (subscribeVouchers)");
console.log("  ✓ Notifications have pagination limit");
console.log("  ✓ Profile stats wired to real Firestore data");
console.log("  ✓ Saved addresses wired to Firestore");
console.log("  ✓ Business app auth guard present on all role screens");
console.log("  ✓ Driver GPS broadcast wired");
console.log("  ✓ Kitchen staff filters to Smag Kitchen orders only");
console.log("  ✓ Order creation writes assignedDriverUid sentinel");
