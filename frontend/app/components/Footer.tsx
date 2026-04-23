import { Share2, Mail, Camera, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const SOCIAL_LINKS: { icon: React.ElementType; href: string; label: string; external?: boolean }[] = [
  { icon: Share2, href: '#', label: 'Share' },
  { icon: Mail, href: 'mailto:rehablito@gmail.com', label: 'Email' },
  { icon: Camera, href: 'https://www.instagram.com/rehablito.patna', label: 'Instagram', external: true },
  { icon: MessageCircle, href: 'https://wa.me/917870066129', label: 'WhatsApp', external: true },
];

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-outline-variant/20 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="space-y-6">
            <div className="flex flex-col justify-center">
              <Link href="/">
                <div className="text-4xl font-extrabold text-black font-display tracking-tighter leading-none">Rehablito</div>
                <span className="text-[14px] font-bold text-[#7dce82] leading-none block">Physio & Autism Center</span>
                <span className="text-[12px] font-bold text-black leading-none block">Everyone Deserves Trusted Hands...</span>
              </Link>
            </div>
            <div className="flex gap-4 mt-8">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="w-10 h-10 rounded-full bg-soft-peach flex items-center justify-center text-brand-sage cursor-pointer hover:bg-brand-rose transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h6 className="font-bold text-sm uppercase tracking-widest text-brand-sage mb-8">Our Programs</h6>
            <ul className="space-y-4 font-semibold text-on-surface-variant">
              {['Physiotherapy', 'Autism Support', 'Post-Op Recovery', 'Family Wellness'].map(item => (
                <li key={item}><a href="/#care-modules" className="hover:text-brand-sage transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-sm uppercase tracking-widest text-brand-sage mb-8">Resources</h6>
            <ul className="space-y-4 font-semibold text-on-surface-variant">
              {['Patient Portal', 'Insurance Guide', 'Our Philosophy', 'Careers'].map(item => (
                <li key={item}><a href="#" className="hover:text-brand-sage transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-sm uppercase tracking-widest text-brand-sage mb-8">Contact</h6>
            <p className="text-on-surface-variant mb-4">Anisabad - Jagdeo Path Rd, Federal Colony,<br/>Haroon Colony Sector-II, Phulwari Sharif,<br/>Patna, Bihar 800002</p>
            <div className="space-y-1 mb-3">
              <a href="tel:+917870066129" className="block font-bold text-brand-sage text-xl hover:underline">+91 78700 66129</a>
              <a href="tel:+919204786220" className="block font-bold text-brand-sage text-xl hover:underline">+91 92047 86220</a>
            </div>
            <a href="mailto:rehablito@gmail.com" className="text-on-surface-variant hover:text-brand-sage transition-colors font-semibold">rehablito@gmail.com</a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/10 pt-8 gap-4">
          <p className="text-sm text-on-surface-variant/60 italic">(c) 2026 Rehablito Boutique Clinics. All rights reserved.</p>
          <div className="flex gap-8 font-bold text-xs uppercase tracking-widest text-on-surface-variant/60">
            <a href="#" className="hover:text-brand-sage transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-sage transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-sage transition-colors">Accessibility</a>
            <Link href="/admin/login" className="hover:text-brand-sage transition-colors">Admin</Link>
            <Link href="/manager/login" className="hover:text-brand-sage transition-colors">Manager</Link>
            <Link href="/staff/login" className="hover:text-brand-sage transition-colors">Staff</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
