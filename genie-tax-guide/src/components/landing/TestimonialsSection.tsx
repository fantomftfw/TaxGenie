import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote: "TaxGenie made comparing tax regimes incredibly simple. Saved me hours and found extra savings!",
    name: "Priya Sharma",
    title: "Freelance Designer",
    avatar: ""
  },
  {
    quote: "Finally, a tool that understands Indian salary structures. The automated analysis is spot on.",
    name: "Amit Patel",
    title: "Software Engineer",
    avatar: ""
  },
  {
    quote: "I used the calculator first, then uploaded my Form 16. So easy and much clearer than doing it myself.",
    name: "Sunita Rao",
    title: "Marketing Manager",
    avatar: ""
  }
];

export function TestimonialsSection() {
  return (
    <section className="w-full py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            What Our Users Say
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear from others who simplified their tax planning with TaxGenie.
          </p>
        </div>
        <div className="mx-auto grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card rounded-2xl shadow-md overflow-hidden">
              <CardContent className="p-6">
                <blockquote className="text-lg font-semibold leading-snug text-foreground mb-4">
                  “{testimonial.quote}”
                </blockquote>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage alt={testimonial.name} src={testimonial.avatar} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 