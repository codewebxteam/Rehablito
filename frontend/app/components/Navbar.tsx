"use client";
import { Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const isDonation = pathname === '/donation';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'glass py-4 ambient-shadow' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 w-full h-full">
            <div className="w-20 h-20 bg-transparent rounded-xl flex items-center justify-center shrink-0 overflow-hidden"><img src="/logo.jpeg" alt="" className="w-full h-full object-contain scale-110" /></div>
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-extrabold font-display text-on-surface tracking-tighter leading-none">Rehablito</span>
              <span className="text-[10px] font-bold text-[#7dce82] leading-none">Physio & Autism Center</span>
              <span className="text-[9px] font-bold text-on-surface leading-none">Everyone Deserves Trusted Hands...</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {['Our Story', 'Care Modules', 'The Experience', 'Locations', 'Donation'].map((item) =>
            item === 'Donation' ? (
              <Link key={item} href="/donation" className="text-sm font-bold text-on-surface-variant hover:text-brand-sage transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-sage transition-all group-hover:w-full" />
              </Link>
            ) : (
              <Link key={item} href={`/#${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-bold text-on-surface-variant hover:text-brand-sage transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-sage transition-all group-hover:w-full" />
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link href={isDonation ? "/donation" : "/login"} className="hidden sm:block bg-brand-sage text-white px-8 py-3 rounded-full font-display font-bold text-sm hover:bg-brand-sage/90 transition-all ambient-shadow active:scale-95">
            {isDonation ? "Donate Now" : "Begin Your Journey"}
          </Link>

          <button
            className="md:hidden p-2 text-brand-sage"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ height: isMobileMenuOpen ? 'auto' : 0, opacity: isMobileMenuOpen ? 1 : 0 }}
        className="md:hidden overflow-hidden bg-white border-t border-outline-variant/10"
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {['Our Story', 'Care Modules', 'The Experience', 'Locations', 'Donation'].map((item) =>
            item === 'Donation' ? (
              <Link
                key={item}
                href="/donation"
                className="text-lg font-bold text-on-surface-variant"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ) : (
              <Link
                key={item}
                href={`/#${item.toLowerCase().replace(' ', '-')}`}
                className="text-lg font-bold text-on-surface-variant"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            )
          )}
          <Link href={isDonation ? "/donation" : "/login"} className="w-full bg-brand-sage text-white py-4 rounded-2xl font-display font-bold text-md text-center" onClick={() => setIsMobileMenuOpen(false)}>
            {isDonation ? "Donate Now" : "Begin Your Journey"}
          </Link>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
