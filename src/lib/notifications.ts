import { Platform } from "react-native";

// expo-notifications and expo-device are native-only — guard all usage
const isNative = Platform.OS !== "web";

type NotificationResponse = { notification: { request: { content: { data: Record<string, unknown> } } } };
type Notification = { request: { content: { data: Record<string, unknown> } } };
type Subscription = { remove: () => void };

function noopSubscription(): Subscription {
  return { remove: () => {} };
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!isNative) return null;

  try {
    const Device = await import("expo-device");
    if (!Device.isDevice) return null;

    const Notifications = await import("expo-notifications");
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/firestore");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Smag Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5C00"
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "5fd47950-a064-49b7-b378-1dfed20d9aec"
    })).data;

    await setDoc(doc(db, "users", userId), { expoPushToken: token }, { merge: true });

    Notifications.addPushTokenListener(async ({ data: newToken }) => {
      await setDoc(doc(db, "users", userId), { expoPushToken: newToken }, { merge: true });
    });

    return token;
  } catch {
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (response: NotificationResponse) => void
): Subscription {
  if (!isNative) return noopSubscription();
  try {
    // Dynamic require so web bundler never evaluates expo-notifications
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require("expo-notifications");
    return Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    return noopSubscription();
  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notification) => void
): Subscription {
  if (!isNative) return noopSubscription();
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require("expo-notifications");
    return Notifications.addNotificationReceivedListener(handler);
  } catch {
    return noopSubscription();
  }
}
