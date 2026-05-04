# Smag — React Native Mobile App

A fully native Expo Router app for the Smag gourmet food delivery platform.

## All screens (native)

Every screen is a fully native React Native component — no HTML wrappers or WebViews.

| Screen ID | Component |
|---|---|
| smag_welcome | SmagWelcomeNative |
| smag_login | SmagLoginNative |
| smag_sign_up | SmagSignUpNative |
| smag_forgot_password | SmagForgotPasswordNative |
| smag_reset_link_sent | SmagResetLinkSentNative |
| smag_phone_auth | SmagPhoneAuthNative |
| smag_home | SmagHomeNative |
| smag_explore | SmagExploreNative |
| smag_menu | SmagMenuNative |
| smag_restaurant_details | SmagRestaurantDetailsNative |
| smag_my_cart | SmagMyCartNative |
| smag_checkout | SmagCheckoutNative |
| smag_payment | SmagPaymentNative |
| smag_receipt | SmagReceiptNative |
| smag_order_history | SmagOrderHistoryNative |
| smag_track_order | SmagTrackOrderNative |
| smag_track_order_map | SmagTrackOrderMapNative |
| smag_favorites | SmagFavoritesNative |
| smag_notifications | SmagNotificationsNative |
| smag_profile | SmagProfileNative |
| smag_edit_profile | SmagEditProfileNative |
| smag_change_password | SmagChangePasswordNative |
| smag_settings | SmagSettingsNative |
| smag_saved_addresses | SmagSavedAddressesNative |
| smag_payment_methods | SmagPaymentMethodsNative |
| smag_promotions_deals | SmagPromotionsDealsNative |
| smag_promo_details | SmagPromoDetailsNative |
| smag_member_levels | SmagMemberLevelsNative |
| smag_membership_rewards | SmagMembershipRewardsNative |
| smag_refer_a_friend | SmagReferAFriendNative |
| smag_referral_history | SmagReferralHistoryNative |
| smag_referral_leaderboard | SmagReferralLeaderboardNative |
| smag_referral_faq | SmagReferralFaqNative |
| smag_referral_terms | SmagReferralTermsNative |
| smag_rules_prizes | SmagRulesPrizesNative |
| smag_voucher_wallet | SmagVoucherWalletNative |
| smag_vip_support_chat | SmagVipSupportChatNative |
| smag_support_help | SmagSupportHelpNative |
| smag_rate_your_experience | SmagRateYourExperienceNative |
| smag_rate_concierge | SmagRateConciergeNative |
| tier_comparison | TierComparisonNative |
| other_kitchens | OtherKitchensNative |
| other_kitchen_details | OtherKitchenDetailsNative |

## Project structure

```
app/                    Expo Router routes
  _layout.tsx           Root layout (auth guard, theme, notifications)
  index.tsx             Splash / launch route
  [id].tsx              Dynamic screen renderer
src/
  components/           Shared UI components
  lib/                  Firebase, auth, hooks, utilities
  screens/native/       All native screen components
  generated/screens.ts  Screen registry
  theme/                Colors and spacing tokens
functions/src/          Firebase Cloud Functions (Paystack, admin, orders)
design/                 Reference screenshots (screen.png only)
```

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase + Google credentials
2. Install dependencies: `npm install` (or `pnpm install`)
3. Start: `npm run start`

## CI/CD

GitHub Actions runs lint + tests on every push to `main`/`develop` and every PR.
EAS preview builds run on PRs.

Required GitHub repository secrets:

| Secret | Description |
|---|---|
| `EXPO_TOKEN` | EAS access token from `expo.dev/accounts/[user]/settings/access-tokens` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | EAS project ID |

## Notes

- `.env`, `google-services.json`, `GoogleService-Info.plist`, and keystores are gitignored — never commit real credentials
- Firebase security rules are in `firestore.rules` and `storage.rules`
- Cloud Functions use Firebase Secrets Manager for `PAYSTACK_SECRET_KEY` — never hardcoded
