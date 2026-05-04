type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/**
 * All values must be set via EXPO_PUBLIC_FIREBASE_* env vars in .env
 * Restrict the API key in Google Cloud Console:
 * https://console.cloud.google.com/apis/credentials
 * → Edit the key → Application restrictions → Android apps → Add com.smag.mobile
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? throwMissing("EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? throwMissing("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? throwMissing("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? throwMissing("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? throwMissing("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? throwMissing("EXPO_PUBLIC_FIREBASE_APP_ID")
};

function throwMissing(key: string): never {
  throw new Error(`Missing required env var: ${key}. Add it to your .env file.`);
}
