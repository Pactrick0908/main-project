import FeaturedCarousel from "@/pages/client/home/FeaturedCarousel";
import UpcomingSection from "./UpcomingSection";
import StarsSection from "./StarsSection";
import HowItWorksSection from "./HowItWorksSection";

export default function HomePage() {
  return (
    <div>
      <FeaturedCarousel />
      <StarsSection />
      <UpcomingSection />
      <HowItWorksSection />
    </div>
  );
}
