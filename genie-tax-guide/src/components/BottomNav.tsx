import { NavLink, useLocation } from "react-router-dom";
import { Home, User, UploadCloud, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// Define navigation items suitable for bottom nav
const navItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Profile", icon: User, path: "/profile" },
  { name: "Upload Docs", icon: UploadCloud, path: "/documents" },
  { name: "Calculator", icon: Calculator, path: "/calculator" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
} 