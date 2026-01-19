import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header user={session.user} />
        <main className="flex-1 p-6 md:p-8 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
