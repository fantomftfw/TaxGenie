import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Is my data secure?",
    answer: "Yes, we prioritize security. Documents are processed securely and not stored long-term unless you explicitly choose to save them. We use industry-standard encryption."
  },
  {
    question: "What documents can I upload?",
    answer: "Currently, TaxGenie supports Form 16 PDFs and common salary slip formats. We are continuously working to expand compatibility."
  },
  {
    question: "Is the tax calculation accurate?",
    answer: "Our calculations are based on the latest income tax rules and slabs. However, it should be used for estimation and planning purposes. Always consult a tax professional for final advice."
  },
  {
    question: "Do I need to sign up to use the calculator?",
    answer: "No, the basic tax calculator is free to use without signing up. Sign up is required for document analysis and saving your profile."
  }
];

export function FaqSection() {
  return (
    <section className="w-full py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Have questions? We've got answers.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
} 