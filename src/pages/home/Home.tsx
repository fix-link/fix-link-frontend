import { useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import ServicesSection from "./components/ServicesSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import { HelpCircle } from "lucide-react";

const Home = () => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowHelp(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="font-display bg-background-light dark:bg-background-dark relative">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <FAQSection />
      </main>
      <Footer />

      {/* Floating Help Button */}
      <button 
        className={`fixed bottom-8 right-8 z-[100] flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${showHelp ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
        onClick={() => window.location.href = "mailto:support@fix-link.com"}
      >
        <HelpCircle size={20} />
        <span className="font-black uppercase tracking-widest text-sm">Help?</span>
      </button>
    </div>
  );
};

export default Home;
