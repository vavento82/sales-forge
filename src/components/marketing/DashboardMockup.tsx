import { Logo } from "../Logo";

/* Inline-styled "dashboard preview" — pure CSS, no real data. */
export function DashboardMockup() {
  return (
    <div className="grid grid-cols-[200px_1fr] bg-bg text-left">
      {/* sidebar */}
      <aside className="bg-surface border-r border-border p-4 hidden sm:block">
        <div className="mb-5">
          <Logo size={20} />
        </div>
        <nav className="space-y-1 text-[13px]">
          <SidebarItem label="Dashboard" active />
          <SidebarItem label="Generate" />
          <SidebarItem label="Leads" />
          <SidebarItem label="Settings" />
        </nav>
      </aside>

      {/* main content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Your runs</h3>
            <p className="text-xs text-text-secondary mt-0.5">2 runs · 1 tool live</p>
          </div>
          <div className="hidden sm:block bg-primary text-white text-[11px] font-medium rounded-md px-3 py-1.5">
            + New run
          </div>
        </div>

        <div className="space-y-3">
          <RunCard
            company="Open Audience"
            url="open-audience-t1-mxnr.tiiny.site"
            badge={{ label: "Live", color: "green" }}
            leads={47}
          />
          <RunCard
            company="St. James's Place"
            url="st-james-s-place-t1-45vy.tiiny.site"
            badge={{ label: "Building", color: "amber" }}
            leads={0}
          />
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`rounded-md px-2.5 py-1.5 ${
        active ? "bg-primary-light text-primary-dark font-medium" : "text-text-secondary"
      }`}
    >
      {label}
    </div>
  );
}

function RunCard({
  company,
  url,
  badge,
  leads,
}: {
  company: string;
  url: string;
  badge: { label: string; color: "green" | "amber" };
  leads: number;
}) {
  const badgeClass =
    badge.color === "green"
      ? "bg-primary-light text-primary-dark"
      : "bg-amber-100 text-amber-800";
  return (
    <div className="border border-border rounded-lg p-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary truncate">
            {company}
          </span>
          <span
            className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${badgeClass}`}
          >
            {badge.label}
          </span>
        </div>
        <span className="text-[11px] text-text-secondary bg-surface rounded px-1.5 py-0.5 inline-block truncate max-w-[260px]">
          {url}
        </span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-semibold text-text-primary leading-none">
          {leads}
        </div>
        <div className="text-[10px] text-text-secondary mt-1">leads</div>
      </div>
    </div>
  );
}
