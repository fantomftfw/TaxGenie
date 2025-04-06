import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background py-6">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
           <Activity className="h-5 w-5 text-primary" />
           <span className="text-sm font-semibold text-foreground">TaxGenie</span>
        </div>
        <p className="text-center text-xs text-muted-foreground md:text-left">
          © {currentYear} TaxGenie. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-xs text-muted-foreground hover:underline hover:text-foreground underline-offset-4" to="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs text-muted-foreground hover:underline hover:text-foreground underline-offset-4" to="/privacy">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
} 