import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Server, BookOpen } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Cluster Management", href: "/", icon: Server },
  { name: "Documentation", href: "/docs", icon: BookOpen },
];

export const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();

  return (
    <div
      className={cn("flex h-full w-64 flex-col border-r bg-card", className)}
    >
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Comcast</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
