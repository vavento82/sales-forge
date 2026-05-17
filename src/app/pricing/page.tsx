import Link from "next/link";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { PRICING_TIERS } from "@/lib/pricing/tiers";
import { SubscribeButton } from "@/components/pricing/SubscribeButton";

const tiers = PRICING_TIERS;

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 pt-20 pb-32">
        <div className="max-w-[640px] mx-auto text-center">
          <span className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary">
            Pricing
          </span>
          <h1 className="mt-3 text-[42px] sm:text-[48px] font-bold leading-tight text-text-primary">
            Simple monthly pricing
          </h1>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed">
            Pick a monthly plan that matches your outreach volume. Cancel anytime.
          </p>
          <p className="mt-2 text-[13px] text-text-secondary">
            Paid plans are coming soon — start on the free plan today
          </p>
        </div>

        <div className="mt-15 max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {tiers.map((t) => (
            <article
              key={t.name}
              className={`flex flex-col rounded-2xl p-6 bg-bg ${
                t.highlight
                  ? "border-2 border-primary shadow-md"
                  : "border border-border"
              }`}
            >
              {t.highlight && (
                <span className="self-start mb-3 text-[11px] font-medium uppercase tracking-wide bg-primary-light text-primary-dark rounded-full px-2.5 py-0.5">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold text-text-primary">
                {t.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold text-text-primary leading-none">
                  {t.priceLabel}
                </span>
                <span className="text-sm text-text-secondary">
                  {t.unit.startsWith("/") ? t.unit : ` ${t.unit}`}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                {t.description}
              </p>
              <ul className="mt-5 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13px] text-text-primary"
                  >
                    <Check
                      size={16}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                {t.comingSoon ? (
                  <Button disabled className="w-full">
                    {t.cta}
                  </Button>
                ) : t.stripePriceId &&
                  (t.id === "starter" || t.id === "pro") ? (
                  <SubscribeButton plan={t.id} label={t.cta} />
                ) : (
                  <Link href={t.href!}>
                    <Button className="w-full">{t.cta}</Button>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 max-w-[640px] mx-auto text-center">
          <p className="text-sm text-text-secondary">
            Questions about volume pricing or a custom plan?{" "}
            <a
              href="mailto:hello@sassyforge.app"
              className="text-primary hover:text-primary-dark font-medium"
            >
              hello@sassyforge.app
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
