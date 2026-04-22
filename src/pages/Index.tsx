import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, GraduationCap, Heart, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";

const quickStats = [
  { label: "Residents", value: "12.4k", icon: Users },
  { label: "Service Units", value: "48", icon: Building2 },
  { label: "Health Cases", value: "1.2k", icon: Heart },
];

const focusCards = [
  {
    title: "Population Records",
    description: "Keep household and resident data organized for planning and service delivery.",
    icon: Users,
  },
  {
    title: "County Services",
    description: "Track health, education, and social support requests in one place.",
    icon: ShieldCheck,
  },
  {
    title: "Ward Insights",
    description: "Use live summaries to understand activity across wards and departments.",
    icon: GraduationCap,
  },
];

const modules = [
  {
    title: "Health",
    description: "Coordinate facilities, appointments, and resident follow-up with more clarity.",
    image: "/images/health-facility.jpg",
  },
  {
    title: "Education",
    description: "Support enrollment tracking and school-linked resident records.",
    image: "/images/education.jpg",
  },
  {
    title: "Demographics",
    description: "See population distribution and trends for better county planning.",
    image: "/images/demographics.jpg",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border bg-card shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/images/hero-healthcare.jpg"
            alt="County healthcare and resident support"
            loading="eager"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.32),transparent_35%),linear-gradient(90deg,rgba(3,7,18,0.84)_0%,rgba(3,7,18,0.62)_46%,rgba(3,7,18,0.18)_100%)]" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14 lg:min-h-[760px] flex items-end">
            <div className="w-full max-w-6xl mx-auto text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-white" />
                County population and service portal
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Managing resident records and county services should feel simple.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                CPMS helps county teams organize citizen records, monitor service delivery, and keep every ward connected to accurate data.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => navigate("/auth?mode=register")} className="h-11 rounded-full px-6 bg-white text-slate-950 hover:bg-slate-100">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/auth?mode=login")} className="h-11 rounded-full px-6 border border-white/20 bg-white/15 text-white hover:bg-white/20 hover:text-white">
                  Login
                </Button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-5xl lg:mx-auto">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="h-full rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-white/70">{stat.label}</p>
                          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
                        </div>
                        <div className="rounded-full bg-white/15 p-3 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-5xl lg:mx-auto">
                {focusCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="h-full rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/15 p-2 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-medium">{card.title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/75">{card.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 max-w-4xl rounded-[1.75rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md sm:mx-auto sm:p-5 lg:mx-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Search className="h-4 w-4 text-white" />
                  Quick access for county records
                </div>
                <div className="mt-4 grid gap-3 rounded-2xl border border-white/15 bg-slate-950/35 p-4 text-white sm:grid-cols-[1.1fr_0.9fr_0.85fr_auto] sm:items-end">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Search by resident</p>
                    <p className="mt-1 font-medium">Citizen Code</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Scope</p>
                    <p className="mt-1 font-medium">Household</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Status</p>
                    <p className="mt-1 font-medium">Active records</p>
                  </div>
                  <Button className="h-11 rounded-full px-5 bg-white text-slate-950 hover:bg-slate-100">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex justify-center text-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Most Used</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Key county functions</h2>
            </div>
          </div>

          <div className="mt-8 mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:items-stretch">
            {modules.map((module) => (
              <div key={module.title} className="h-full overflow-hidden rounded-[1.75rem] border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={module.image} alt={module.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-5 h-full flex flex-col">
                  <p className="text-lg font-semibold">{module.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Index;
