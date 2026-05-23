import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type ColorScheme = {
  background: string;
  surface: string;
  surfaceLow: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  onPrimary: string;
  outline: string;
  error: string;
};

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorScheme;
};

const LIGHT_COLORS: ColorScheme = {
  background: "#fff4f0",
  surface: "#ffffff",
  surfaceLow: "#ffede5",
  onBackground: "#4b240a",
  onSurface: "#4b240a",
  onSurfaceVariant: "#805032",
  primary: "#a33800",
  onPrimary: "#ffefeb",
  outline: "#dd9f7c",
  error: "#b31b25"
} as const;

const DARK_COLORS: ColorScheme = {
  background: "#1a0d06",
  surface: "#2a1508",
  surfaceLow: "#3a1e0a",
  onBackground: "#ffd4bd",
  onSurface: "#ffd4bd",
  onSurfaceVariant: "#c49070",
  primary: "#ff7941",
  onPrimary: "#1a0d06",
  outline: "#6b3a1f",
  error: "#fb5151"
} as const;

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  colors: LIGHT_COLORS
});

const THEME_KEY = "smag_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") setTheme(saved);
    });
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      void AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  const isDark = theme === "dark";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
