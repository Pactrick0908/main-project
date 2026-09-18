import FeaturedCarousel from "@/pages/client/home/FeaturedCarousel";
import UpcomingSection from "./UpcomingSection";
import StarsSection from "./StarsSection";
import HowItWorksSection from "./HowItWorksSection";

export default function HomePage() {
  return (
    <div>
      <FeaturedCarousel
        heading="Sự kiện nổi bật"
        featured
        tag="Nổi bật"
        hideWhenEmpty
      />
      <FeaturedCarousel />
      <StarsSection />
      <UpcomingSection />
      <HowItWorksSection />
    </div>
  );
}
