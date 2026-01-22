import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { UsersTable } from "@/components/admin/users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await getServerSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch users from database
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      isActive: true,
      generationsCount: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
