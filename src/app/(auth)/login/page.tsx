"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AnimatedGrid from "@/components/AnimatedGrid";
import Preloader from "@/components/Preloader";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 1500); // 1.5 seconds for quick branding on subpages

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && !loading && !isSigningIn && !isEmailSigningIn && minTimePassed) {
      router.push("/dashboard");
    }
  }, [user, loading, router, isSigningIn, isEmailSigningIn, minTimePassed]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        window.alert("Your browser blocked the Google Sign-In popup! Please click 'Allow Pop-ups' in your browser's URL bar and try again.");
      } else if (err.message && err.message.includes("sign up first")) {
        window.alert("No account found! Please click OK to go to the Sign Up page and create one.");
        router.push("/signup");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
      setIsSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setError(null);
    setIsEmailSigningIn(true);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code !== "auth/invalid-credential") {
        console.error(err);
      }
      if (err.message && err.message.includes("sign up first")) {
        window.alert("No account found for this email! We will take you to the Sign Up page.");
        router.push("/signup");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. If you haven't created an account yet, please click 'Sign Up' below.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
      setIsEmailSigningIn(false);
    }
  };

  if (loading || (user && !minTimePassed) || (!minTimePassed && !error)) {
    return <Preloader />;
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center p-4 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <AnimatedGrid />
      <div className="relative z-10 w-full max-w-sm rounded-[24px] p-8 glass-card border border-[rgba(255,255,255,0.1)] shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{
          background: "transparent",
        }}>
          <Image src="/logo.svg" alt="BriefAI Logo" width={80} height={80} priority />
        </div>
        <h1 className="text-2xl font-bold mb-1 display-font text-white">BriefAI</h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
          Sign in to access your CEO dashboard and exclusive market intelligence.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="w-full space-y-3 mb-6">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEmailSigningIn || isSigningIn}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isEmailSigningIn || isSigningIn}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          <button
            type="submit"
            disabled={isEmailSigningIn || isSigningIn}
            className="w-full relative overflow-hidden btn-primary text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{ marginTop: "1rem" }}
          >
            {isEmailSigningIn ? <Loader2 size={18} className="animate-spin" /> : <span>Sign In with Email</span>}
          </button>
        </form>

        <div className="w-full flex items-center gap-3 mb-6">
          <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>OR</span>
          <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn || isEmailSigningIn}
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-[rgba(255,255,255,0.1)]"
        >
          {isSigningIn ? <Loader2 size={18} className="animate-spin" /> : (
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>Google</span>
        </button>

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold transition-colors hover:text-white" style={{ color: "var(--accent-violet-light)" }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
