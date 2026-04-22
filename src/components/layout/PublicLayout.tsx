import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-[#d8c9a6] bg-[#f4efe3]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f4efe3]/90">
        <div className="mx-auto grid h-24 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="CPMS home">
            <img src="/images/logo.png" alt="CPMS" className="h-16 w-16 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-8 text-sm">
            {loggedIn ? (
              <Link to="/user-dashboard" className="text-[#6a5a3f] transition-colors hover:text-[#3f3524]">Dashboard</Link>
            ) : null}
            <Link to="/" className="text-[#6a5a3f] transition-colors hover:text-[#3f3524]">Home</Link>
            <Link to="/about" className="text-[#6a5a3f] transition-colors hover:text-[#3f3524]">About</Link>
            <Link to="/contact" className="text-[#6a5a3f] transition-colors hover:text-[#3f3524]">Contact</Link>
          </nav>

          <div className="justify-self-end flex items-center gap-2">
            {loggedIn ? (
              <Button variant="secondary" onClick={() => navigate("/user-dashboard")}>Dashboard</Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate("/auth?mode=login")}>Login</Button>
            )}
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
                <img src="/images/logo.png" alt="CPMS" className="h-8 w-8" />
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
