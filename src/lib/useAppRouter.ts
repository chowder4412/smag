import { useRouter } from "expo-router";

export type AppRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

export function useAppRouter(): AppRouter {
  return useRouter() as AppRouter;
}
