import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-72">
        <Header user={session.user} />
        <main className="flex-1 p-6 md:p-8 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
