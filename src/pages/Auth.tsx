import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { getAuthToken, setAuthToken } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    if (mode === "register") {
      setIsLogin(false);
    }
    if (mode === "login") {
      setIsLogin(true);
    }

    if (getAuthToken()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, just navigate to dashboard
    setIsSubmitting(true);

    try {
      const endpoint = isLogin ? apiUrl("auth/login") : apiUrl("auth/register");
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Authentication failed";
        toast({
          title: "Authentication error",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      const token = typeof data?.token === "string" ? data.token : null;
      if (!token) {
        toast({
          title: "Authentication error",
          description: "Missing token from server",
          variant: "destructive",
        });
        return;
      }

      setAuthToken(token);
      navigate("/user-dashboard", { replace: true });
    } catch {
      toast({
        title: "Network error",
        description: "Could not connect to server. Ensure backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <img src="/cpms-logo.svg" alt="CPMS" className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">CPMS</h1>
          <p className="text-muted-foreground">Centralized Population Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Enter your credentials to access the system" 
                : "Register for a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@county.go.ke"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password">
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Forgot password?
                    </Button>
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
              {isLogin && (
                <div className="text-center">
                  <Button variant="link" onClick={() => setIsLogin(false)}>
                    Don't have an account? Click here to register
                  </Button>
                </div>
              )}
              {!isLogin && (
                <div className="text-center">
                  <Button variant="link" onClick={() => setIsLogin(true)}>
                    Already have an account? Click here to login
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2024 County Government. All rights reserved.
        </p>
      </div>
    </div>
  );
}
