"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import AnimatedGrid from "@/components/AnimatedGrid";
import Preloader from "@/components/Preloader";

export default function SignUpPage() {
  const { signUpWithGoogle, signUpWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isEmailSigningUp, setIsEmailSigningUp] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && !loading && !isSigningUp && !isEmailSigningUp) {
      router.push("/dashboard");
    }
  }, [user, loading, router, isSigningUp, isEmailSigningUp]);

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsSigningUp(true);
    try {
      await signUpWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        window.alert("Your browser blocked the Google Sign-Up popup! Please click 'Allow Pop-ups' in your browser's URL bar and try again.");
      } else if (err.message && err.message.includes("Account already exists")) {
        window.alert("You already have an account! Please click OK to proceed to Sign In.");
        router.push("/login");
      } else {
        setError(err.message || "Failed to sign up with Google.");
      }
      setIsSigningUp(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setIsEmailSigningUp(true);
    try {
      await signUpWithEmail(name, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use" || (err.message && err.message.includes("already exists"))) {
        window.alert("This email is already registered! We will redirect you to the Login page.");
        router.push("/login");
      } else {
        setError(err.message || "Failed to create account.");
      }
      setIsEmailSigningUp(false);
    }
  };

  if (loading || user) {
    return <Preloader />;
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center p-4 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <AnimatedGrid />
      <div className="relative z-10 w-full max-w-sm rounded-[24px] p-8 glass-card border border-[rgba(255,255,255,0.1)] shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 0 40px rgba(139,92,246,0.2)",
        }}>
          <BrainCircuit size={32} style={{ color: "var(--accent-violet-light)" }} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 display-font text-white">Create Account</h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
          Sign up to unlock AI-powered insights tailored for modern CEOs.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="w-full space-y-3 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isEmailSigningUp || isSigningUp}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEmailSigningUp || isSigningUp}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isEmailSigningUp || isSigningUp}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          <button
            type="submit"
            disabled={isEmailSigningUp || isSigningUp}
            className="w-full relative overflow-hidden btn-primary text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{ marginTop: "1rem" }}
          >
            {isEmailSigningUp ? <Loader2 size={18} className="animate-spin" /> : <span>Sign Up with Email</span>}
          </button>
        </form>

        <div className="w-full flex items-center gap-3 mb-6">
          <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>OR</span>
          <div className="h-px bg-[rgba(255,255,255,0.1)] flex-1" />
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={isSigningUp || isEmailSigningUp}
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-[rgba(255,255,255,0.1)]"
        >
          {isSigningUp ? <Loader2 size={18} className="animate-spin" /> : (
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold transition-colors hover:text-white" style={{ color: "var(--accent-violet-light)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
