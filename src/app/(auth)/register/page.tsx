"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { ICollege } from "@/types/college";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = React.useState("");
  const [colleges, setColleges] = React.useState<ICollege[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load available colleges
  React.useEffect(() => {
    let active = true;
    fetch("/api/colleges")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.success && data.colleges) {
          setColleges(data.colleges);
          if (data.colleges.length > 0 && !selectedCollegeId) {
            setSelectedCollegeId(data.colleges[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load colleges:", err));

    return () => {
      active = false;
    };
  }, [selectedCollegeId]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.includes("@") && colleges.length > 0) {
      const domain = val.split("@")[1]?.toLowerCase();
      const matched = colleges.find((c) => c.domain.toLowerCase() === domain);
      if (matched && matched.id) {
        setSelectedCollegeId(matched.id);
      }
    }
  };

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side quick checks
    if (!email.trim()) {
      setError("Please enter your college email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Campusly Terms and Honor Code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          collegeId: selectedCollegeId,
          collegeName: selectedCollege?.name || "Accredited College",
          password,
          confirmPassword,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create account. Please check your details.");
        setIsLoading(false);
        return;
      }

      await refreshUser();
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      console.error("Registration submit error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-campus-bg text-campus-charcoal">
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
          <h1 className="font-serif text-xl font-medium text-campus-charcoal mt-1">
            Join Your Campus Circle
          </h1>
          <p className="text-xs text-campus-muted mt-0.5">
            Anonymous to students, accountable to Campusly.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="University Email"
              type="email"
              placeholder="student@berkeley.edu"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              helperText="Must be an accredited college domain (e.g. .edu)"
            />

            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
                Your College / University
              </label>
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-campus-border rounded-lg text-campus-charcoal outline-none focus:border-campus-charcoal font-medium transition-colors"
              >
                {colleges.map((col) => (
                  <option key={col.id || col.domain} value={col.id}>
                    {col.name} ({col.domain})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters with letters & numbers"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-campus-body">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-campus-border text-campus-accent focus:ring-campus-accent"
                />
                <span>
                  I agree to the <strong>Campusly Honor Code</strong>: Be respectful, protect peer privacy, no harassment, and no doxxing.
                </span>
              </label>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-lg flex items-start gap-2.5 text-xs text-campus-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Your real email and credentials remain strictly confidential. On the next step, you will choose your anonymous moniker.
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
              <span>Create Account & Setup Moniker</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center text-xs text-campus-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-campus-accent font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
