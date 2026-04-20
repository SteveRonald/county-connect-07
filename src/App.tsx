import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RequireAuth } from "./components/RequireAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import ForgotPassword from "./pages/ForgotPassword";
import UserDashboard from "./pages/UserDashboard";
import Dashboard from "./pages/Dashboard";
import Citizens from "./pages/Citizens";
import Demographics from "./pages/Demographics";
import Health from "./pages/Health";
import Education from "./pages/Education";
import SocialServices from "./pages/SocialServices";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper for dashboard pages
const DashboardPage = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/user-dashboard"
            element={
              <RequireAuth>
                <UserDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage><Dashboard /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/citizens"
            element={
              <RequireAuth>
                <DashboardPage><Citizens /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/demographics"
            element={
              <RequireAuth>
                <DashboardPage><Demographics /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/health"
            element={
              <RequireAuth>
                <DashboardPage><Health /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/education"
            element={
              <RequireAuth>
                <DashboardPage><Education /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/social-services"
            element={
              <RequireAuth>
                <DashboardPage><SocialServices /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <DashboardPage><Reports /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth>
                <DashboardPage><UserManagement /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <DashboardPage><Settings /></DashboardPage>
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
