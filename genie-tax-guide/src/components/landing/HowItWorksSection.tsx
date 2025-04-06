import React from 'react';

const steps = [
  {
    step: "01",
    title: "Upload Documents",
    description: "Securely upload your Form 16 or recent salary slips. No manual data entry needed."
  },
  {
    step: "02",
    title: "Instant Analysis",
    description: "TaxGenie automatically extracts data and calculates your tax under both regimes."
  },
  {
    step: "03",
    title: "Review & Save",
    description: "See a clear comparison, understand potential savings, and make informed decisions."
  }
];

export function HowItWorksSection() {
  return (
    <section className="w-full py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3 mb-10 md:mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-foreground">
            Get Started in 3 Easy Steps
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            From upload to insights in just a few clicks.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((item, index) => (
            <div key={index} className="flex flex-col items-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                {item.step}
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 