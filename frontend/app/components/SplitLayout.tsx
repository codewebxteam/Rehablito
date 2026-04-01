"use client";
import { motion } from "motion/react";
import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

interface SplitLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftBgImage: string;
}

export default function SplitLayout({ leftContent, rightContent, leftBgImage }: SplitLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-surface font-body text-on-surface">
      {/* Left Side: Visual Narrative (Desktop) */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative bg-primary overflow-hidden p-12 lg:p-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={leftBgImage}
            alt="Rehabilitation background"
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 50vw"
            className="object-cover opacity-80 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-primary/60 via-transparent to-transparent"></div>
        </div>
        
        {/* Full-height container for flexible positioning */}
        <div className="relative z-10 w-full h-full max-w-3xl mx-auto">
          {leftContent}
        </div>
        
        {/* Abstract Decoration */}
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl"></div>
      </section>

      {/* Right Side: Form & Mobile Experience */}
      <section className="w-full md:w-1/2 lg:w-2/5 bg-surface-container-lowest relative flex flex-col form-gradient overflow-y-auto min-h-screen">
        {/* Mobile Background Image (Subtle) */}
        <div className="md:hidden absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <Image
            src={leftBgImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Brand Header (Mobile & Desktop Context) */}
        <div className="relative z-10 p-6 md:p-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-sage flex items-center justify-center md:hidden">
               <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-xl font-headline font-extrabold tracking-tight text-on-surface">Rehablito RMS</span>
          </div>
          <Link
            href="/"
            aria-label="Go to home page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-white/80 text-on-surface-variant hover:bg-white transition-colors"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 md:py-12 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {rightContent}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 mt-auto border-t border-outline-variant/10 px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-label text-[10px] text-outline-variant uppercase tracking-widest text-center sm:text-left">© 2026 Rehablito RMS. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="font-label text-[10px] text-outline-variant uppercase tracking-widest hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="font-label text-[10px] text-outline-variant uppercase tracking-widest hover:text-primary transition-colors">Support</a>
          </div>
        </footer>
      </section>
    </main>
  );
}

