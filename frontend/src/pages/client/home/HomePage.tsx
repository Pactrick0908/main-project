import FeaturedCarousel from "@/pages/client/home/FeaturedCarousel";
import UpcomingSection from "./UpcomingSection";
import HowItWorksSection from "./HowItWorksSection";

export default function HomePage() {
  return (
    <div>
      <FeaturedCarousel />
      <UpcomingSection />
      <HowItWorksSection />
    </div>
  );
}
