import SearchBar from "./SearchBar";
import heroConnection from "../../../assets/hero-connection.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center z-10 w-full overflow-visible">
      {/* Background Image & Animated Overlays */}
      <div className="absolute inset-0 -z-10 bg-black">
        <img
          src={heroConnection}
          alt="Technical connection"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/30 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-transparent"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/40 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-purple/40 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center mt-20 px-4 max-w-5xl mx-auto w-full animate-fade-in-up">
        
        <h1 className="text-white text-5xl md:text-7xl font-display font-extrabold tracking-tight text-center drop-shadow-lg leading-tight">
          Your Link to <br />
          <span className="text-accent-gold">Trusted</span> Local Pros.
        </h1>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl text-center mt-6 mb-12 drop-shadow-md font-medium">
          Fast, reliable, and verified experts for your home and business. Get it fixed right, the first time.
        </p>

        <SearchBar />
      </div>
    </section>
  );
};

export default HeroSection;
