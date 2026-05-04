import { lazy } from "react";
import type { ComponentType } from "react";
import { withScreenErrorBoundary } from "@/components/withScreenErrorBoundary";

function lazyScreen<T extends ComponentType>(
  importer: () => Promise<{ default: T }>
): ComponentType {
  const Lazy = lazy(importer);
  return withScreenErrorBoundary(Lazy as ComponentType);
}

const nativeScreens: Record<string, ComponentType> = {
  smag_change_password: lazyScreen(() => import("./SmagChangePasswordNative").then(m => ({ default: m.SmagChangePasswordNative }))),
  smag_checkout: lazyScreen(() => import("./SmagCheckoutNative").then(m => ({ default: m.SmagCheckoutNative }))),
  smag_edit_profile: lazyScreen(() => import("./SmagEditProfileNative").then(m => ({ default: m.SmagEditProfileNative }))),
  smag_explore: lazyScreen(() => import("./SmagExploreNative").then(m => ({ default: m.SmagExploreNative }))),
  smag_favorites: lazyScreen(() => import("./SmagFavoritesNative").then(m => ({ default: m.SmagFavoritesNative }))),
  smag_forgot_password: lazyScreen(() => import("./SmagForgotPasswordNative").then(m => ({ default: m.SmagForgotPasswordNative }))),
  smag_home: lazyScreen(() => import("./SmagHomeNative").then(m => ({ default: m.SmagHomeNative }))),
  smag_login: lazyScreen(() => import("./SmagLoginNative").then(m => ({ default: m.SmagLoginNative }))),
  smag_member_levels: lazyScreen(() => import("./SmagMemberLevelsNative").then(m => ({ default: m.SmagMemberLevelsNative }))),
  smag_membership_rewards: lazyScreen(() => import("./SmagMembershipRewardsNative").then(m => ({ default: m.SmagMembershipRewardsNative }))),
  smag_menu: lazyScreen(() => import("./SmagMenuNative").then(m => ({ default: m.SmagMenuNative }))),
  smag_my_cart: lazyScreen(() => import("./SmagMyCartNative").then(m => ({ default: m.SmagMyCartNative }))),
  smag_notifications: lazyScreen(() => import("./SmagNotificationsNative").then(m => ({ default: m.SmagNotificationsNative }))),
  smag_order_history: lazyScreen(() => import("./SmagOrderHistoryNative").then(m => ({ default: m.SmagOrderHistoryNative }))),
  smag_payment_methods: lazyScreen(() => import("./SmagPaymentMethodsNative").then(m => ({ default: m.SmagPaymentMethodsNative }))),
  smag_profile: lazyScreen(() => import("./SmagProfileNative").then(m => ({ default: m.SmagProfileNative }))),
  smag_promotions_deals: lazyScreen(() => import("./SmagPromotionsDealsNative").then(m => ({ default: m.SmagPromotionsDealsNative }))),
  smag_promo_details: lazyScreen(() => import("./SmagPromoDetailsNative").then(m => ({ default: m.SmagPromoDetailsNative }))),
  smag_rate_concierge: lazyScreen(() => import("./SmagRateConciergeNative").then(m => ({ default: m.SmagRateConciergeNative }))),
  smag_rate_your_experience: lazyScreen(() => import("./SmagRateYourExperienceNative").then(m => ({ default: m.SmagRateYourExperienceNative }))),
  smag_refer_a_friend: lazyScreen(() => import("./SmagReferAFriendNative").then(m => ({ default: m.SmagReferAFriendNative }))),
  smag_referral_faq: lazyScreen(() => import("./SmagReferralFaqNative").then(m => ({ default: m.SmagReferralFaqNative }))),
  smag_referral_history: lazyScreen(() => import("./SmagReferralHistoryNative").then(m => ({ default: m.SmagReferralHistoryNative }))),
  smag_referral_leaderboard: lazyScreen(() => import("./SmagReferralLeaderboardNative").then(m => ({ default: m.SmagReferralLeaderboardNative }))),
  smag_referral_terms: lazyScreen(() => import("./SmagReferralTermsNative").then(m => ({ default: m.SmagReferralTermsNative }))),
  smag_rules_prizes: lazyScreen(() => import("./SmagRulesPrizesNative").then(m => ({ default: m.SmagRulesPrizesNative }))),
  smag_voucher_wallet: lazyScreen(() => import("./SmagVoucherWalletNative").then(m => ({ default: m.SmagVoucherWalletNative }))),
  smag_reset_link_sent: lazyScreen(() => import("./SmagResetLinkSentNative").then(m => ({ default: m.SmagResetLinkSentNative }))),
  smag_restaurant_details: lazyScreen(() => import("./SmagRestaurantDetailsNative").then(m => ({ default: m.SmagRestaurantDetailsNative }))),
  smag_saved_addresses: lazyScreen(() => import("./SmagSavedAddressesNative").then(m => ({ default: m.SmagSavedAddressesNative }))),
  smag_settings: lazyScreen(() => import("./SmagSettingsNative").then(m => ({ default: m.SmagSettingsNative }))),
  smag_sign_up: lazyScreen(() => import("./SmagSignUpNative").then(m => ({ default: m.SmagSignUpNative }))),
  smag_phone_auth: lazyScreen(() => import("./SmagPhoneAuthNative").then(m => ({ default: m.SmagPhoneAuthNative }))),
  smag_support_help: lazyScreen(() => import("./SmagSupportHelpNative").then(m => ({ default: m.SmagSupportHelpNative }))),
  smag_track_order: lazyScreen(() => import("./SmagTrackOrderNative").then(m => ({ default: m.SmagTrackOrderNative }))),
  smag_track_order_map: lazyScreen(() => import("./SmagTrackOrderMapNative").then(m => ({ default: m.SmagTrackOrderMapNative }))),
  smag_vip_support_chat: lazyScreen(() => import("./SmagVipSupportChatNative").then(m => ({ default: m.SmagVipSupportChatNative }))),
  smag_payment: lazyScreen(() => import("./SmagPaymentNative").then(m => ({ default: m.SmagPaymentNative }))),
  smag_welcome: lazyScreen(() => import("./SmagWelcomeNative").then(m => ({ default: m.SmagWelcomeNative }))),
  tier_comparison: lazyScreen(() => import("./TierComparisonNative").then(m => ({ default: m.TierComparisonNative }))),
  smag_receipt: lazyScreen(() => import("./SmagReceiptNative").then(m => ({ default: m.SmagReceiptNative }))),
  other_kitchens: lazyScreen(() => import("./OtherKitchensNative").then(m => ({ default: m.OtherKitchensNative }))),
  other_kitchen_details: lazyScreen(() => import("./OtherKitchenDetailsNative").then(m => ({ default: m.OtherKitchenDetailsNative })))
};

export function getNativeScreenComponent(id?: string) {
  if (!id) return null;
  return nativeScreens[id] ?? null;
}
