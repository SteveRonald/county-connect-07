import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/user-dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Centralized Population Management System
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              A secure county platform for managing citizen records and service delivery across departments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/auth?mode=login")} className="px-6">
                Login
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth?mode=register")} className="px-6">
                Register
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden">
            <img
              className="w-full h-72 object-cover"
              src="/images/hero.jpg"
              alt="Healthcare service delivery"
              loading="lazy"
            />
            <div className="p-6">
              <p className="font-semibold">Better coordination across departments</p>
              <p className="text-sm text-muted-foreground mt-2">
                CPMS supports evidence-based planning by connecting demographics, health, education, and social services.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Featured modules</h2>
          <p className="mt-2 text-muted-foreground">
            Real-world insights for better services—powered by accurate, timely records.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <img
                className="w-full h-44 object-cover"
                src="/images/education.jpg"
                alt="Education support"
                loading="lazy"
              />
              <div className="p-5">
                <p className="font-semibold">Education</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Track enrollments and school services to strengthen learning outcomes across wards.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
              <img
                className="w-full h-44 object-cover"
                src="/images/health.jpg"
                alt="Healthcare facility"
                loading="lazy"
              />
              <div className="p-5">
                <p className="font-semibold">Health</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Monitor service access and improve referral coordination for better community health.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
              <img
                className="w-full h-44 object-cover"
                src="/images/demographics.jpg"
                alt="Demographics and community"
                loading="lazy"
              />
              <div className="p-5">
                <p className="font-semibold">Demographics</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Understand population distribution and trends to improve budgeting and planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
