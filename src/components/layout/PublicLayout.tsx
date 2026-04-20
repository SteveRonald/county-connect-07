import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, MapPin, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/cpms-logo.svg" alt="CPMS" className="h-9 w-9" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">CPMS</span>
              <span className="text-xs text-muted-foreground">County Government</span>
            </div>
          </Link>

          <nav className="flex-1 flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/auth?mode=login")}>
              Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth?mode=register")}>
              Register
            </Button>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/cpms-logo.svg" alt="CPMS" className="h-8 w-8" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">CPMS</span>
                  <span className="text-xs text-muted-foreground">County Government</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Centralized Population Management System helps county governments efficiently manage citizen records, 
                service delivery, and administrative operations across all departments.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-muted-foreground">Population Management</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Health Services</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Education Services</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Social Support</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contact Info</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>County Headquarters, Main Street</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+254 700 000 000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@county.go.ke</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 County Population Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
