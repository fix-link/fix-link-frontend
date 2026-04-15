import { useState } from "react";
import { Network, ShieldCheck, Users, Plus, Minus, HelpCircle, MessageCircle } from "lucide-react";

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
];

const AboutSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="about" className="py-24 sm:py-32 relative overflow-hidden bg-background-light dark:bg-background-dark/80">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-text-light dark:text-text-dark">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Fix-Link?</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-subtext-light dark:text-subtext-dark">
            We are redefining how you connect with local professionals. Fast, secure, and built for your peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-24">
          {/* Mission */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-border-light dark:border-border-dark flex flex-col gap-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center -rotate-6">
              <Network size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3 tracking-tight">Our Mission</h3>
              <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
                To simplify the process of finding reliable professionals for all home and business service needs. We cut out the noise and connect you instantly.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="bg-gradient-to-br from-primary to-primary-dark p-8 rounded-[32px] shadow-xl text-white flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center rotate-3">
              <ShieldCheck size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Our Values</h3>
              <p className="text-white/90 leading-relaxed">
                Built on iron-clad trust, quality, and transparency. Every professional is vetted to ensure your complete safety and satisfaction.
              </p>
            </div>
          </div>

          {/* Goal */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-border-light dark:border-border-dark flex flex-col gap-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 text-accent-purple flex items-center justify-center -rotate-3">
              <Users size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3 tracking-tight">Our Goal</h3>
              <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
                To be the most trusted, frictionless link between homeowners, businesses, and leading local experts across the region.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Removed - moved back to separate section */}
      </div>
    </section>
  );
};

export default AboutSection;
