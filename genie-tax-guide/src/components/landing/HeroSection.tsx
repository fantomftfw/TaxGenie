import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Wallet, BarChartHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative w-full py-20 md:py-28 lg:py-32 xl:py-40">
            <div className="container relative px-4 md:px-6">
                <div className="relative flex flex-col items-center">
                    <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mb-12 lg:mb-16 xl:mb-20 z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-in-out">
                        <div className="space-y-4">
                            <span className="inline-block rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                Tax Season Simplified
                            </span>
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none text-foreground animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 ease-in-out">
                                Instant Tax Analysis & Comparison
                            </h1>
                            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 ease-in-out">
                                Upload documents, get automated insights, compare regimes, and find potential savings. Tax planning made effortless.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 ease-in-out">
                            <Button
                                size="lg"
                                variant="default"
                                className="gap-1 group"
                                onClick={() => navigate('/calculator')}
                            >
                                Try Tax Calculator 
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                            >
                                Watch Demo (Soon)
                            </Button>
                        </div>
                    </div>

                    {/* Est Savings Card - Hide on mobile */}
                    <div className="hidden lg:block absolute -top-10 left-0 lg:left-10 xl:left-20 w-48 transform -rotate-12 rounded-lg bg-card/70 backdrop-blur-md border border-border/50 p-4 shadow-xl animate-in fade-in slide-in-from-left-10 duration-700 delay-700">
                         <div className="mb-2 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Est. Savings</span>
                            <Wallet className="h-4 w-4 text-primary"/>
                          </div>
                          <p className="text-xl font-bold text-primary">₹ 76,502</p>
                    </div>

                    {/* Regime Comparison Card - Hide on mobile */}
                    <div className="hidden lg:block absolute top-[25%] -right-5 lg:right-10 xl:right-20 w-56 transform rotate-6 rounded-lg bg-card/70 backdrop-blur-md border border-border/50 p-4 shadow-xl animate-in fade-in slide-in-from-right-10 duration-700 delay-900">
                        <span className="text-xs text-muted-foreground">Regime Comparison</span>
                        <div className="mt-2 h-10 flex items-end gap-1">
                            <div className="h-[60%] w-1/2 bg-primary/30 rounded-t-sm"></div>
                            <div className="h-[90%] w-1/2 bg-secondary/30 rounded-t-sm"></div>
                        </div>
                    </div>

                    {/* vs Old Regime Card - Hide on mobile */}
                     <div className="hidden lg:block absolute -bottom-10 left-5 lg:left-20 xl:left-40 w-32 transform rotate-3 rounded-lg bg-card/70 backdrop-blur-md border border-border/50 p-3 text-center shadow-xl animate-in fade-in slide-in-from-top-10 duration-700 delay-1100">
                        <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1"/>
                        <span className="text-xs text-muted-foreground">vs Old Regime</span>
                    </div> 
                </div>
            </div>
        </section>
    );
} 