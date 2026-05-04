export type ReferenceScreen = {
  id: string;
  folder: string;
  title: string;
  imagePath: string;
  imageBytes: number;
};

const SCREEN_META: ReferenceScreen[] = [
  { id: "smag_change_password", folder: "smag_change_password", title: "Change Password - Smag", imagePath: "smag_change_password/screen.png", imageBytes: 334613 },
  { id: "smag_checkout", folder: "smag_checkout", title: "Smag - Checkout", imagePath: "smag_checkout/screen.png", imageBytes: 116348 },
  { id: "smag_edit_profile", folder: "smag_edit_profile", title: "Edit Profile", imagePath: "smag_edit_profile/screen.png", imageBytes: 206577 },
  { id: "smag_explore", folder: "smag_explore", title: "Explore", imagePath: "smag_explore/screen.png", imageBytes: 430242 },
  { id: "smag_favorites", folder: "smag_favorites", title: "Smag - My Favorites", imagePath: "smag_favorites/screen.png", imageBytes: 273638 },
  { id: "smag_forgot_password", folder: "smag_forgot_password", title: "Forgot Password", imagePath: "smag_forgot_password/screen.png", imageBytes: 294052 },
  { id: "smag_home", folder: "smag_home", title: "Smag - Gourmet Delivery", imagePath: "smag_home/screen.png", imageBytes: 320855 },
  { id: "smag_login", folder: "smag_login", title: "Smag - Welcome", imagePath: "smag_login/screen.png", imageBytes: 475683 },
  { id: "smag_member_levels", folder: "smag_member_levels", title: "Member Levels", imagePath: "smag_member_levels/screen.png", imageBytes: 174540 },
  { id: "smag_membership_rewards", folder: "smag_membership_rewards", title: "Smag Membership Rewards", imagePath: "smag_membership_rewards/screen.png", imageBytes: 223603 },
  { id: "smag_menu", folder: "smag_menu", title: "Smag - Gourmet Menu", imagePath: "smag_menu/screen.png", imageBytes: 316382 },
  { id: "smag_my_cart", folder: "smag_my_cart", title: "My Cart", imagePath: "smag_my_cart/screen.png", imageBytes: 198432 },
  { id: "smag_notifications", folder: "smag_notifications", title: "Notifications", imagePath: "smag_notifications/screen.png", imageBytes: 145210 },
  { id: "smag_order_history", folder: "smag_order_history", title: "Order History", imagePath: "smag_order_history/screen.png", imageBytes: 189034 },
  { id: "smag_payment_methods", folder: "smag_payment_methods", title: "Payment Methods", imagePath: "smag_payment_methods/screen.png", imageBytes: 162890 },
  { id: "smag_profile", folder: "smag_profile", title: "Smag - Profile", imagePath: "smag_profile/screen.png", imageBytes: 201445 },
  { id: "smag_promotions_deals", folder: "smag_promotions_deals", title: "Promotions & Deals", imagePath: "smag_promotions_deals/screen.png", imageBytes: 178320 },
  { id: "smag_reset_link_sent", folder: "smag_reset_link_sent", title: "Reset Link Sent", imagePath: "smag_reset_link_sent/screen.png", imageBytes: 134560 },
  { id: "smag_restaurant_details", folder: "smag_restaurant_details", title: "Restaurant Details", imagePath: "smag_restaurant_details/screen.png", imageBytes: 312780 },
  { id: "smag_saved_addresses", folder: "smag_saved_addresses", title: "Saved Addresses", imagePath: "smag_saved_addresses/screen.png", imageBytes: 156230 },
  { id: "smag_settings", folder: "smag_settings", title: "Settings", imagePath: "smag_settings/screen.png", imageBytes: 143210 },
  { id: "smag_sign_up", folder: "smag_sign_up", title: "Sign Up - Smag", imagePath: "smag_sign_up/screen.png", imageBytes: 289450 },
  { id: "smag_phone_auth", folder: "smag_phone_auth", title: "Phone Sign-In", imagePath: "smag_phone_auth/screen.png", imageBytes: 0 },
  { id: "smag_support_help", folder: "smag_support_help", title: "Support & Help", imagePath: "smag_support_help/screen.png", imageBytes: 120000 },
  { id: "smag_track_order", folder: "smag_track_order", title: "Track Order", imagePath: "smag_track_order/screen.png", imageBytes: 198760 },
  { id: "smag_track_order_map", folder: "smag_track_order_map", title: "Track Order Map", imagePath: "smag_track_order_map/screen.png", imageBytes: 234560 },
  { id: "smag_welcome", folder: "smag_welcome", title: "Welcome - Smag", imagePath: "smag_welcome/screen.png", imageBytes: 267890 },
  { id: "tier_comparison", folder: "tier_comparison", title: "Tier Comparison", imagePath: "tier_comparison/screen.png", imageBytes: 189230 },
  { id: "smag_promo_details", folder: "smag_promo_details", title: "Promo Details", imagePath: "smag_promo_details/screen.png", imageBytes: 145000 },
  { id: "smag_rate_concierge", folder: "smag_rate_concierge", title: "Rate Concierge", imagePath: "smag_rate_concierge/screen.png", imageBytes: 130000 },
  { id: "smag_rate_your_experience", folder: "smag_rate_your_experience", title: "Rate Your Experience", imagePath: "smag_rate_your_experience/screen.png", imageBytes: 135000 },
  { id: "smag_refer_a_friend", folder: "smag_refer_a_friend", title: "Refer a Friend", imagePath: "smag_refer_a_friend/screen.png", imageBytes: 160000 },
  { id: "smag_referral_faq", folder: "smag_referral_faq", title: "Referral FAQ", imagePath: "smag_referral_faq/screen.png", imageBytes: 125000 },
  { id: "smag_referral_history", folder: "smag_referral_history", title: "Referral History", imagePath: "smag_referral_history/screen.png", imageBytes: 140000 },
  { id: "smag_referral_leaderboard", folder: "smag_referral_leaderboard", title: "Referral Leaderboard", imagePath: "smag_referral_leaderboard/screen.png", imageBytes: 155000 },
  { id: "smag_referral_terms", folder: "smag_referral_terms", title: "Referral Terms", imagePath: "smag_referral_terms/screen.png", imageBytes: 120000 },
  { id: "smag_rules_prizes", folder: "smag_rules_prizes", title: "Rules & Prizes", imagePath: "smag_rules_prizes/screen.png", imageBytes: 130000 },
  { id: "smag_voucher_wallet", folder: "smag_voucher_wallet", title: "Voucher Wallet", imagePath: "smag_voucher_wallet/screen.png", imageBytes: 145000 },
  { id: "smag_vip_support_chat", folder: "smag_vip_support_chat", title: "VIP Support Chat", imagePath: "smag_vip_support_chat/screen.png", imageBytes: 138000 },
  { id: "smag_payment", folder: "smag_payment", title: "Payment", imagePath: "smag_payment/screen.png", imageBytes: 0 },
  { id: "smag_receipt", folder: "smag_receipt", title: "Receipt", imagePath: "smag_receipt/screen.png", imageBytes: 0 },
  { id: "other_kitchens", folder: "other_kitchens", title: "Other Kitchens", imagePath: "other_kitchens/screen.png", imageBytes: 0 },
  { id: "other_kitchen_details", folder: "other_kitchen_details", title: "Kitchen Details", imagePath: "other_kitchen_details/screen.png", imageBytes: 0 }
];

export const screens: ReferenceScreen[] = SCREEN_META;

export function getScreenById(id?: string): ReferenceScreen | undefined {
  if (!id) return undefined;
  return screens.find((s) => s.id === id);
}
