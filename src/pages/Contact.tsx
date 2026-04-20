import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

export default function Contact() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/user-dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-muted-foreground max-w-3xl">
          For support, onboarding, or account access, contact your county ICT department.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Send a message</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast({ title: "Message sent", description: "Your message has been submitted." });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@county.go.ke" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="How can we help?"
                  required
                />
              </div>
              <Button type="submit">Submit</Button>
            </form>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Support contacts</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Email:</span> ict-support@county.go.ke</p>
              <p><span className="text-foreground font-medium">Phone:</span> +254 700 000 000</p>
              <p><span className="text-foreground font-medium">Office:</span> County Headquarters, ICT Directorate</p>
              <p className="pt-2">
                Access to CPMS is restricted to authorized users. If you need an account, submit a request above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
