import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Home, 
    User, 
    FileText, 
    Calculator, 
    Lightbulb, 
    PiggyBank, 
    BookOpen, 
    Settings, 
    LogOut, 
    Menu,
    UploadCloud
} from 'lucide-react';

// Remove navItems here as they are defined in Sidebar and BottomNav
// const navItems = [ ... ]; 

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className={cn("hidden md:flex h-full transition-all duration-300 ease-in-out", sidebarCollapsed ? "w-16" : "w-60")}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300 ease-in-out",
          "pb-20 md:pb-8" // Add padding-bottom for mobile bottom nav, reset for desktop
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
