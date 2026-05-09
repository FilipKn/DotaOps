import { AudienceStrip } from "@/components/landing/audience-strip";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingHero } from "@/components/landing/landing-hero";
import { OpenDotaPipeline } from "@/components/landing/opendota-pipeline";
import { TournamentFlow } from "@/components/landing/tournament-flow";

export default function Home() {
  return (
    <main className="landing-page">
      <LandingHero />
      <AudienceStrip />
      <TournamentFlow />
      <OpenDotaPipeline />
      <LandingCta />
    </main>
  );
}
