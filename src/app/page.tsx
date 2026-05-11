import Link from "next/link";
import Script from "next/script";
import {
  Link as LinkIcon,
  Sparkles,
  Rocket,
  Calculator,
  Activity,
  Wand2,
  HelpCircle,
  GitBranch,
  Gamepad2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardMockup } from "@/components/marketing/DashboardMockup";

// Wistia player HTML. Lives in dangerouslySetInnerHTML so we can drop in the
// exact <wistia-player> custom element + its placeholder <style> without
// fighting TS over the unknown JSX tag. The two JS files are loaded via
// next/script below so Next.js handles their lifecycle properly.
const WISTIA_EMBED_HTML = `
<style>wistia-player[media-id='80ulmk80b2']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/80ulmk80b2/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style>
<wistia-player media-id="80ulmk80b2" aspect="1.7777777777777777"></wistia-player>
`;

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="px-6 pt-[100px] pb-20">
        <div className="max-w-[760px] mx-auto text-center">
          <span className="inline-flex items-center rounded-full bg-primary-light text-primary px-3 py-1 text-xs font-medium tracking-wide">
            ✦ AI-POWERED LEAD MAGNET GENERATOR
          </span>
          <h1 className="mt-5 text-[40px] sm:text-[52px] font-bold leading-[1.1] tracking-tight text-text-primary">
            Turn <span className="text-primary">any website</span> into a micro-SaaS lead magnet
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-[540px] mx-auto">
            Paste a company URL. We analyse their ICP, generate custom interactive tools, and deploy them live — ready to send to prospects in minutes.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Generate your first tool free →</Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="ghost">
                See how it works ↓
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-text-secondary">
            No credit card required · Free forever · Deploy in minutes
          </p>
        </div>

        <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
        <Script
          src="https://fast.wistia.com/embed/80ulmk80b2.js"
          type="module"
          strategy="afterInteractive"
        />
        <div
          className="mt-12 max-w-[760px] mx-auto rounded-2xl overflow-hidden border border-border shadow-lg"
          dangerouslySetInnerHTML={{ __html: WISTIA_EMBED_HTML }}
        />

        <div className="mt-12 max-w-[900px] mx-auto rounded-2xl overflow-hidden border border-border shadow-lg [transform:perspective(1200px)_rotateX(2deg)]">
          <DashboardMockup />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-surface px-6 py-[100px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center max-w-[640px] mx-auto">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary">
              How it works
            </span>
            <h2 className="mt-3 text-[34px] sm:text-[40px] font-bold leading-tight text-text-primary">
              From URL to live tool in 5 minutes
            </h2>
          </div>
          <div className="mt-15 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <StepCard
              num="01"
              icon={<LinkIcon size={32} className="text-primary" />}
              title="Paste your URL"
              body="We scrape the website, run Google research, and build a complete ICP profile automatically."
            />
            <StepCard
              num="02"
              icon={<Sparkles size={32} className="text-primary" />}
              title="Tools get generated"
              body="Claude analyses the ICP and builds custom interactive tools — calculators, quizzes, games — tailored to the exact buyer."
            />
            <StepCard
              num="03"
              icon={<Rocket size={32} className="text-primary" />}
              title="Deploy and share"
              body="Each tool goes live instantly with a unique URL. Send it in cold outreach today."
            />
          </div>
        </div>
      </section>

      {/* TOOL TYPES */}
      <section className="bg-bg px-6 py-[100px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center max-w-[640px] mx-auto">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary">
              What gets built
            </span>
            <h2 className="mt-3 text-[34px] sm:text-[40px] font-bold leading-tight text-text-primary">
              6 types of interactive tools
            </h2>
            <p className="mt-3 text-lg text-text-secondary">
              Every tool tailored to the company&apos;s exact ICP
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ToolTypeCard icon={<Calculator size={28} />} title="ROI Calculator" body="Reveal what they're losing or gaining in real numbers" />
            <ToolTypeCard icon={<Activity size={28} />} title="Diagnostic scorer" body="Score their situation vs industry benchmark" />
            <ToolTypeCard icon={<Wand2 size={28} />} title="Content generator" body="Create personalised output in 60 seconds" />
            <ToolTypeCard icon={<HelpCircle size={28} />} title="Industry quiz" body="Test knowledge, rank vs peers, reveal blind spots" />
            <ToolTypeCard icon={<GitBranch size={28} />} title="Scenario simulator" body="Walk through decisions and see consequences" />
            <ToolTypeCard icon={<Gamepad2 size={28} />} title="Interactive game" body="Gamified trust-building through play" />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="px-6 py-[100px] text-center"
        style={{ background: "linear-gradient(135deg, #085041 0%, #1D9E75 100%)" }}
      >
        <div className="max-w-[640px] mx-auto">
          <Badge color="green" className="bg-white/15 text-white">
            Ready when you are
          </Badge>
          <h2 className="mt-4 text-[34px] sm:text-[40px] font-bold leading-tight text-white">
            Ready to build your first micro-SaaS tool?
          </h2>
          <p className="mt-3 text-lg text-white/80 leading-relaxed">
            Free forever. No credit card. Deploy in minutes.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Start building free →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function StepCard({ num, icon, title, body }: { num: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-bg border border-border rounded-2xl p-7">
      <div className="text-[56px] font-light text-primary opacity-40 leading-none">{num}</div>
      <div className="mt-4">{icon}</div>
      <h3 className="mt-3 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-[15px] text-text-secondary leading-[1.7]">{body}</p>
    </div>
  );
}

function ToolTypeCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-bg border border-border rounded-xl p-6 hover:border-primary hover:shadow-md transition-all duration-150">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}
