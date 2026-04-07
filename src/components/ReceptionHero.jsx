import ReceptionHeroImg from "../assets/receptionHero.png";

const ReceptionHero = () => {
  return (
    <div className="flex justify-center my-6">
      <img
        src={ReceptionHeroImg}
        alt="Hospital Reception"
        className="w-64 h-64 object-cover rounded-full shadow-xl border-4 border-white"
      />
    </div>
  );
};

export default ReceptionHero;
