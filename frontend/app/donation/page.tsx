"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  Heart, 
  ArrowRight, 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Clock, 
  Lock, 
  CheckCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Quote,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function DonationPage() {
  const [activeTab, setActiveTab] = useState("One-time");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.a 
            href="#" 
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary font-headline"
            whileHover={{ scale: 1.05 }}
          >
           <div className="flex items-center">
              <div className="w-14 h-14 flex-shrink-0 rounded-md">
            <img src="/logo.jpeg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
          <span className="text-xl font-extrabold font-display text-on-surface tracking-tighter leading-none">Rehablito</span>
<span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none">Physio & Autism Center</span>
<span className="text-[9px] font-bold text-on-surface leading-none">Everyone Deserves Trusted Hands...</span>
          </div>
        </div>
  
          </motion.a>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {["Impact", "Our Mission", "Patient Stories", "Ways to Give"].map((item) => (
              <motion.a
                key={item}
                href="#"
                className="text-on-surface-variant font-medium relative group"
                whileHover={{ color: "var(--color-secondary)" }}
              >
                {item}
                <motion.span 
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"
                />
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              className="hidden sm:block bg-secondary text-white px-6 py-2.5 rounded-xl font-bold tracking-tight"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Donate Now
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-on-surface-variant hover:text-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: { height: "auto", opacity: 1, display: "block" },
            closed: { height: 0, opacity: 0, transitionEnd: { display: "none" } }
          }}
          className="lg:hidden bg-white border-t border-outline-variant/10 overflow-hidden"
        >
          <div className="px-6 py-8 space-y-6">
            {["Impact", "Our Mission", "Patient Stories", "Ways to Give"].map((item) => (
              <motion.a
                key={item}
                href="#"
                className="block text-xl font-bold text-on-surface-variant hover:text-secondary transition-colors"
                onClick={() => setIsMenuOpen(false)}
                variants={{
                  open: { x: 0, opacity: 1 },
                  closed: { x: -20, opacity: 0 }
                }}
              >
                {item}
              </motion.a>
            ))}
            <motion.button
              className="w-full bg-secondary text-white py-4 rounded-xl font-bold text-lg"
              whileTap={{ scale: 0.95 }}
              variants={{
                open: { y: 0, opacity: 1 },
                closed: { y: 20, opacity: 0 }
              }}
            >
              Donate Now
            </motion.button>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-soft-pink-gradient pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <motion.div 
            className="space-y-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2 bg-secondary-container px-4 py-2 rounded-full text-secondary text-xs font-bold tracking-widest uppercase"
            >
              <Heart className="w-3 h-3" /> Rehablito RMS Initiative
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl md:text-7xl font-extrabold text-on-surface font-headline leading-[1.1] tracking-tight"
            >
              Your Gift <span className="text-primary">Saves Lives</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed"
            >
              Your support provides life-changing treatment and clinical precision to those who need it most. Join our mission to transform healthcare today.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <motion.button
                className="bg-secondary text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg shadow-secondary/20"
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                Donate Now <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                className="bg-surface-container-high text-on-surface px-8 py-4 rounded-xl font-bold text-lg"
                whileHover={{ backgroundColor: "var(--color-surface-container-highest)" }}
              >
                View Impact
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-xl overflow-hidden shadow-2xl transform lg:rotate-2">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLJyI4_69GzILzTFC8JQTkA96oHDC0YSHre7aoxZFZcI4AaFYVNdA4H1FZTuEZOABW_-50zKtygW_JE0B2RRxq5Y_oUlSeSwLqmd91wdY8x68F8DwbuADVvEFMcR6sCy1flLRbHK5K3sxjObPIo912eFdgrEWHy2q6NBQbFRXmcLi_3FHKr82jEpKFREgg38ZCdWtd18UaUKf-MJjolNwqdC-lsbp9V6ITZFj1j7WyomRZ4VI1bESgaziQ4s9TwusIKyV9fz7y1LMG" 
                alt="Healthcare professional holding patient's hand"
                className="w-full h-[500px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-outline-variant/20 max-w-xs"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Recovery</p>
                  <p className="font-headline font-bold text-on-surface">98% Rate</p>
                </div>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-secondary h-full"
                  initial={{ width: 0 }}
                  animate={{ width: "98%" }}
                  transition={{ duration: 1.5, delay: 1 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Impact Stats */}
      <section className="py-20 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold font-headline text-on-surface mb-4">Why Donate?</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto font-medium">
              Every contribution fuels our mission to provide elite medical care with human empathy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "500+", label: "Patients Treated Monthly" },
              { icon: Heart, value: "₹1000", label: "Medicines for 5 Patients", highlight: true },
              { icon: ShieldCheck, value: "98%", label: "Recovery Success Rate" },
              { icon: Clock, value: "24/7", label: "Emergency Critical Care" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className={`p-8 rounded-xl flex flex-col justify-between transition-all ${
                  stat.highlight ? "bg-primary text-white" : "bg-white text-on-surface"
                }`}
                whileHover={{ y: -5 }}
              >
                <stat.icon className={`w-10 h-10 mb-6 ${stat.highlight ? "text-white/80" : "text-secondary"}`} />
                <div>
                  <h3 className="text-4xl font-extrabold font-headline mb-2">{stat.value}</h3>
                  <p className={`${stat.highlight ? "text-white/80" : "text-on-surface-variant"} font-medium`}>
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10">
          <h2 className="text-3xl font-extrabold font-headline text-on-surface mb-8">Make a Contribution</h2>
          
          <div className="flex p-1 bg-surface-container-low rounded-xl mb-8">
            {["One-time", "Monthly"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                  activeTab === tab ? "bg-white shadow-sm text-secondary" : "text-on-surface-variant"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {["₹500", "₹1000", "₹2500", "₹5000"].map((amount) => (
              <motion.button
                key={amount}
                className={`py-4 rounded-xl border-2 font-bold transition-all ${
                  amount === "₹1000" 
                    ? "border-secondary bg-secondary/5 text-secondary" 
                    : "border-outline-variant text-on-surface hover:border-secondary hover:text-secondary"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {amount}
              </motion.button>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Custom Amount (₹)</label>
              <input 
                type="number" 
                placeholder="Enter amount"
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary/20 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" placeholder="Rahul" className="w-full bg-surface-container-low border-none rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" placeholder="rahul@example.com" className="w-full bg-surface-container-low border-none rounded-xl p-4 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Cause</label>
                <select className="w-full bg-surface-container-low border-none rounded-xl p-4 outline-none appearance-none">
                  <option>General Fund</option>
                  <option>Cancer Treatment</option>
                  <option>Child Health</option>
                  <option>Emergency Services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">PAN (Optional)</label>
                <input type="text" placeholder="ABCDE1234F" className="w-full bg-surface-container-low border-none rounded-xl p-4 outline-none" />
              </div>
            </div>

            <motion.button
              className="w-full bg-secondary text-white py-5 rounded-xl font-extrabold text-xl shadow-lg shadow-secondary/20"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Donate Securely
            </motion.button>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 opacity-60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">80G Benefit</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Verified NGO</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <h2 className="text-3xl font-extrabold font-headline text-on-surface">Urgent Campaigns</h2>
          
          {[
            {
              title: "Children's Ward Renovation",
              raised: "₹12,45,000",
              goal: "₹20,00,000",
              progress: 62,
              img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnTB6--Fn0eUV-sg_-NAhLO3-KO7ZIotM_4gs9u4RgazztN7VliuX1AjT7h7a8G9QpTF1GMxA_7d4HwqdD3SnDTwDM8ZDlKDsoAssgKd7pCEvEB_zQRxYgYPj-tWp9AShmy_FAhEWAvinnLmgBTmXLMYjIpLX7_ddFk4g1lQ1eCrb7fKXQ3S9P_V-_vuci1etuOduBnX-hVc3AZKHepV49jqYqnwjhW66-Saz_XtvFeiHqqJ2vGSDHoIOQc34wf5j9iQab7wJDTzTY"
            },
            {
              title: "New Dialysis Unit",
              raised: "₹35,00,000",
              goal: "₹50,00,000",
              progress: 70,
              img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjMSIkge5efdnJqpS1MHCqkNudBDDKF1XqG05p7F8bjuus5uMPTj5Tyq49DaAIo25OpADR-pDUyBAkweC5cmHJ8jFshTFwPBt1XOq5kKVTCpKNezqiT7ajTh7MKkMx2bAhSrhY_rvQbRyiCLFYTfdLqc5ahVIr2hUMXg9dqZxuu4nOdjgAe56xiEVbfV70IFq8U_B5PCiATQfvdmlyVqWrdLovlm0nxOVGSuIQz40u6YW3s-YvKUhQWzmUqeN_8KrZfDH5YQztSYrd"
            }
          ].map((campaign, idx) => (
            <motion.div 
              key={idx}
              className="bg-surface-container-low p-6 rounded-xl space-y-6"
              whileHover={{ y: -5 }}
            >
              <div className="rounded-lg overflow-hidden h-40">
                <img src={campaign.img} alt={campaign.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-headline mb-2">{campaign.title}</h3>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-secondary">{campaign.raised} raised</span>
                  <span className="text-on-surface-variant">Goal: {campaign.goal}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    className="bg-secondary h-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${campaign.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <button className="w-full py-3 border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all">
                  Support This
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-surface-container">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl font-extrabold font-headline mb-16">Simple 3-Step Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Choose Amount", desc: "Select a pre-set value or enter your own custom contribution amount." },
              { step: "02", title: "Fill Details", desc: "Provide your basic information and select the cause you'd like to fund." },
              { step: "03", title: "Secure Payment", desc: "Complete your donation through our industry-standard secure gateway." }
            ].map((item, idx) => (
              <div key={idx} className="text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <span className="text-4xl font-extrabold font-headline text-secondary">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold font-headline">{item.title}</h3>
                <p className="text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-extrabold font-headline mb-6 leading-tight">
              Lives Transformed Through <span className="text-primary">Your Kindness</span>
            </h2>
            <p className="text-on-surface-variant mb-8 text-lg">
              Every rupee you donate contributes directly to patient care, equipment, and medical excellence.
            </p>
            <div className="flex gap-4">
              <div className="p-4 bg-surface-container-low rounded-xl">
                <p className="text-3xl font-extrabold text-on-surface">15k+</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Success Stories</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl">
                <p className="text-3xl font-extrabold text-on-surface">45+</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Districts Served</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {[
              {
                quote: "When my son was diagnosed, we had no hope. Thanks to CompassionCare donors, he received the surgery that saved his life. We are eternally grateful.",
                author: "Meera Sharma",
                role: "Mother of Beneficiary",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxGAo_CemfwH50EU7w6WnwfJt27BJano9vanmTjyrTu8_aR4hgP_RX6jN0rEjKKamgRpXpBlNimfLQf4etlMR_NU3TbnHHdeThdMipiw72d1okJ1EWJJv-H71M5AsZjbTkAS_FhKTZVRacHYIu-smIToQx6xcnDfAZagTiqDB2vPKqQugPRkm-_Lk4j6Q575i3lQBcon_Y4qvjMyLlCWpyRxlP6xcGVOpZul1ZkfgKRdzujcI4yFKI8b78Zk4_CkyFJyVtBFmtmCyX"
              },
              {
                quote: "The medical care here is world-class, but the empathy shown by the staff made the recovery process so much easier. Thank you for your support.",
                author: "Rahul Verma",
                role: "Cancer Survivor",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEtFbPOrXZQHT1lXE6DdNKIFgFmkA0AjsYlZyztABaBBNYi_SD2TOylh-rwfpb7dPzykzqWCVOu3hN5YYv39rRBi9S8T8uo9m8pSsq6K7jCYoEJGECw3DaLLi2F1T9C1_jAFO5CeKdMaJcFK2lnIFkLVimmt5cHGR5JJpnJNr-Z-KbUPRx0-8JxtYvEUdd3EfAdx9-p4H1Ag8TOW0GOYprqU9voQXJEsIzeBFPjze_4pFlK8vE4bBwmo86iTn3ynUGJoicdv-ipsHT",
                offset: true
              }
            ].map((testimonial, idx) => (
              <motion.div 
                key={idx}
                className={`bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 relative ${testimonial.offset ? "lg:translate-x-4" : ""}`}
                initial={{ opacity: 0, x: testimonial.offset ? 20 : -20 }}
                whileInView={{ opacity: 1, x: testimonial.offset ? 16 : 0 }}
                viewport={{ once: true }}
              >
                <Quote className="text-secondary/20 w-12 h-12 absolute top-4 right-4" />
                <p className="text-lg italic text-on-surface mb-6 relative z-10">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.img} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold font-headline mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is my donation tax-deductible?", a: "Yes, all donations to CompassionCare Hospital are 100% tax-deductible under Section 80G of the Income Tax Act. You will receive a receipt via email immediately after your transaction." },
              { q: "How is my money used?", a: "Approximately 92% of all funds go directly to patient treatment, equipment maintenance, and medical supplies. The remaining 8% covers essential administrative costs." },
              { q: "When will I receive my receipt?", a: "Digital receipts are generated instantly and sent to your registered email address. Physical receipts can be requested by contacting our donor support team." }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-xl overflow-hidden">
                <summary className="flex justify-between items-center p-6 cursor-pointer list-none font-bold text-lg">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-14 h-14 flex-shrink-0 rounded-md">
            <img src="/logo.jpeg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
          <span className="text-xl font-extrabold font-display text-on-surface tracking-tighter leading-none">Rehablito</span>
<span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none">Physio & Autism Center</span>
<span className="text-[9px] font-bold text-on-surface leading-none">Everyone Deserves Trusted Hands...</span>
          </div>
        </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              A Rehablito RMS initiative dedicated to providing equitable medical care for all through community-powered clinical excellence.
            </p>
            <div className="flex gap-4">
              <motion.a href="#" whileHover={{ y: -2 }} className="text-on-surface-variant hover:text-secondary"><Heart className="w-5 h-5" /></motion.a>
              <motion.a href="#" whileHover={{ y: -2 }} className="text-on-surface-variant hover:text-secondary"><ShieldCheck className="w-5 h-5" /></motion.a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-secondary">Quick Links</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              {["Privacy Policy", "Terms of Service", "Annual Reports", "Transparency Center"].map((link) => (
                <li key={link}><a href="#" className="hover:text-secondary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-secondary">Contact Us</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> rehablito@gmail.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 9204786220 / 9304120054</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" />Rajendra Nagar, Road No. 6C, Patna – 16</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-secondary">Certifications</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-surface-container-low rounded flex items-center justify-center p-2 text-[10px] font-bold text-center leading-tight">
                ISO 9001:2015 CERTIFIED
              </div>
              <div className="h-12 bg-surface-container-low rounded flex items-center justify-center p-2 text-[10px] font-bold text-center leading-tight">
                SEC. 80G COMPLIANT
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-[0.6875rem] text-on-surface-variant uppercase tracking-widest">
            © 2026 Rehablito. All rights reserved. Registered Charity #12345678.
          </p>
        </div>
      </footer>
    </div>
  );
}
