import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CallToActionSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-16 sm:py-20 md:py-24 lg:py-32 border-t border-border/40">
      <div className="container flex flex-col items-center gap-4 px-4 text-center md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
          Ready to Simplify Your Taxes?
        </h2>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
          Try our free tax calculator or sign up to start analyzing your documents today.
        </p>
        <div className="flex flex-col gap-3 min-[400px]:flex-row mt-4">
          <Button size="lg" className="gap-1" onClick={() => navigate('/calculator')}>
            Try the Calculator
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/signup')}>
            Sign Up Now
          </Button>
        </div>
      </div>
    </section>
  );
} 