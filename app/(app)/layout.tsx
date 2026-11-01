import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh">
      <div className="barber-pole sticky top-0 z-50" />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
