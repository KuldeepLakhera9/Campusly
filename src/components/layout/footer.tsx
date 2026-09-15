import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-campus-border bg-campus-bg/80 py-12 mt-auto text-campus-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-campus-border/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-campus-charcoal">
                CAMPUSLY
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-stone-200/60 text-stone-700 font-medium">
                Phase 1
              </span>
            </div>
            <p className="mt-1.5 text-xs text-campus-muted max-w-sm">
              Connect without the pressure. Verified college circles, pseudonymous campus life, and spontaneous real-world hangouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-medium text-campus-body">
            <Link href="/explore" className="hover:text-campus-accent transition-colors">
              Campus Pulse
            </Link>
            <Link href="/hangouts" className="hover:text-campus-accent transition-colors">
              Spontaneous Hangouts
            </Link>
            <Link href="/login" className="hover:text-campus-accent transition-colors">
              Student Verification
            </Link>
            <div className="flex items-center gap-1.5 text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Zero-Data-Selling Guarantee</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-campus-subtle">
          <p>© {new Date().getFullYear()} CAMPUSLY. Designed with editorial care for collegiate life.</p>
          <div className="flex items-center gap-4">
            <span>Built for Vercel & Next.js App Router</span>
            <span>•</span>
            <span>Mongoose + MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
