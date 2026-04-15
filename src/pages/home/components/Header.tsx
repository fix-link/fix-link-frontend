import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ease-in-out ${scrolled
        ? "py-2"
        : "py-4"
        }`}
    >
      <div className={`max-w-7xl mx-auto px-6 h-16 flex items-center justify-between transition-all duration-500 rounded-full ${scrolled ? "glass-panel" : "bg-transparent"}`}>
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <span className={`text-2xl font-display font-bold tracking-tight transition-all duration-300 ${scrolled ? "text-gradient" : "text-white drop-shadow-md"}`}>
            Fix-Link
          </span>
        </Link>

        <nav
          className={`hidden md:flex gap-8 font-medium transition-colors duration-300 ${scrolled ? "text-text-light dark:text-text-dark" : "text-white drop-shadow-md"
            }`}
        >
          <Link to="/" className="relative hover:text-primary transition-colors group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <a href="#about" className="relative hover:text-primary transition-colors group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </a>
          <a href="#services" className="relative hover:text-primary transition-colors group">
            Services
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </a>
          <a href="#faq" className="relative hover:text-primary transition-colors group">
            FAQ
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </a>
        </nav>

        <div className="hidden md:flex gap-3 items-center">
          <Link
            to="/login"
            className={`font-semibold hover:-translate-y-0.5 transition-all duration-300 ${scrolled ? "text-text-light hover:text-primary dark:text-text-dark" : "text-white hover:text-white/80"}`}
          >
            Log in
          </Link>
          <Link
            to="/signup/email"
            className={`px-5 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${scrolled ? "bg-primary text-white hover:bg-primary-dark" : "bg-white text-primary hover:bg-white/90"}`}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
