

const Footer = () => {
  return (
    <footer className="bg-background-dark text-white border-t border-white/5 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-subtext-dark">
        <p>© {new Date().getFullYear()} Fix-Link. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Cookies Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
