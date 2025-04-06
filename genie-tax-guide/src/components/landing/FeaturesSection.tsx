import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, BarChart2, Sparkles, Lock, Zap } from 'lucide-react'; // Example Icons

const features = [
  {
    icon: <UploadCloud className="h-8 w-8 text-primary" />,
    title: "Effortless Uploads",
    description: "Securely upload your Form 16 or salary slips in seconds."
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: "Instant Analysis",
    description: "Get a clear breakdown of your income, deductions, and estimated tax."
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Regime Comparison",
    description: "See potential savings by comparing Old vs. New tax regimes automatically."
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Quick Calculations",
    description: "Use our simple calculator for quick tax estimations anytime."
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Secure & Private",
    description: "Your data is processed securely and is never stored long-term without consent."
  },
  // Add more features as needed
];

export function FeaturesSection() {
  return (
    <section className="w-full py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10 md:mb-12">
          <div className="space-y-2">
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Key Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
              Why Choose TaxGenie?
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Simplify your tax planning with powerful automation and clear insights.
            </p>
          </div>
        </div>

        {/* Features Grid - Ensure responsive columns */}
        {/* Start with 1 column, go to 2 on sm, 3 on md */}
        <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-8 max-w-5xl"> 
          {features.map((feature, index) => (
            // Ensure cards have enough padding on mobile
            <Card key={index} className="flex flex-col items-center justify-start p-6 text-center bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 min-h-[180px]"> 
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </Card>
          ))}
        </div> {/* <-- Ensure this closing div is present and correctly placed */}
      </div>
    </section>
  );
} 