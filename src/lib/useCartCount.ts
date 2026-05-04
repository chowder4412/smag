import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeCart } from "@/lib/firebase/firestore";

export function useCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const unsub = subscribeCart(user.uid, (items) => {
      setCount(items.reduce((sum, i) => sum + i.quantity, 0));
    });
    return unsub;
  }, []);

  return count;
}
