"use client";

import React from 'react';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Phone, 
  FileText, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HelpPage() {
  const faqs = [
    { q: 'How do I clock in if geofence fails?', a: 'Ensure your GPS is enabled and you are within 100m of the main building. If it still fails, contact IT support.' },
    { q: 'Can I edit my attendance records?', a: 'Direct editing is not allowed. You must submit a "Correction Request" through the Requests panel.' },
    { q: 'Where can I see my monthly salary slip?', a: 'Salary slips are available in the HR portal, accessible via the "External Links" section below.' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto md:mx-0">
      <div className="space-y-1 text-center md:text-left">
        <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Support Center</p>
        <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">How can we help you?</h3>
      </div>

      <div className="relative mx-auto md:mx-0 max-w-xl md:max-w-none">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
        <input 
          type="text" 
          placeholder="Search for help articles, guides, or FAQs..."
          className="w-full pl-12 pr-6 py-4 md:py-5 bg-surface-container-low border-none rounded-2xl text-base md:text-lg focus:ring-2 focus:ring-primary/20 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm text-center space-y-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-on-surface">Live Chat</h4>
          <p className="text-sm text-on-surface-variant">Speak with our support team in real-time.</p>
          <button className="text-primary font-bold text-sm hover:underline">Start Chat</button>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm text-center space-y-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto">
            <Phone className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-on-surface">Call Support</h4>
          <p className="text-sm text-on-surface-variant">Available 24/7 for emergency clinical issues.</p>
          <button className="text-secondary font-bold text-sm hover:underline">View Numbers</button>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm text-center space-y-4 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-on-surface">Documentation</h4>
          <p className="text-sm text-on-surface-variant">Browse our extensive user guides and manuals.</p>
          <button className="text-tertiary font-bold text-sm hover:underline">Browse Guides</button>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-xl font-headline font-bold text-on-surface px-2">Frequently Asked Questions</h4>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-lowest transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors">{faq.q}</h5>
                <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-all" />
              </div>
              <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <h4 className="font-bold text-on-surface mb-6 text-center md:text-left">External Resources</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary/5 transition-all group">
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary">Hospital HR Portal</span>
            <ExternalLink className="w-4 h-4 text-outline group-hover:text-primary" />
          </a>
          <a href="#" className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary/5 transition-all group">
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary">Clinical Guidelines 2023</span>
            <ExternalLink className="w-4 h-4 text-outline group-hover:text-primary" />
          </a>
        </div>
      </div>
    </div>
  );
}
