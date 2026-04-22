import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-3xl border bg-card p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Talk to the CPMS Support Team</h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            For support, onboarding, or account access requests, reach out to your county ICT department.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-sm">
            <h2 className="text-xl font-semibold">Send a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fill out the form and our ICT team will respond to you.</p>
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

          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl font-semibold">Support contacts</h2>
              <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-primary" />
                  <p><span className="text-foreground font-medium">Email:</span> ict-support@county.go.ke</p>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-primary" />
                  <p><span className="text-foreground font-medium">Phone:</span> +254 700 000 000</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <p><span className="text-foreground font-medium">Office:</span> County Headquarters, ICT Directorate</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-6 sm:p-7">
              <h3 className="font-semibold">Access Notice</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Access to CPMS is restricted to authorized users. If you need an account, submit a request above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
