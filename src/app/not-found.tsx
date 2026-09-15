import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white border border-campus-border rounded-xl shadow-xs">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-campus-muted-bg text-campus-muted flex items-center justify-center border border-campus-border">
          <Compass className="w-6 h-6 text-campus-accent" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-campus-accent">
          404 Error
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-campus-charcoal font-medium mt-1">
          Uncharted Quad
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-campus-muted leading-relaxed">
          The campus corner you are looking for has either expired, moved, or never existed.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
          <Link href="/explore">
            <Button variant="primary">Explore Campus Pulse</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
