import { ArrowRight, Brackets } from "lucide-react";
import Link from "next/link";

export function LandingCta() {
  return (
    <section className="landing-cta" aria-label="Zacni z DotaOps">
      <div>
        <p className="landing-kicker">Operativni center</p>
        <h2>Vodi turnir, spremljaj tekme in povezi rezultate z analitiko.</h2>
      </div>
      <div className="landing-actions">
        <Link className="landing-button landing-button-primary" href="/dashboard">
          <span>Odpri dashboard</span>
          <ArrowRight size={18} />
        </Link>
        <Link className="landing-button landing-button-secondary" href="/organizator">
          <Brackets size={18} />
          <span>Organizator</span>
        </Link>
      </div>
    </section>
  );
}
