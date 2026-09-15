import * as React from "react";
import { redirect } from "next/navigation";
import { requireModerator } from "@/lib/auth/admin";
import { AdminNav } from "./admin-nav";

export const metadata = {
  title: "Trust & Safety Console | Campusly Ops",
  description: "Administrative moderation and trust & safety console for Campusly.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireModerator();
  if (auth.errorResponse) {
    redirect("/explore?error=unauthorized_admin");
  }

  const { user } = auth.adminContext;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col lg:flex-row antialiased selection:bg-amber-500 selection:text-black">
      <AdminNav
        userRole={user.role}
        userPseudonym={user.publicIdentity?.username || "Staff"}
      />
      <main className="flex-1 overflow-y-auto min-h-screen p-4 sm:p-6 lg:p-8 bg-stone-950">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
