import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import { getLaunchRoute } from "@/lib/startupState";
import { SmagSplashNative } from "@/screens/native/SmagSplashNative";

export default function IndexRoute() {
  const router = useRouter() as { replace: (href: string) => void };
  const routePromiseRef = useRef<Promise<string> | null>(null);
  const [resolvedRoute, setResolvedRoute] = useState<string | null>(null);

  useEffect(() => {
    // Resolve destination route in the background while the splash animation is displaying
    const promise = getLaunchRoute();
    routePromiseRef.current = promise;
    let active = true;

    void promise.then((route) => {
      if (active) {
        setResolvedRoute(route);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleFinish = async () => {
    try {
      const destination = resolvedRoute || (await (routePromiseRef.current ?? getLaunchRoute()));
      router.replace(destination);
    } catch {
      router.replace("/smag_login");
    }
  };

  // The splash screen displays on app launch and then transitions to the resolved route
  return <SmagSplashNative onFinish={handleFinish} />;
}
