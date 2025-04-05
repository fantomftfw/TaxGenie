import { useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Calculator, 
  UploadCloud, 
  Lightbulb,
  Settings, 
  HelpCircle,
  User,
  Wallet,
  BookOpen,
  LineChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  collapsed?: boolean;
}

function SidebarItem({ icon, title, path, collapsed }: SidebarItemProps) {
  return collapsed ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={path}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center h-10 w-10 rounded-lg transition-all",
                isActive 
                  ? "bg-accent/20 text-accent" 
                  : "text-muted-foreground hover:bg-muted hover:text-accent"
              )
            }
          >
            {icon}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          isActive 
            ? "bg-accent/20 text-accent" 
            : "text-muted-foreground hover:bg-muted hover:text-accent"
        )
      }
    >
      {icon}
      <span>{title}</span>
    </NavLink>
  );
}

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();
  
  return (
    <div className={cn(
        "flex h-full flex-col gap-2 p-3 bg-background",
         collapsed ? "items-center w-16" : "w-60"
    )}>
      <div className={cn("flex items-center h-14 border-b border-border", collapsed ? "justify-center" : "px-4")}>
         <NavLink to="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
             <span className="inline-block p-1.5 bg-primary/10 rounded-lg text-primary">TG</span> 
             {!collapsed && <span>TaxGenie</span>}
         </NavLink>
      </div>
      
      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-4", collapsed ? "px-0" : "px-3")}>
        <SidebarItem icon={<Home size={collapsed ? 24 : 20} />} title="Dashboard" path="/" collapsed={collapsed} />
        <SidebarItem icon={<User size={collapsed ? 24 : 20} />} title="Profile" path="/profile" collapsed={collapsed} />
        <SidebarItem icon={<UploadCloud size={collapsed ? 24 : 20} />} title="Upload Docs" path="/documents" collapsed={collapsed} />
        <SidebarItem icon={<Calculator size={collapsed ? 24 : 20} />} title="Tax Calculator" path="/calculator" collapsed={collapsed} />
      </nav>
      
      <div className={cn("mt-auto border-t border-border pt-3", collapsed ? "px-0 flex flex-col items-center" : "px-3 pb-2")}>
        <div className={cn("space-y-1", collapsed ? "px-0" : "")}>
          <SidebarItem icon={<Settings size={collapsed ? 24 : 20} />} title="Settings" path="/settings" collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}
