import { getApp, getApps, initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { firebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const storage = getStorage(app);

function extensionFromUri(uri: string) {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(uri);
  return (match?.[1] ?? "jpg").toLowerCase();
}

function contentTypeFromExtension(ext: string) {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export async function uploadProfileImageToFirebase(params: {
  uid: string;
  imageUri: string;
}) {
  const ext = extensionFromUri(params.imageUri);
  const response = await fetch(params.imageUri);

  if (!response.ok) {
    throw new Error("Unable to read selected image file.");
  }

  const blob = await response.blob();
  const objectRef = ref(storage, `users/${params.uid}/profile/avatar_${Date.now()}.${ext}`);
  await uploadBytes(objectRef, blob, { contentType: contentTypeFromExtension(ext) });
  return getDownloadURL(objectRef);
}
