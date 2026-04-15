import { useState } from "react";
import { Plus, Minus, Inbox } from "lucide-react";

const faqs = [
  {
    q: "How does Fix-Link vet professionals?",
    a: "Every professional undergoes multi-stage background checks, license verification, and continuous performance reviews to ensure elite service quality.",
  },
  {
    q: "What is the payment process?",
    a: "We use a secure escrow system. Your payment is held safely and only released to the professional after you approve the completed work.",
  },
  {
    q: "How do I book a service?",
    a: "Simply search for the service you need, compare professional profiles, request an instant quote, and book directly through our platform.",
  },
  {
    q: "Is there a service guarantee?",
    a: "Yes! Fix-Link provides a service satisfaction guarantee. If the work isn't done correctly, we'll help resolve the issue or provide a refund.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32 relative overflow-hidden bg-background-light dark:bg-background-dark/50">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Questions?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white">
            Commonly Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Queries</span>
          </h2>
          <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about how Fix-Link works and how we protect your service quality.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.length === 0 ? (
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
               <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
               <p className="text-slate-400 font-bold italic tracking-wide">No questions found yet.</p>
            </div>
          ) : (
            faqs.map((faq, idx) => (
              <div 
                key={idx}
                className={`group rounded-[32px] border transition-all duration-500 overflow-hidden ${
                  openIndex === idx 
                  ? 'bg-white dark:bg-slate-900 border-primary shadow-2xl shadow-primary/5' 
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-primary/50'
                }`}
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-8 text-left"
                >
                  <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${openIndex === idx ? 'text-primary' : 'text-slate-900 dark:text-white group-hover:text-primary'}`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${openIndex === idx ? 'bg-primary text-white rotate-180 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                    {openIndex === idx ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
                  </div>
                </button>
                <div 
                  className={`transition-all duration-500 ease-in-out ${
                    openIndex === idx ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-8 text-lg leading-relaxed text-slate-500 dark:text-slate-400 font-medium border-t border-slate-50 dark:border-slate-800/50 pt-6 mx-8">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
