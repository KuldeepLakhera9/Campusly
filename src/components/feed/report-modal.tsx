"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ReportReason, REPORT_REASONS } from "@/types/post";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "comment";
  targetAuthor?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetAuthor,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<ReportReason>("Spam");
  const [details, setDetails] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setIsSubmitted(false);
        setErrorMessage(null);
        setDetails("");
        setSelectedReason("Spam");
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/posts/${targetId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          targetType,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to report.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${targetType === "post" ? "Post" : "Comment"}`}
      subtitle={
        targetAuthor
          ? `Content by ${targetAuthor}. Reports are reviewed confidentially.`
          : "Help keep Campusly safe and respectful."
      }
      maxWidth="md"
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-medium text-campus-charcoal">
            Thank you for speaking up
          </h3>
          <p className="text-xs text-campus-muted max-w-sm mx-auto">
            Our campus moderation team has received your report and will review it promptly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-2">
              Select Reason
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className={`text-xs p-2.5 rounded-md border text-left font-medium transition-colors ${
                    selectedReason === r
                      ? "bg-campus-charcoal text-white border-campus-charcoal"
                      : "bg-white text-campus-body border-campus-border hover:bg-stone-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-campus-muted mb-1.5">
              Additional Details (Optional)
            </label>
            <Textarea
              placeholder="Provide context if helpful for the moderation team..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-campus-border/70 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-campus-accent shrink-0 mt-0.5" />
            <p className="text-xs text-campus-muted leading-relaxed">
              Your identity is protected. The student being reported will never know who submitted this report.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-campus-border/70">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
