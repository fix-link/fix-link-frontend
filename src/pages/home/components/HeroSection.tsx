import SearchBar from "./SearchBar";
import heroBg from "../../../assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section
      className="min-h-screen bg-cover bg-center flex items-center justify-center text-center"
      style={{
        backgroundImage:
          `linear-gradient(rgba(94, 100, 190, 0.4), rgba(131, 147, 165, 0.6)), url(${heroBg})`,
      }}
    >
      <div className="mt-20 flex flex-col gap-6 w-full px-4">
        <h1 className="text-white text-4xl md:text-6xl font-black tracking-tight">
          Your Link to Trusted Local Pros.
        </h1>


        <SearchBar />
      </div>
    </section>
  );
};

export default HeroSection;
