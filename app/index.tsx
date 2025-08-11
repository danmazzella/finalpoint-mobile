import { useEffect } from "react";
import { router } from "expo-router";

export default function Page() {
  useEffect(() => {
    // Redirect to the main tabs screen
    router.replace("/(tabs)");
  }, []);

  // Return null since we're redirecting
  return null;
}


