"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Menu, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Heart, 
  Camera, 
  MessageCircle, 
  Briefcase,
  Mail,
  Share2,
  ChevronRight,
  LayoutDashboard,
  Stethoscope,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

const Navbar = () => {
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
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-sage rounded-xl flex items-center justify-center text-white font-display font-black text-xl shrink-0 overflow-hidden"><img src="/logo.jpeg" alt="" className="w-full h-full object-cover" /></div>
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-extrabold font-display text-on-surface tracking-tighter leading-none mb-0.5">Rehablito</span>
            <span className="text-[10px] font-bold text-[#7dce82] tracking-wide mt-1 leading-none">Physio & Autism Center</span>
            <span className="text-[9px] font-bold text-on-surface mt-1.5 leading-none">Everyone Deserves Trusted Hands...</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          {['Our Story', 'Care Modules', 'The Experience', 'Locations' , 'Donation'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-bold text-on-surface-variant hover:text-brand-sage transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-sage transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:block bg-brand-sage text-white px-8 py-3 rounded-full font-display font-bold text-sm hover:bg-brand-sage/90 transition-all ambient-shadow active:scale-95">
            Begin Your Journey
          </button>
          
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
          {['Our Story', 'Care Modules', 'The Experience', 'Locations'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`} 
              className="text-lg font-bold text-on-surface-variant"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <button className="w-full bg-brand-sage text-white py-4 rounded-2xl font-display font-bold text-md">
            Begin Your Journey
          </button>
        </div>
      </motion.div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="hero-gradient pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-brand-rose text-brand-sage text-xs font-bold uppercase tracking-widest font-display">
              <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
              Boutique Rehabilitation
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] text-on-surface">
              Healing is a <span className="italic font-light text-brand-sage">Personal</span> Narrative.
            </h1>

            <div className="p-6 bg-white/40 backdrop-blur-sm rounded-2xl border-l-4 border-brand-sage italic text-lg leading-relaxed text-on-surface-variant">
              "After my accident, I didn't just need a therapist; I needed a partner. At Rehablito, I found a community that saw me as a person first, and a patient second."
              <cite className="block mt-4 not-italic font-display font-bold text-sm text-brand-sage uppercase tracking-wider">
                â€” Elena M., Patient Success Story
              </cite>
            </div>

            <button className="bg-brand-sage text-white px-10 py-5 rounded-full font-display font-extrabold text-lg shadow-2xl hover:scale-105 transition-transform">
              Schedule a Consultation
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-7 relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden border-[12px] border-white ambient-shadow">
              <img 
                src="/Landing_Page_Image.png" 
                alt="Therapy session" 
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute -bottom-8 -left-8 glass p-8 rounded-3xl ambient-shadow max-w-[280px] z-20 hidden md:block"
            >
              <Heart className="text-brand-sage mb-4 fill-brand-sage" size={32} />
              <p className="font-sans text-md italic text-on-surface-variant leading-snug">
                "The gentle approach made all the difference in my recovery."
              </p>
            </motion.div>

            <div className="absolute top-12 -right-12 w-64 h-64 bg-soft-peach rounded-full -z-0 opacity-40 blur-3xl animate-pulse" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      name: "James Richardson",
      role: "Post-Op Recovery",
      quote: "The environment at the clinic is so warm. It feels more like a wellness retreat than a medical facility. My progress has been incredible.",
      bgColor: "bg-white"
    },
    {
      name: "Sarah Jenkins",
      role: "Family Care",
      quote: "They took the time to understand my son's unique needs. The Autism Therapy program here is truly human-centric and supportive.",
      bgColor: "bg-mint-green"
    },
    {
      name: "David Chen",
      role: "Physical Therapy",
      quote: "A seamless experience from check-in to session. The technology they use is invisible, letting the care take center stage.",
      bgColor: "bg-white"
    }
  ];

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Voices of Recovery</h2>
          <p className="text-xl text-on-surface-variant">Experience the transformation through the eyes of those we've walked alongside.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${t.bgColor} p-10 rounded-3xl ambient-shadow border border-outline-variant/10`}
            >
              <div className="flex gap-1 mb-6 text-brand-sage">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-lg italic mb-8 text-on-surface-variant leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${i === 0 ? 'bg-soft-peach' : i === 1 ? 'bg-white' : 'bg-brand-rose'}`} />
                <div>
                  <p className="font-bold text-on-surface">{t.name}</p>
                  <p className="text-xs uppercase tracking-widest text-brand-sage font-bold">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const OperationalFriction = () => {
  return (
    <section className="py-24 bg-surface-container-low/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-5xl font-extrabold leading-tight">Eliminate Operational Friction.</h2>
            <p className="text-xl text-on-surface-variant">Behind our human connection lies a state-of-the-art system ensuring your safety and care continuity at every touchpoint.</p>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-brand-sage ambient-shadow">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Secure Records</h4>
                  <p className="text-on-surface-variant">Your health data is protected by hospital-grade encryption and privacy protocols.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-brand-sage ambient-shadow">
                  <Zap size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Seamless Experience</h4>
                  <p className="text-on-surface-variant">Automated check-ins and billing mean you can focus purely on your well-being.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ rotate: 2 }}
              whileInView={{ rotate: 0 }}
              className="bg-white p-4 rounded-[3rem] ambient-shadow"
            >
              <div className="bg-surface-container-low rounded-[2.5rem] p-12 text-center">
                <div className="w-24 h-24 bg-mint-green rounded-full mx-auto mb-8 flex items-center justify-center">
                  <Lock className="text-brand-sage" size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Enterprise Protection</h3>
                <p className="text-on-surface-variant mb-8 italic">"We handle the complexity of clinical management so you only experience the care."</p>
                <div className="flex justify-center gap-4">
                  <div className="px-4 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-widest text-on-surface-variant">HIPAA Compliant</div>
                  <div className="px-4 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-widest text-on-surface-variant">SOC2 Type II</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RoleBasedIntelligence = () => {
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    { title: "For Clinic Operations", desc: "Unified billing, staff management, and real-time utilization analytics in one powerful hub." },
    { title: "For Clinical Excellence", desc: "Precision data tracking and session notes that let you focus on the human connection, not the paperwork." },
    { title: "For Family Connection", desc: "Secure progress sharing and scheduling that keeps you integrated in your loved one's recovery journey." }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative h-[500px] flex items-center justify-center">
            {/* Mock Dashboard Stack */}
            <motion.div 
              animate={{ 
                x: activeRole === 0 ? 0 : -20, 
                y: activeRole === 0 ? 0 : 20, 
                rotate: activeRole === 0 ? 0 : -5,
                scale: activeRole === 0 ? 1.05 : 0.9,
                zIndex: activeRole === 0 ? 40 : 10
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 left-0 w-full max-w-md glass rounded-3xl ambient-shadow p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-brand-sage" />
                  <span className="font-bold text-sm">Admin Dashboard</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-mint-green" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-surface-container-low rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 bg-soft-peach rounded-xl" />
                  <div className="h-16 bg-mint-green rounded-xl" />
                  <div className="h-16 bg-brand-rose rounded-xl" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ 
                x: activeRole === 1 ? 0 : 40, 
                y: activeRole === 1 ? 0 : 40, 
                rotate: activeRole === 1 ? 0 : 5,
                scale: activeRole === 1 ? 1.05 : 0.9,
                zIndex: activeRole === 1 ? 40 : 20
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-10 left-10 w-full max-w-md bg-white rounded-3xl ambient-shadow p-6 border border-brand-rose/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Stethoscope size={20} className="text-brand-sage" />
                  <span className="font-bold text-sm">Care Plan View</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low" />
                  <div className="h-3 w-1/2 bg-surface-container-low rounded" />
                </div>
                <div className="h-24 bg-surface-container-low rounded-2xl border-dashed border-2 border-outline-variant/20" />
              </div>
            </motion.div>

            <motion.div 
              animate={{ 
                x: activeRole === 2 ? 0 : 80, 
                y: activeRole === 2 ? 0 : 80, 
                rotate: activeRole === 2 ? 0 : 10,
                scale: activeRole === 2 ? 1.05 : 0.9,
                zIndex: activeRole === 2 ? 40 : 30
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-20 left-20 w-full max-w-md bg-mint-green rounded-3xl ambient-shadow p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-brand-sage" />
                  <span className="font-bold text-sm">Family Portal</span>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold text-brand-sage uppercase">Milestone Achieved!</div>
                <div className="h-10 bg-brand-sage text-white rounded-xl flex items-center justify-center font-bold text-xs">Send Encouragement</div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-10">
            <h2 className="text-5xl font-extrabold leading-tight text-brand-sage">Role-Based Intelligence</h2>
            <p className="text-xl text-on-surface-variant">Software that adapts to you. Whether you're managing a clinic, providing care, or supporting a loved one, the interface shifts to prioritize what matters most.</p>
            
            <div className="space-y-6">
              {roles.map((item, i) => (
                <div 
                  key={i} 
                  onMouseEnter={() => setActiveRole(i)}
                  className={`p-6 rounded-2xl transition-all cursor-pointer group ${activeRole === i ? 'bg-surface-container-low ring-1 ring-brand-sage/20' : 'hover:bg-surface-container-low/50'}`}
                >
                  <h4 className={`font-bold text-xl mb-2 transition-colors ${activeRole === i ? 'text-brand-sage' : 'group-hover:text-primary'}`}>{item.title}</h4>
                  <p className="text-on-surface-variant">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Services = () => {
  const services = [
    {
      title: "Physiotherapy",
      icon: <Stethoscope size={32} />,
      desc: "Advanced biomechanical analysis and personalized recovery protocols.",
      color: "bg-soft-peach"
    },
    {
      title: "ABA Therapy",
      icon: <Users size={32} />,
      desc: "Compassionate, data-driven behavioral support for neurodiverse journeys.",
      color: "bg-mint-green"
    },
    {
      title: "Occupational Therapy",
      icon: <Zap size={32} />,
      desc: "Restoring independence through functional task mastery and adaptation.",
      color: "bg-brand-rose"
    },
    {
      title: "Speech & Language",
      icon: <Mail size={32} />,
      desc: "Unlocking communication potential through clinical linguistic expertise.",
      color: "bg-surface-container-low"
    }
  ];

  return (
    <section id="care-modules" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-extrabold mb-6">Curated Care Modules</h2>
            <p className="text-xl text-on-surface-variant">Our clinical programs are designed as modular experiences, allowing for a truly bespoke rehabilitation path.</p>
          </div>
          <button className="flex items-center gap-2 font-bold text-brand-sage group">
            View All Programs <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${s.color} p-10 rounded-[2.5rem] ambient-shadow group hover:-translate-y-2 transition-all duration-300`}
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-sage mb-8 shadow-sm group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h4 className="text-2xl font-bold mb-4">{s.title}</h4>
              <p className="text-on-surface-variant leading-relaxed mb-8">{s.desc}</p>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-sage opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Locations = () => {
  const locations = [
    { city: "Beverly Hills", address: "120 Clinical Way, Suite 400", phone: "(888) 123-4567" },
    { city: "Palo Alto", address: "450 Innovation Dr, Level 2", phone: "(888) 765-4321" },
    { city: "Newport Beach", address: "88 Ocean View Terrace", phone: "(888) 999-0000" }
  ];

  return (
    <section id="locations" className="py-24 bg-surface-container-low/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-5xl font-extrabold mb-8">Boutique Clinic Network</h2>
            <p className="text-xl text-on-surface-variant mb-12 leading-relaxed">
              Our spaces are designed to inspire healing. We've replaced the sterile clinical environment with warm, light-filled sanctuaries across California.
            </p>
            <div className="space-y-6">
              {locations.map((loc, i) => (
                <div key={i} className="p-8 bg-white rounded-3xl ambient-shadow border border-outline-variant/10 flex justify-between items-center group cursor-pointer hover:border-brand-sage transition-colors">
                  <div>
                    <h4 className="text-xl font-bold mb-1">{loc.city}</h4>
                    <p className="text-on-surface-variant text-sm">{loc.address}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-soft-peach flex items-center justify-center text-brand-sage group-hover:bg-brand-sage group-hover:text-white transition-all">
                    <Share2 size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-7 relative">
            <div className="aspect-video bg-white rounded-[3rem] ambient-shadow overflow-hidden border-[12px] border-white relative">
              <img 
                src="https://picsum.photos/seed/clinic-interior/1200/800" 
                alt="Clinic Interior" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-xs font-bold uppercase tracking-widest mb-2">Featured Sanctuary</p>
                <h4 className="text-3xl font-bold">Beverly Hills Flagship</h4>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-rose rounded-full -z-10 blur-2xl opacity-60" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-mint-green rounded-full -z-10 blur-3xl opacity-40" />
          </div>
        </div>
      </div>
    </section>
  );
};
const FeatureImageSection = ({ title, desc, image, reverse = false, bgColor = "bg-white" }: { title: string, desc: string, image: string, reverse?: boolean, bgColor?: string }) => {
  return (
    <section className={`relative h-[700px] flex items-center overflow-hidden`}>
      <img 
        src={image} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className={`max-w-7xl mx-auto px-6 relative z-10 w-full flex ${reverse ? 'justify-end' : 'justify-start'}`}>
        <motion.div 
          initial={{ opacity: 0, x: reverse ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          className={`max-w-xl ${bgColor === 'bg-white' ? 'bg-white/90' : 'bg-mint-green/95'} backdrop-blur-xl p-12 rounded-[3rem] ambient-shadow`}
        >
          <h3 className="text-4xl font-extrabold text-brand-sage mb-4">{title}</h3>
          <p className="text-xl text-on-surface-variant mb-8 leading-relaxed">{desc}</p>
          <a href="#" className="inline-flex items-center font-bold text-brand-sage hover:gap-3 transition-all underline underline-offset-8">
            Learn More <ChevronRight className="ml-1" size={20} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-24 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto bg-brand-sage rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-rose/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <h2 className="text-5xl md:text-6xl font-extrabold mb-8 relative z-10 leading-tight">Start Your Wellness Journey Today</h2>
        <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-2xl mx-auto relative z-10">We invite you to experience a new standard of personalized, boutique clinical care.</p>
        
        <div className="flex flex-wrap justify-center gap-6 relative z-10">
          <button className="bg-white text-brand-sage px-12 py-5 rounded-full font-bold text-lg hover:bg-soft-peach transition-all shadow-xl">
            Book an Initial Visit
          </button>
          <button className="bg-white/10 backdrop-blur-md border border-white/30 px-12 py-5 rounded-full font-bold text-lg hover:bg-white/20 transition-all">
            Tour our Clinics
          </button>
        </div>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-outline-variant/20 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="space-y-6">
            <div className="flex flex-col justify-center">
              <div className="text-4xl font-extrabold text-black font-display tracking-tighter leading-none mb-1">Rehablito</div>
              <span className="text-[14px] font-bold text-[#7dce82] tracking-wide mt-1 leading-none">Physio & Autism Center</span>
              <span className="text-[12px] font-bold text-black mt-2 leading-none">Everyone Deserves Trusted Hands...</span>
            </div>
            <div className="flex gap-4 mt-8">
              {[Share2, Mail, Camera, MessageCircle].map((Icon, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-soft-peach flex items-center justify-center text-brand-sage cursor-pointer hover:bg-brand-rose transition-colors">
                  <Icon size={18} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h6 className="font-bold text-sm uppercase tracking-widest text-brand-sage mb-8">Our Programs</h6>
            <ul className="space-y-4 font-semibold text-on-surface-variant">
              {['Physiotherapy', 'Autism Support', 'Post-Op Recovery', 'Family Wellness'].map(item => (
                <li key={item}><a href="#" className="hover:text-brand-sage transition-colors">{item}</a></li>
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
            <p className="text-on-surface-variant mb-4">120 Clinical Way, Suite 400<br/>Boutique District, CA 90210</p>
            <p className="font-bold text-brand-sage text-xl">(888) REHAB-CARE</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/10 pt-8 gap-4">
          <p className="text-sm text-on-surface-variant/60 italic">Â© 2026 Rehablito Boutique Clinics. All rights reserved.</p>
          <div className="flex gap-8 font-bold text-xs uppercase tracking-widest text-on-surface-variant/60">
            <a href="#" className="hover:text-brand-sage transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-sage transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-sage transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen selection:bg-brand-sage selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Testimonials />
        <OperationalFriction />
        <RoleBasedIntelligence />
        <FeatureImageSection 
          title="Precision Physiotherapy"
          desc="Combining clinical data with hands-on expertise to restore your movement and confidence."
          image="https://picsum.photos/seed/physio/1920/1080"
        />
        <FeatureImageSection 
          title="Compassionate ABA"
          desc="Nurturing behavioral growth through data-informed paths that celebrate every child's unique journey."
          image="https://picsum.photos/seed/aba/1920/1080"
          reverse
          bgColor="bg-mint-green"
        />
        <Locations />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

