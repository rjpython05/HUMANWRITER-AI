"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  History,
  Shield,
  Search,
  Settings,
  Users,
  Database,
  BarChart3,
  PenTool,
} from "lucide-react";

const routes = [
  {
    label: "Generate",
    icon: PenTool,
    href: "/generate",
    color: "text-blue-500",
  },
  {
    label: "History",
    icon: History,
    href: "/history",
    color: "text-gray-500",
  },
  {
    label: "Verify AI",
    icon: Shield,
    href: "/verify",
    color: "text-green-500",
  },
  {
    label: "Plagiarism",
    icon: Search,
    href: "/plagiarism",
    color: "text-purple-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
];

const adminRoutes = [
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    color: "text-red-500",
  },
  {
    label: "Corpus",
    icon: Database,
    href: "/admin/corpus",
    color: "text-orange-500",
  },
  {
    label: "Metrics",
    icon: BarChart3,
    href: "/admin/metrics",
    color: "text-pink-500",
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative h-8 w-8 mr-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold">HumanWriter AI</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-8">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase">
              Admin
            </div>
            <div className="space-y-1">
              {adminRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                    pathname === route.href
                      ? "text-white bg-white/10"
                      : "text-zinc-400"
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
