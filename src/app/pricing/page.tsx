import Link from "next/link";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";

interface Tier {
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  cta: string;
  href?: string;
  highlight?: boolean;
  comingSoon?: boolean;
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    unit: "forever",
    description: "Try it out — generate 1 tool from any website.",
    features: [
      "1 tool per signup",
      "ICP analysis from URL + Google",
      "Live tool deployed to Tiiny Host",
      "Lead capture into Supabase",
      "Standard 7-day tool retention",
    ],
    cta: "Start free →",
    href: "/signup",
  },
  {
    name: "Starter",
    price: "$29",
    unit: "per website",
    description: "One-time payment per company URL — get all 6 ideas + 2 tools built.",
    features: [
      "All 6 ideas generated",
      "2 tools built and deployed",
      "Full GTM playbook",
      "30-day tool retention",
      "CSV export of leads",
    ],
    cta: "Coming soon",
    comingSoon: true,
    highlight: true,
  },
  {
    name: "Pro",
    price: "$79",
    unit: "per website",
    description: "Everything in Starter, plus all 6 tools deployed live.",
    features: [
      "All 6 tools built and deployed",
      "Custom domain support",
      "90-day tool retention",
      "Webhook on each new lead",
      "Email + Slack delivery",
    ],
    cta: "Coming soon",
    comingSoon: true,
  },
  {
    name: "Agency",
    price: "Custom",
    unit: "talk to us",
    description: "White-label, bulk runs, dedicated support.",
    features: [
      "Bulk processing across many websites",
      "White-label deployed tools",
      "API access",
      "Dedicated Slack channel",
      "Priority queue",
    ],
    cta: "Coming soon",
    comingSoon: true,
  },
];

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
            Simple, one-time pricing
          </h1>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed">
            Pay once per website. No subscriptions. No surprises.
          </p>
          <p className="mt-2 text-[13px] text-text-secondary">
            Payments coming soon — sign up free to get started
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
                  {t.price}
                </span>
                <span className="text-sm text-text-secondary">/ {t.unit}</span>
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
              href="mailto:hello@saasforge.app"
              className="text-primary hover:text-primary-dark font-medium"
            >
              hello@saasforge.app
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
