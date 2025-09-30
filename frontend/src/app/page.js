import CardAuth from "../comp/CardAuth";
import ParticlesBackground from "../comp/ParticlesBackground";


export default function Home() {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Full-screen particles background */}
      <ParticlesBackground />

      {/* Centered overlay for the auth card */}
      <div className="absolute inset-0 grid place-items-center p-4 z-10">
        <CardAuth />
      </div>
    </div>
  );
}
