"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your university email.");
      return;
    }

    if (!email.includes(".edu") && !email.includes(".ac.")) {
      setError("Please use an accredited .edu or university domain.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate login for Phase 1
    setTimeout(() => {
      setIsLoading(false);
      router.push("/explore");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-campus-bg">
      {/* Back button */}
      <div className="w-full max-w-md mb-4 text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-campus-muted hover:text-campus-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campusly</span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="inline-block font-serif text-2xl font-bold tracking-tight text-campus-charcoal">
            CAMPUSLY
          </Link>
          <h1 className="font-serif text-xl font-medium text-campus-charcoal mt-2">
            Welcome back to campus
          </h1>
          <p className="text-xs text-campus-muted mt-1">
            Sign in with your verified university credentials.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="University Email"
              type="email"
              placeholder="yourname@berkeley.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              helperText="Must end in .edu or your college domain"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-campus-body">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-campus-border text-campus-accent focus:ring-campus-accent"
                />
                <span>Remember this device</span>
              </label>

              <button
                type="button"
                className="text-campus-accent hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Privacy Guarantee callout */}
            <div className="p-3 bg-stone-50 border border-stone-200/90 rounded-lg flex items-start gap-2 text-xs text-campus-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Your real name and email remain encrypted and are never visible on public feeds.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In to Campus
            </Button>

            <div className="text-center text-xs text-campus-muted">
              First time here?{" "}
              <Link
                href="/register"
                className="text-campus-accent font-semibold hover:underline"
              >
                Claim your pseudonym & join
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
