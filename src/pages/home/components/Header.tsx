import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md py-0 border-b border-gray-100 dark:border-gray-800"
        : "bg-transparent py-2"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div
          className={`flex items-center gap-3 font-bold transition-colors duration-300 ${scrolled ? "text-primary" : "text-white"
            }`}
        >
          <span className="text-xl">Fix-Link</span>
        </div>

        <nav
          className={`hidden md:flex gap-8 text-sm font-medium transition-colors duration-300 ${scrolled ? "text-gray-700 dark:text-gray-200" : "text-white"
            }`}
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <a href="#about" className="hover:text-primary transition-colors">
            About
          </a>
          <a href="#services" className="hover:text-primary transition-colors">
            Services
          </a>
          <a href="#faq" className="hover:text-primary transition-colors">
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex gap-2">
          <Link
            to="/signup/email"
            className="bg-primary px-4 h-10 rounded-lg flex items-center text-white font-bold hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="bg-white/20 px-4 h-10 rounded-lg flex items-center font-bold hover:bg-white/30 transition-colors"
          >
            <span className={scrolled ? "text-primary" : "text-white"}>Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
