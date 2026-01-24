import ProfessionalCard, { type Professional } from "./ProfessionalCard";

const professionals: Professional[] = [
  {
    id: 1,
    name: "Abebe Kebede",
    role: "Electrician",
    rating: 4.9,
    reviews: 210,
    price: 350,
    image: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: 2,
    name: "Mulugeta Tesfaye",
    role: "Plumber",
    rating: 4.8,
    reviews: 180,
    price: 300,
    image: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  // add more professionals here
];

const TopProfessionals: React.FC = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold">Top Rated Professionals</h2>
      <p className="text-gray-500 mb-8">Top-rated and verified experts near you</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {professionals.map((pro) => (
          <ProfessionalCard key={pro.id} pro={pro} />
        ))}
      </div>
    </main>
  );
};

export default TopProfessionals;
