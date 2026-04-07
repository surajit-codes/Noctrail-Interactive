"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Preloader from "@/components/Preloader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 3500); // 3.5 seconds for branding to ensure text fully animates

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minTimePassed) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/signup");
      }
    }
  }, [user, loading, minTimePassed, router]);

  // Keep showing preloader until both auth is resolved and minimum branding time has passed
  return <Preloader />;
}
