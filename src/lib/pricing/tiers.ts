// Single source of truth for SassyForge pricing.
//
// Monthly subscription model (Stripe not wired yet — paid tiers render as
// "coming soon"). Any surface that shows pricing must import from here so
// copy never drifts again.

export type PricingTierId = "free" | "starter" | "pro" | "agency";

export interface PricingTier {
  id: PricingTierId;
  name: string;
  /** Numeric monthly USD price. null = custom / talk-to-us. */
  priceMonthly: number | null;
  /** Display string for the big number, e.g. "$0", "$29", "Custom". */
  priceLabel: string;
  /** Suffix shown after the price, e.g. "/month" or "talk to us". */
  unit: string;
  description: string;
  features: string[];
  cta: string;
  /** Internal route or mailto. Omit when comingSoon. */
  href?: string;
  /** Visually emphasised tier ("Most popular"). */
  highlight?: boolean;
  /** Paid + Stripe not wired → button disabled. */
  comingSoon?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceLabel: "$0",
    unit: "/month",
    description: "Try it out — generate 1 tool a month from any website.",
    features: [
      "1 tool per month",
      "ICP analysis from URL + Google",
      "Live tool deployed to Tiiny Host",
      "Lead capture into Supabase",
      "7-day tool retention",
    ],
    cta: "Start free →",
    href: "/signup",
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceLabel: "$29",
    unit: "/month",
    description: "For consultants running outreach every month.",
    features: [
      "5 runs per month",
      "All 6 ideas generated",
      "2 tools built and deployed per run",
      "Full GTM playbook",
      "30-day tool retention",
      "CSV export of leads",
    ],
    cta: "Coming soon",
    comingSoon: true,
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 99,
    priceLabel: "$99",
    unit: "/month",
    description: "Everything in Starter, plus all 6 tools deployed live per run.",
    features: [
      "15 runs per month",
      "All 6 tools built and deployed per run",
      "Custom domain support",
      "90-day tool retention",
      "Webhook on each new lead",
      "Email + Slack delivery",
    ],
    cta: "Coming soon",
    comingSoon: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: null,
    priceLabel: "Custom",
    unit: "talk to us",
    description: "Bulk runs, white-label, and dedicated support.",
    features: [
      "Bulk runs across many websites",
      "White-label deployed tools",
      "API access",
      "Dedicated Slack channel",
      "Priority queue",
    ],
    cta: "Talk to us →",
    href: "mailto:hello@sassyforge.app",
  },
];

/** Convenience lookup by id. */
export const TIER_BY_ID: Record<PricingTierId, PricingTier> = Object.fromEntries(
  PRICING_TIERS.map((t) => [t.id, t])
) as Record<PricingTierId, PricingTier>;
