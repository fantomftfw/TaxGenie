import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ChevronDown, Activity, Moon, Sun, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "next-themes";

export function Navbar() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const isLoggedIn = !!authState.user;
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'Calculator', path: '/calculator' },
    { title: 'About', path: '/about' },
  ].filter(item => item.title !== 'Dashboard');

  const renderNavLinks = (isMobile = false) => (
    <nav className={cn("flex items-center gap-1 text-sm", isMobile ? "flex-col items-start gap-2 mt-4" : "gap-6")}>
        {navItems.map((item) => {
            const navAction = () => {
                navigate(item.path);
                if (isMobile) setIsMobileMenuOpen(false);
            };
            if(isMobile) {
                return (
                     <SheetClose asChild key={item.title}>
                        <Button variant="ghost" onClick={navAction} className="w-full justify-start">
                           {item.title}
                        </Button>
                     </SheetClose>
                );
            }
            else if (item.title === 'Resources') {
                return (
                    <DropdownMenu key={item.title}>
                        <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-1 px-2 text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            Resources <ChevronDown className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                         {navItems.map(subItem => (
                            <DropdownMenuItem key={subItem.title} onClick={() => navigate(subItem.path)}>
                                {subItem.title}
                            </DropdownMenuItem>
                         ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            } else {
                return null;
            }
        })}
    </nav>
  );

  const renderAuthButtons = (isMobile = false) => (
    <div className={cn("flex items-center", isMobile ? "flex-col items-stretch gap-2 mt-4 w-full" : "space-x-4")}>
      {isLoggedIn ? (
        null
      ) : (
        <>
          <Button 
            variant={isMobile ? "outline" : "ghost"} 
            onClick={() => { navigate('/login'); if (isMobile) setIsMobileMenuOpen(false); }} 
            className={cn(isMobile ? "w-full" : "text-muted-foreground hover:text-foreground", !isMobile && "hidden md:inline-flex")}
           >
            Login
          </Button>
          <Button 
            variant="default" 
            onClick={() => { navigate('/signup'); if (isMobile) setIsMobileMenuOpen(false); }} 
            className={cn(isMobile ? "w-full" : "", !isMobile && "hidden md:inline-flex")}
          >
            Sign Up
          </Button>
        </>
      )}
    </div>
  );

   const renderThemeToggle = (isMobile = false) => (
       <Button
            variant={isMobile ? "outline" : "ghost"}
            size={isMobile ? "default" : "icon"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={cn(isMobile ? "w-full flex justify-between items-center" : "", !isMobile && "hidden md:inline-flex")}
          >
            {isMobile && <span>Toggle Theme</span>}
            <div className={cn(isMobile ? "" : "relative")}>
                 <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                 <Moon className="absolute top-0 left-0 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="sr-only">Toggle theme</span>
      </Button>
   );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between"> 
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">TaxGenie</span>
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
           {renderNavLinks(false)}
           {renderAuthButtons(false)}
           {renderThemeToggle(false)}
        </div>

        <div className="flex items-center gap-2 md:hidden">
           {!isLoggedIn && (
               <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
           )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                    <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Activity className="h-6 w-6 text-primary" />
                      <span className="font-bold text-foreground">TaxGenie</span>
                    </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                  {renderNavLinks(true)}
                  
                  {!isLoggedIn && (
                      <Button variant="default" onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }} className="w-full mt-4">
                          Sign Up
                      </Button>
                  )}

                  <div className="mt-auto pt-4 border-t">
                      {renderThemeToggle(true)}
                  </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
} 