"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { generatePseudonym, PseudonymOption } from "@/lib/utils/pseudonym";
import { ShieldCheck, ArrowLeft, RefreshCw, Check } from "lucide-react";

const SUGGESTED_INTERESTS = [
  "Library Study",
  "Late Night Walks",
  "Architecture & Art",
  "CS & Theory",
  "Analog Photography",
  "Pickleball & Tennis",
  "Philosophy & Debate",
  "Coffee & Matcha",
  "Board Games",
  "Dorm Cooking",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState("");
  const [university, setUniversity] = React.useState("UC Berkeley");
  const [moniker, setMoniker] = React.useState<PseudonymOption>(generatePseudonym());
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([
    "Library Study",
    "Late Night Walks",
  ]);
  const [agreedToHonorCode, setAgreedToHonorCode] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
    } else {
      setSelectedInterests((prev) => [...prev, interest]);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!email.trim() || (!email.includes(".edu") && !email.includes(".ac."))) {
        setError("Please enter an official .edu university email.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!agreedToHonorCode) {
        setError("Please accept the Campus Honor Code to proceed.");
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        router.push("/explore");
      }, 700);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-campus-bg">
      {/* Back link */}
      <div className="w-full max-w-lg mb-4 text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-campus-muted hover:text-campus-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campusly</span>
        </Link>
      </div>

      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="inline-block font-serif text-2xl font-bold tracking-tight text-campus-charcoal">
            CAMPUSLY
          </Link>
          <h1 className="font-serif text-xl font-medium text-campus-charcoal mt-1">
            Claim Your Campus Identity
          </h1>
          <p className="text-xs text-campus-muted mt-0.5">
            Step {step} of 3 • Zero pressure, pseudonymous by design
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-campus-accent"
                    : s < step
                    ? "w-4 bg-stone-400"
                    : "w-4 bg-stone-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleNextStep}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* STEP 1: Email & Campus */}
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="University Email"
                  type="email"
                  placeholder="student@berkeley.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  helperText="We send an instant verification link. No spam ever."
                />

                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
                    Select Your Campus
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-campus-border rounded-lg text-campus-charcoal outline-none focus:border-campus-charcoal font-medium"
                  >
                    <option value="UC Berkeley">UC Berkeley</option>
                    <option value="Stanford University">Stanford University</option>
                    <option value="UCLA">UCLA</option>
                    <option value="University of Michigan">University of Michigan</option>
                    <option value="Columbia University">Columbia University</option>
                    <option value="Other Accredited University">Other Accredited College</option>
                  </select>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-start gap-2.5 text-xs text-campus-muted">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Only students with valid collegiate domains can see your campus circle.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: Pseudonymous Moniker Selector */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center p-5 bg-campus-muted-bg/60 rounded-xl border border-campus-border">
                  <Avatar
                    moniker={moniker.moniker}
                    color={moniker.avatarColor}
                    size="xl"
                    className="mx-auto shadow-xs mb-3"
                  />
                  <div className="font-serif text-xl font-medium text-campus-charcoal">
                    {moniker.moniker}
                  </div>
                  <div className="text-xs text-campus-muted mt-1">
                    Your permanent campus moniker
                  </div>

                  <button
                    type="button"
                    onClick={() => setMoniker(generatePseudonym())}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-campus-border text-xs font-medium text-campus-charcoal hover:bg-stone-50 shadow-2xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-campus-accent" />
                    <span>Shuffle New Moniker</span>
                  </button>
                </div>

                <p className="text-xs text-campus-muted leading-relaxed text-center max-w-sm mx-auto">
                  Your moniker protects your privacy while building real campus goodwill. You can reveal your real identity to close friends individually.
                </p>
              </div>
            )}

            {/* STEP 3: Interests & Honor Code */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
                    Pick your circles & interests (Pick 2+)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          type="button"
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-campus-accent text-white border-campus-accent shadow-2xs"
                              : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{interest}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-campus-border/70">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-campus-body">
                    <input
                      type="checkbox"
                      checked={agreedToHonorCode}
                      onChange={(e) => setAgreedToHonorCode(e.target.checked)}
                      className="mt-0.5 rounded border-campus-border text-campus-accent focus:ring-campus-accent"
                    />
                    <span>
                      I agree to the <strong>Campusly Honor Code</strong>: Be respectful, no harassment, no doxxing, and protect peer privacy.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-3 gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              >
                Back
              </Button>
            ) : (
              <Link href="/login" className="text-xs text-campus-muted hover:underline">
                Already registered? Sign In
              </Link>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="ml-auto"
            >
              {step === 3 ? "Enter Campusly" : "Continue"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
