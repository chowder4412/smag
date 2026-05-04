import { Image, type ImageProps, type ImageSource } from "expo-image";
import { StyleSheet } from "react-native";

type Props = Omit<ImageProps, "placeholder"> & {
  source: ImageSource | string | number;
};

/**
 * Unified image component across the app.
 * Uses expo-image for disk caching, blurhash placeholder, and smooth transitions.
 * Drop-in replacement for react-native Image.
 */
export function AppImage({ style, ...props }: Props) {
  return (
    <Image
      {...props}
      style={[styles.base, style]}
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#ffede5" }
});
