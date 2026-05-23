import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { NetworkBanner } from "@/components/NetworkBanner";
import { subscribeAuthState, forceTokenRefresh } from "@/lib/firebase/auth";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { useAppRouter } from "@/lib/useAppRouter";
import { startOfflineQueueListener } from "@/lib/offlineQueue";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerForPushNotifications
} from "@/lib/notifications";

(Text as unknown as { defaultProps: Record<string, unknown> }).defaultProps =
  (Text as unknown as { defaultProps: Record<string, unknown> }).defaultProps ?? {};
(Text as unknown as { defaultProps: Record<string, unknown> }).defaultProps.selectable = false;

(TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps =
  (TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps ?? {};
(TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps.autoCorrect = false;

const PUBLIC_SCREENS = new Set([
  "smag_login", "smag_sign_up", "smag_forgot_password",
  "smag_reset_link_sent", "smag_phone_auth", "smag_welcome"
]);

function AuthGuard({ onReady }: { onReady: () => void }) {
  const router = useAppRouter();
  const segments = useSegments();
  const [authReady, setAuthReady] = useState(false);
  const isAuthenticatedRef = useRef<boolean | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      isAuthenticatedRef.current = !!user;
      userIdRef.current = user?.uid ?? null;
      setAuthReady(true);
      onReady();

      // Register for push notifications when user signs in
      if (user?.uid) {
        void registerForPushNotifications(user.uid);
      }
    });
    return unsubscribe;
  }, [onReady]);

  // Force token refresh when app comes to foreground — detects revoked/expired tokens
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void forceTokenRefresh();
    });
    return () => sub.remove();
  }, []);

  // Handle notification taps + deep links
  useEffect(() => {
    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.orderId) {
        router.push(`/smag_track_order?orderId=${data.orderId}`);
      } else if (data?.screen) {
        router.push(`/${data.screen}`);
      }
    });

    const receivedSub = addNotificationReceivedListener(() => {});

    // Handle deep links (e.g. smag://track_order?orderId=abc)
    const linkSub = Linking.addEventListener("url", ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path) {
        const route = parsed.path.startsWith("/") ? parsed.path : `/${parsed.path}`;
        const query = parsed.queryParams ? `?${new URLSearchParams(parsed.queryParams as Record<string, string>).toString()}` : "";
        router.push(`${route}${query}`);
      }
    });

    return () => { responseSub.remove(); receivedSub.remove(); linkSub.remove(); };
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    const lastSegment = segments[segments.length - 1] ?? "";
    // Public if in PUBLIC_SCREENS set or is the dynamic [id] route (screens handle their own auth)
    const isPublic = PUBLIC_SCREENS.has(lastSegment) || lastSegment === "[id]";
    if (!isAuthenticatedRef.current && !isPublic) {
      router.replace("/smag_login");
    }
  }, [authReady, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedRootLayout />
    </ThemeProvider>
  );
}

function ThemedRootLayout() {
  const { isDark, colors } = useTheme();
  const [authReady, setAuthReady] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const onAuthReady = useCallback(() => setAuthReady(true), []);

  useEffect(() => {
    return startOfflineQueueListener();
  }, []);

  useEffect(() => {
    const version = Constants.expoConfig?.version ?? "1.0.0";
    const functions = getFunctions(getApp(), "us-central1");
    void httpsCallable<{ version: string }, { supported: boolean; minVersion: string }>(
      functions, "checkAppVersion"
    )({ version }).then((res) => {
      if (!res.data.supported) setUpdateRequired(true);
    }).catch(() => { /* non-fatal — allow app to continue if check fails */ });
  }, []);

  if (updateRequired) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Text style={{ color: colors.onBackground, fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 12 }}>
          Update Required
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 }}>
          A newer version of Smag is required to continue. Please update the app from the store.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary fallbackLabel="The app encountered an unexpected error. Please restart.">
      <StatusBar style={isDark ? "light" : "dark"} />
      <NetworkBanner />
      <AuthGuard onReady={onAuthReady} />
      {!authReady ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
            animationDuration: 220
          }}
        />
      )}
    </ErrorBoundary>
  );
}
