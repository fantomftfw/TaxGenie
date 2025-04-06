import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CallToActionSection } from '@/components/landing/CallToActionSection';
// Import other landing page sections later (e.g., Testimonials, FAQ)

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
          <div 
              className="absolute top-[10%] right-[5%] h-[600px] w-[600px] rounded-full opacity-30 blur-3xl lg:h-[700px] lg:w-[700px] animate-orbit-2 filter drop-shadow-[0_0_25px_hsl(var(--secondary)/0.4)]"
              style={{ backgroundColor: 'hsl(var(--secondary))' }} 
          />
          <div 
              className="absolute top-[-5%] right-[-5%] h-[700px] w-[700px] rounded-full opacity-40 blur-3xl lg:h-[800px] lg:w-[800px] animate-orbit-1 filter drop-shadow-[0_0_30px_hsl(var(--blob-1-color)/0.5)]"
              style={{ backgroundColor: 'hsl(var(--blob-1-color))' }} 
          />
      </div>

      <Navbar />
      <main className="relative z-10 flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <CallToActionSection />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
} 