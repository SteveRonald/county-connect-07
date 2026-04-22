import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuthToken, clearAuthToken } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "@/components/ui/use-toast";
import {
  Users,
  Heart,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  PlusCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  UserPlus,
  Home,
  AlertTriangle,
  AlertCircle,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  Calendar,
  Activity,
  ChevronRight,
  User,
  FileSpreadsheet, // Keep for Excel download icon
  CheckCircle,
  Stethoscope,
  BookOpen,
  Package,
  PieChart,
  HandHeart,
  Link as LinkIcon
} from "lucide-react";

const defaultOverviewStats = [
  { title: "Total Population", value: 0, change: "+0.0%", trend: "up", icon: Users, color: "bg-slate-500" },
  { title: "Health Records", value: 0, change: "+0.0%", trend: "up", icon: Heart, color: "bg-green-500" },
  { title: "Students Enrolled", value: 0, change: "+0.0%", trend: "up", icon: GraduationCap, color: "bg-blue-500" },
  { title: "Social Beneficiaries", value: 0, change: "+0.0%", trend: "up", icon: HandHeart, color: "bg-purple-500" },
];

const mockServiceData = [
  { id: "SVC-001", residentId: "CIT-001", residentName: "John Kamau", type: "Health", service: "Routine Checkup", date: "2025-01-15", status: "Completed", notes: "Blood pressure normal" },
  { id: "SVC-002", residentId: "CIT-002", residentName: "Mary Wanjiku", type: "Education", service: "School Enrollment", date: "2025-01-20", status: "Completed", notes: "Enrolled in Ward 3 Primary" },
  { id: "SVC-003", residentId: "CIT-003", residentName: "Peter Ochieng", type: "Social Support", service: "Cash Transfer", date: "2025-01-18", status: "Active", notes: "Monthly support program" },
];

const mockReports = [
  { id: 1, name: "Monthly Service Summary", type: "Department", date: "2025-01-31", format: "PDF" },
  { id: 2, name: "Health Services Report", type: "Health", date: "2025-01-30", format: "Excel" },
  { id: 3, name: "Education Enrollment Stats", type: "Education", date: "2025-01-29", format: "PDF" },
  { id: 4, name: "Social Support Cases", type: "Social", date: "2025-01-28", format: "Excel" },
];

interface Notification {
  id: number;
  title: string;
  time: string;
  read: boolean;
  content?: string;
}

interface Resident {
  dbId?: number;
  id: string;
  name: string;
  age: number;
  ward: string;
  status: string;
  household: string | null;
  householdId?: number | null;
  gender: string;
}



// Mock data for charts in Reports tab
const monthlyHealthVisits = [
  { month: "Jan", visits: 120 },
  { month: "Feb", visits: 150 },
  { month: "Mar", visits: 130 },
  { month: "Apr", visits: 160 },
  { month: "May", visits: 145 },
  { month: "Jun", visits: 170 },
];

const monthlyEnrollments = [
  { month: "Jan", enrollments: 20 },
  { month: "Feb", enrollments: 35 },
  { month: "Mar", enrollments: 28 },
  { month: "Apr", enrollments: 40 },
  { month: "May", enrollments: 33 },
  { month: "Jun", enrollments: 45 },
];

const serviceActivityData = [
  { name: "Mon", health: 4, education: 2, social: 1 },
  { name: "Tue", health: 3, education: 1, social: 2 },
  { name: "Wed", health: 5, education: 3, social: 1 },
  { name: "Thu", health: 2, education: 1, social: 3 },
  { name: "Fri", health: 4, education: 2, social: 2 },
];

// Mock data for service details dropdowns
const healthServiceDetails = ["Routine Checkup", "Emergency Care", "Vaccination", "Maternal Care", "Child Health"];
const educationServiceDetails = ["School Enrollment", "Attendance Record", "Exam Results", "Scholarship Application"];
const socialServiceDetails = ["Cash Transfer", "Food Assistance", "Housing Support", "Disability Support"];

const uasinGishuWardsByConstituency: Record<string, string[]> = {
  Soy: ["Kuinet/Kapsuswa", "Segero/Barsombe", "Kipsomba", "Soy", "Moi's Bridge"],
  Turbo: ["Ngenyilel", "Tapsagoi", "Kamagut", "Kiplombe", "Kapsaos"],
  Moiben: ["Tembelio", "Sergoit", "Karuna/Meibeki", "Moiben", "Kimumu"],
  Ainabkoi: ["Kapsoya", "Kaptagat", "Ainabkoi/Olare"],
  Kapseret: ["Simat/Kapseret", "Kipkenyo", "Ngeria", "Megun"],
  Kesses: ["Racecourse", "Cheptiret/Kipchamo", "Tulwet/Chuiyat", "Tarakwa"],
};

const constituencyOptions = Object.keys(uasinGishuWardsByConstituency);

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showServiceHistoryModal, setShowServiceHistoryModal] = useState(false);
  const [newServiceDetails, setNewServiceDetails] = useState(""); // State for new service details input
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [population, setPopulation] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [trendRange, setTrendRange] = useState<'year' | 'month'>('year');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [trendData, setTrendData] = useState<any | null>(null);

  // Form states for modals
  const [editForm, setEditForm] = useState({ name: "", age: "", ward: "" });
  const [linkForm, setLinkForm] = useState({ householdId: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    age: "",
    county: "Uasin Gishu",
    constituency: "Soy",
    ward: uasinGishuWardsByConstituency["Soy"][0],
    gender: "Male",
  });
  // New states for facilities and appointments
  const [healthFacilities, setHealthFacilities] = useState([]);
  const [educationFacilities, setEducationFacilities] = useState([]);
  const [socialPrograms, setSocialPrograms] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  // Form states for appointment request modal
  const [appointmentForm, setAppointmentForm] = useState({
    residentId: "",
    serviceCategory: "",
    facilityId: "",
    programId: "",
    serviceType: "",
    preferredDate: "",
    preferredTime: "",
    urgency: "Medium",
    description: ""
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Filtered population based on search query
  const filteredPopulation = population.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    person.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.household && person.household.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const appointmentResidents = population.filter((p) => typeof p.dbId === "number" && p.dbId > 0);

  const displayStats = (stats.length ? stats : defaultOverviewStats).map((stat) => {
    if (stat.title === 'Total Population') {
      return { ...stat, value: population.length };
    }
    return stat;
  });

  const getServiceDetailsOptions = (type: string) => {
    if (type === "health") return healthServiceDetails;
    if (type === "education") return educationServiceDetails;
    if (type === "social") return socialServiceDetails;
    return [];
  };
  useEffect(() => {
    fetchUserInfo();
    fetchPopulation();
    fetchFacilities();
    fetchDashboard();
  }, []);



  const fetchUserInfo = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`,
      };

      const response = await fetch(apiUrl("auth/me"), { headers });
      if (response.ok) {
        const data = await response.json();
        const user = data.user ?? data;
        setUserInfo(user);
        setHouseholdId(user.household_id ? Number(user.household_id) : null);
        // refresh population and dashboard scoped to this user
        fetchPopulation();
        fetchDashboard();
        return user;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      return null;
    }
  };

  const fetchPopulation = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`,
      };
      const currentCitizenId = Number(userInfo?.citizen_id ?? 0);

      const response = await fetch(apiUrl("citizens?scope=mine"), { headers });
      if (response.ok) {
        const data = await response.json();
        const transformedData = data.data.map((citizen: any) => ({
          dbId: citizen.id,
          id: citizen.citizen_code,
          name: citizen.full_name,
          age: citizen.age,
          ward: citizen.ward,
          status: citizen.status,
          household: citizen.household_id ? `Household #${citizen.household_id}` : null,
          householdId: citizen.household_id ? Number(citizen.household_id) : null,
          gender: citizen.gender
        }));
        setPopulation(transformedData);
        return;
      }

      // If logged-in user maps to a citizen, fetch only that citizen
      if (currentCitizenId > 0) {
        const cid = currentCitizenId;
        const singleResponse = await fetch(apiUrl(`citizens/${cid}`), { headers });
        if (singleResponse.ok) {
          const data = await singleResponse.json();
          const c = data.data;
          const transformed = [{
            dbId: c.id,
            id: c.citizen_code,
            name: c.full_name,
            age: c.age,
            ward: c.ward,
            status: c.status,
            household: c.household_id ? `Household #${c.household_id}` : null,
            householdId: c.household_id ? Number(c.household_id) : null,
            gender: c.gender
          }];
          setPopulation(transformed);
          return;
        }
      }

      const allResponse = await fetch(apiUrl("citizens?scope=mine"), { headers });
      if (allResponse.ok) {
        const data = await allResponse.json();
        // Transform API data to match our Resident interface
        const transformedData = data.data.map((citizen: any) => ({
          dbId: citizen.id,
          id: citizen.citizen_code,
          name: citizen.full_name,
          age: citizen.age,
          ward: citizen.ward,
          status: citizen.status,
          household: citizen.household_id ? `Household #${citizen.household_id}` : null,
          householdId: citizen.household_id ? Number(citizen.household_id) : null,
          gender: citizen.gender
        }));
        setPopulation(transformedData);
      }
    } catch (error) {
      console.error("Failed to fetch population:", error);
      setPopulation([]);
    }
  };

  const fetchDashboard = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`,
      };

      const qs = new URLSearchParams();
      qs.set('range', trendRange);
      qs.set('scope', 'mine');
      if (trendRange === 'month' && selectedMonth) qs.set('month', selectedMonth);

      const response = await fetch(apiUrl(`dashboard/summary?${qs.toString()}`), { headers });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats ?? []);
        setRecentActivity(data.recentActivity ?? []);
        setTrendData(data.trend ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
    }
  };

  const handleRangeChange = (range: 'year' | 'month') => {
    setTrendRange(range);
    fetchDashboard();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; // YYYY-MM
    setSelectedMonth(v);
    // fetch for selected month
    setTimeout(() => fetchDashboard(), 0);
  };

  const fetchFacilities = async () => {
    setFacilitiesError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      };

      const [healthRes, educationRes, socialRes] = await Promise.all([
        fetch(apiUrl("facilities/health"), { headers }),
        fetch(apiUrl("facilities/education"), { headers }),
        fetch(apiUrl("facilities/social-programs"), { headers })
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthFacilities(healthData.data);
      } else {
        const errorText = await healthRes.text();
        const message = `Health facilities load failed: ${healthRes.status} ${healthRes.statusText}. ${errorText}`;
        console.error(message);
        setFacilitiesError(message);
      }

      if (educationRes.ok) {
        const educationData = await educationRes.json();
        setEducationFacilities(educationData.data);
      } else {
        const errorText = await educationRes.text();
        console.error(`Education facilities load failed: ${educationRes.status} ${educationRes.statusText}. ${errorText}`);
      }

      if (socialRes.ok) {
        const socialData = await socialRes.json();
        setSocialPrograms(socialData.data);
      } else {
        const errorText = await socialRes.text();
        console.error(`Social programs load failed: ${socialRes.status} ${socialRes.statusText}. ${errorText}`);
      }
    } catch (error: any) {
      const message = `Failed to fetch facilities: ${error?.message ?? error}`;
      console.error(message);
      setFacilitiesError(message);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate("/");
  };



  const handleRegisterResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl("citizens"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          full_name: registerForm.name,
          id_number: `ID${Date.now()}`, // Generate a temporary ID number
          gender: registerForm.gender,
          age: parseInt(registerForm.age),
          county: registerForm.county,
          constituency: registerForm.constituency,
          ward: registerForm.ward,
          status: "Active"
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.household_id) {
          setHouseholdId(Number(data.household_id));
        }
        // Refresh the population list
        fetchPopulation();
        setShowRegisterModal(false);
        setRegisterForm({
          name: "",
          age: "",
          county: "Uasin Gishu",
          constituency: "Soy",
          ward: uasinGishuWardsByConstituency["Soy"][0],
          gender: "Male",
        });
        toast({
          title: "Resident Registered",
          description: `${registerForm.name} has been added to the registry.`,
        });
      } else {
        toast({
          title: "Registration Failed",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to register resident:", error);
      toast({
        title: "Registration Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateResident = () => {
    setPopulation(prev => prev.map(p => 
      p.id === selectedResident.id 
        ? { ...p, name: editForm.name, age: parseInt(editForm.age), ward: editForm.ward } 
        : p
    ));
    setShowUpdateModal(false);
    toast({
      title: "Resident Updated",
      description: `${editForm.name}'s information has been successfully updated.`,
    });
  };

  const handleLinkHousehold = () => {
    const residentId = Number(selectedResident?.dbId ?? 0);
    const targetHouseholdId = householdId ?? Number(linkForm.householdId || 0);

    if (!residentId) {
      toast({
        title: "Link Failed",
        description: "Select a resident first.",
        variant: "destructive",
      });
      return;
    }

    if (!targetHouseholdId) {
      toast({
        title: "Link Failed",
        description: "Your account is not linked to a household yet.",
        variant: "destructive",
      });
      return;
    }

    fetch(apiUrl(`citizens/${residentId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ household_id: targetHouseholdId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || "Unable to link resident to household");
        }

        setPopulation((prev) =>
          prev.map((p) =>
            p.dbId === residentId
              ? { ...p, household: `Household #${targetHouseholdId}`, householdId: targetHouseholdId }
              : p
          )
        );
        setShowLinkModal(false);
        toast({
          title: "Household Linked",
          description: `Resident linked to your household (#${targetHouseholdId}).`,
        });
        fetchPopulation();
      })
      .catch((error) => {
        console.error("Failed to link resident to household:", error);
        toast({
          title: "Link Failed",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleStatusChange = async () => {
    const residentId = Number(selectedResident?.dbId ?? 0);

    if (!residentId) {
      toast({
        title: "Update Failed",
        description: "Select a resident first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(apiUrl(`citizens/${residentId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: "Deceased" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || "Unable to update resident status");
      }

      setPopulation((prev) => prev.map((p) => (p.dbId === residentId ? { ...p, status: "Deceased" } : p)));
      setShowStatusModal(false);
      setSelectedResident((prev) => (prev ? { ...prev, status: "Deceased" } : prev));
      fetchPopulation();
      fetchDashboard();

      toast({
        title: "Resident Marked Deceased",
        description: `${selectedResident?.name ?? "Resident"} has been marked as deceased.`,
      });
    } catch (error: any) {
      console.error("Failed to mark resident as deceased:", error);
      toast({
        title: "Update Failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleViewPDF = (reportName: string) => {
    alert(`Viewing PDF: ${reportName}\nThis will open the PDF viewer.`);
  };

  const handleDownloadReport = (reportName: string, format: string) => {
    alert(`Downloading ${reportName} as ${format}\nThis will start the download.`);
  };

  const handleExportResults = () => {
    const rows = filteredPopulation;
    const headers = ["Resident", "Citizen Code", "Age", "Gender", "Ward", "Household", "Status"];
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [
      headers.join(','),
      ...rows.map((person) => [
        person.name,
        person.id,
        String(person.age),
        person.gender,
        person.ward,
        person.household || '',
        person.status,
      ].map((field) => escapeCsv(field)).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = householdId ? `household-${householdId}-search-results.csv` : 'search-results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Ready",
      description: "Your search results CSV has been downloaded.",
    });
  };

  const handleApplyFilters = () => {
    toast({
      title: "Filters Applied",
      description: "Search results have been updated based on your selection.",
    });
  };
  
  const handleRequestAppointment = async () => {
    const selectedResident = population.find((p) => p.dbId?.toString() === appointmentForm.residentId);
    const citizenId = Number(selectedResident?.dbId ?? 0);
    if (!citizenId) {
      toast({
        title: "Error",
        description: "Select a resident who will receive this service.",
        variant: "destructive"
      });
      return;
    }

    try {
      const requestData: any = {
        citizen_id: citizenId,
        service_category: appointmentForm.serviceCategory,
        service_type: appointmentForm.serviceType,
        preferred_date: appointmentForm.preferredDate,
        preferred_time: appointmentForm.preferredTime || null,
        urgency: appointmentForm.urgency,
        description: appointmentForm.description
      };

      if (appointmentForm.serviceCategory === "Health") {
        requestData.facility_id = parseInt(appointmentForm.facilityId);
      } else if (appointmentForm.serviceCategory === "Education") {
        requestData.facility_id = parseInt(appointmentForm.facilityId);
      } else if (appointmentForm.serviceCategory === "Social Support") {
        requestData.program_id = parseInt(appointmentForm.programId);
      }

      const response = await fetch(apiUrl("appointment-requests"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        setShowServiceModal(false);
        setAppointmentForm({
          residentId: "",
          serviceCategory: "",
          facilityId: "",
          programId: "",
          serviceType: "",
          preferredDate: "",
          preferredTime: "",
          urgency: "Medium",
          description: ""
        });
        toast({
          title: "Appointment Requested",
          description: "Your appointment request has been submitted and is pending admin approval.",
        });
      } else {
        toast({
          title: "Request Failed",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to request appointment:", error);
      toast({
        title: "Request Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="h-[73px] border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="CPMS" className="h-9 w-9" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">CPMS</span>
            <span className="text-xs text-muted-foreground">User Dashboard</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/user-dashboard" className={location.pathname === "/user-dashboard" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}>Dashboard</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4 overflow-y-auto">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "population" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("population")}
            >
              <Users className="w-4 h-4 mr-2" />
              Population Records
            </Button>
            <Button
              variant={activeTab === "services" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("services")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Department Services
            </Button>
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("search")}
            >
              <Search className="w-4 h-4 mr-2" />
              Search & Data Access
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("reports")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayStats.map((stat) => (
                  <Card key={stat.title}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          <div className="flex items-center mt-2">
                            {stat.trend === "up" ? (
                              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                            )}
                            <span className={`text-sm ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                              {stat.change}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">this month</span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${stat.color ?? 'bg-slate-500'} flex items-center justify-center`}>
                          {stat.icon ? (
                            <stat.icon className="w-6 h-6 text-white" />
                          ) : (
                            <Users className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Service Activity Trends</CardTitle>
                  <CardDescription>Daily breakdown of department service interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button variant={trendRange === 'year' ? 'default' : 'ghost'} size="sm" onClick={() => handleRangeChange('year')}>Year</Button>
                      <Button variant={trendRange === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => handleRangeChange('month')}>Month</Button>
                    </div>
                    {trendRange === 'month' && (
                      <Input type="month" value={selectedMonth} onChange={handleMonthChange} />
                    )}
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        // build chart data from trendData or fallback
                        (trendData && trendData.labels && trendData.series) ?
                          trendData.labels.map((lbl: string, idx: number) => ({
                            name: lbl,
                            health: trendData.series.Health[idx] ?? 0,
                            education: trendData.series.Education[idx] ?? 0,
                            social: trendData.series.Social[idx] ?? 0,
                          })) : serviceActivityData
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                        />
                        <Bar dataKey="health" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Health" />
                        <Bar dataKey="education" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Education" />
                        <Bar dataKey="social" fill="hsl(280, 65%, 52%)" radius={[4, 4, 0, 0]} name="Social" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Population Records</CardTitle>
                  <CardDescription>Latest citizen registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredPopulation.slice(0, 3).map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{person.name}</p>
                            <p className="text-sm text-muted-foreground">{person.id} • {person.ward}</p>
                          </div>
                        </div>
                        <Badge variant={person.status === "Active" ? "default" : "secondary"}>
                          {person.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Population Records Tab */}
          {activeTab === "population" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Population Records</h1>
                  <p className="text-muted-foreground">Manage citizen information and demographics</p>
                </div>
                <Button onClick={() => setShowRegisterModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register New Resident
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Search citizens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleApplyFilters}>
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>ID & Age</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Household</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPopulation.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px]">{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{person.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{person.id}</div>
                            <div className="text-xs text-muted-foreground">Age {person.age}</div>
                          </TableCell>
                          <TableCell>{person.ward}</TableCell>
                          <TableCell>{person.householdId ? `#${person.householdId}` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={person.status === "Active" ? "default" : "secondary"}>{person.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedResident(person); setShowViewModal(true); }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { 
                                  setSelectedResident(person); 
                                  setEditForm({ name: person.name, age: person.age.toString(), ward: person.ward });
                                  setShowUpdateModal(true); 
                                }}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                {person.status !== "Deceased" ? (
                                  <DropdownMenuItem onClick={() => { setSelectedResident(person); setShowStatusModal(true); }}>
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Mark Deceased
                                  </DropdownMenuItem>
                                ) : null}
                                {householdId ? (
                                  <DropdownMenuItem onClick={() => { setSelectedResident(person); setShowLinkModal(true); }}>
                                    <LinkIcon className="w-4 h-4 mr-2" /> Link Household
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Department Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Department Services</h1>
                  <p className="text-muted-foreground">Request appointments at health facilities, schools, and social programs</p>
                </div>
                <Button onClick={() => setShowServiceModal(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Request Appointment
                </Button>
              </div>

              <Tabs defaultValue="health" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="health">Health Facilities</TabsTrigger>
                  <TabsTrigger value="education">Education Facilities</TabsTrigger>
                  <TabsTrigger value="social">Social Programs</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-green-500" />
                        Health Facilities
                      </CardTitle>
                      <CardDescription>Available hospitals, clinics, and health centers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {facilitiesError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          <p className="font-semibold">Unable to load hospitals</p>
                          <p>{facilitiesError}</p>
                          <p className="mt-2">Make sure the API backend is running at <span className="font-semibold">http://127.0.0.1:8001</span> and refresh the page.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {healthFacilities.map((facility: any) => (
                            <Card key={facility.id} className="border-l-4 border-l-green-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold">{facility.name}</h3>
                                    <p className="text-sm text-muted-foreground">{facility.type} • {facility.level}</p>
                                    <p className="text-sm">{facility.ward}</p>
                                    {facility.phone && <p className="text-sm">📞 {facility.phone}</p>}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setAppointmentForm({
                                        ...appointmentForm,
                                        serviceCategory: "Health",
                                        facilityId: facility.id.toString()
                                      });
                                      setShowServiceModal(true);
                                    }}
                                  >
                                    Request Appointment
                                  </Button>
                                </div>
                                {facility.services_offered && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">Services:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(() => {
                                        try {
                                          const services = JSON.parse(facility.services_offered || '[]');
                                          return services.map((service: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {service}
                                            </Badge>
                                          ));
                                        } catch {
                                          return null;
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Education Facilities
                      </CardTitle>
                      <CardDescription>Available schools and educational institutions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {educationFacilities.map((facility: any) => (
                          <Card key={facility.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold">{facility.name}</h3>
                                  <p className="text-sm text-muted-foreground">{facility.type}</p>
                                  <p className="text-sm">{facility.ward}</p>
                                  {facility.phone && <p className="text-sm">📞 {facility.phone}</p>}
                                  <p className="text-sm">Capacity: {facility.capacity} • Enrolled: {facility.current_enrollment}</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentForm({
                                      ...appointmentForm,
                                      serviceCategory: "Education",
                                      facilityId: facility.id.toString()
                                    });
                                    setShowServiceModal(true);
                                  }}
                                >
                                  Request Enrollment
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-500" />
                        Social Support Programs
                      </CardTitle>
                      <CardDescription>Available social assistance and support programs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {socialPrograms.map((program: any) => (
                          <Card key={program.id} className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold">{program.name}</h3>
                                  <p className="text-sm text-muted-foreground">{program.type}</p>
                                  <p className="text-sm">{program.coverage_area}</p>
                                  {program.budget_allocated && (
                                    <p className="text-sm">Budget: {program.currency} {program.budget_allocated.toLocaleString()}</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentForm({
                                      ...appointmentForm,
                                      serviceCategory: "Social Support",
                                      programId: program.id.toString()
                                    });
                                    setShowServiceModal(true);
                                  }}
                                >
                                  Apply for Program
                                </Button>
                              </div>
                              {program.description && (
                                <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Search & Data Access Tab */}
          {activeTab === "search" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Search & Data Access</h1>
                <p className="text-muted-foreground">Search and export citizen and service data</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{householdId ? 'Household Search' : 'Global Search'}</CardTitle>
                  <CardDescription>{householdId ? `Find citizens within household #${householdId}` : 'Find citizens by ID, name, location'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={householdId ? "Search within your household..." : "Search by ID, name, or location..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              

              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>Matching citizens and households</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleApplyFilters}>
                      <Filter className="w-4 h-4 mr-2" />
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={handleExportResults}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Results
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Demographics</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPopulation.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">{person.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {person.id} • Age {person.age} • {person.gender}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {person.ward}
                            </div>
                            {person.household && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Home className="w-3 h-3" /> {person.household}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={person.status === "Active" ? "default" : "secondary"}>{person.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedResident(person); setShowViewModal(true); }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                {person.status !== "Deceased" ? (
                                  <DropdownMenuItem onClick={() => { setSelectedResident(person); setShowStatusModal(true); }}>
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Mark Deceased
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                  <p className="text-muted-foreground">Household-scoped reports and summaries</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <PieChart className="w-5 h-5 text-blue-500" />
                      Household Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{population.length}</div>
                    <p className="text-sm text-muted-foreground">Linked to this account</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Stethoscope className="w-5 h-5 text-green-500" />
                      Health Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.find(s => s.title === 'Health Records')?.value ?? 0}</div>
                    <p className="text-sm text-muted-foreground">Household-scoped</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      Student Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.find(s => s.title === 'Students Enrolled')?.value ?? 0}</div>
                    <p className="text-sm text-muted-foreground">Household-scoped</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-5 h-5 text-purple-500" />
                      Support Cases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.find(s => s.title === 'Social Beneficiaries')?.value ?? 0}</div>
                    <p className="text-sm text-muted-foreground">Household-scoped</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Household Report Preview</CardTitle>
                  <CardDescription>Resident and activity data for this household only</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredPopulation.slice(0, 5).map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-muted-foreground">{person.id} • {person.ward}</p>
                        </div>
                        <Badge variant={person.status === "Active" ? "default" : "secondary"}>{person.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


        </main>
      </div>

      {/* Register New Resident Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Register New Resident</CardTitle>
              <CardDescription>Add a new citizen to the system</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegisterResident}>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input required placeholder="Enter full name" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input required type="number" placeholder="Age" value={registerForm.age} onChange={e => setRegisterForm({...registerForm, age: e.target.value})} />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select className="w-full p-2 border rounded" value={registerForm.gender} onChange={e => setRegisterForm({...registerForm, gender: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>County</Label>
                  <Input value={registerForm.county} disabled />
                </div>
                <div>
                  <Label>Constituency</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={registerForm.constituency}
                    onChange={e => {
                      const constituency = e.target.value;
                      const wards = uasinGishuWardsByConstituency[constituency] ?? [];
                      setRegisterForm({ ...registerForm, constituency, ward: wards[0] ?? "" });
                    }}
                  >
                    {constituencyOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Ward</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={registerForm.ward}
                    onChange={e => setRegisterForm({ ...registerForm, ward: e.target.value })}
                  >
                    {(uasinGishuWardsByConstituency[registerForm.constituency] ?? []).map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
              <CardContent className="flex gap-2 pt-0">
                <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
                <Button type="submit">Register Resident</Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* View Resident Profile Modal */}
      {showViewModal && selectedResident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Resident Profile</CardTitle>
              <CardDescription>View resident information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl">{selectedResident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{selectedResident.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedResident.id} • {selectedResident.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 pt-2">
                <div><p className="text-xs text-muted-foreground">Age</p><p className="font-medium">{selectedResident.age}</p></div>
                <div><p className="text-xs text-muted-foreground">Ward</p><p className="font-medium">{selectedResident.ward}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline">{selectedResident.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Household</p><p className="font-medium">{selectedResident.household || "Not assigned"}</p></div>
              </div>
              <div className="pt-4 flex gap-2">
                <Button className="flex-1" onClick={() => setShowViewModal(false)}>Close</Button>
                <Button variant="outline" onClick={() => { setShowViewModal(false); setShowServiceHistoryModal(true); }}>Service History</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Resident Info Modal */}
      {showUpdateModal && selectedResident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Resident Information</CardTitle>
              <CardDescription>Edit resident details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Age</Label>
                <Input 
                  type="number" 
                  value={editForm.age} 
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} 
                />
              </div>
              <div>
                <Label>Ward</Label>
                <Input 
                  value={editForm.ward} 
                  onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })} 
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
                <Button onClick={handleUpdateResident}>Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link to Household Modal */}
      {showLinkModal && selectedResident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Link to Household</CardTitle>
              <CardDescription>Assign resident to a household</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Resident</Label>
                <Input value={selectedResident.name} disabled />
              </div>
              <div>
                <Label>Household ID</Label>
                <Input 
                    value={householdId ? String(householdId) : linkForm.householdId}
                    disabled
                />
                  <p className="text-xs text-muted-foreground mt-1">
                    This uses your linked household automatically.
                  </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLinkModal(false)}>Cancel</Button>
                <Button onClick={handleLinkHousehold}>Link</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedResident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Mark Resident as Deceased</CardTitle>
              <CardDescription>Confirm the resident has passed away before saving this status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This action will update the resident status to Deceased in the system.
              </div>
              <div>
                <Label>Resident</Label>
                <Input value={selectedResident.name} disabled />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleStatusChange}>Mark Deceased</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Appointment Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Request Appointment</CardTitle>
              <CardDescription>Schedule an appointment at a facility or apply for a program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Resident Receiving Service</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={appointmentForm.residentId}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, residentId: e.target.value })}
                >
                  <option value="">Select resident</option>
                  {appointmentResidents.map((person) => (
                    <option key={person.id} value={String(person.dbId)}>
                      {person.name} • {person.id}
                    </option>
                  ))}
                </select>
                {appointmentResidents.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    No household residents found. Create a resident first.
                  </p>
                )}
              </div>

              <div>
                <Label>Service Category</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={appointmentForm.serviceCategory}
                  onChange={(e) => setAppointmentForm({...appointmentForm, serviceCategory: e.target.value, facilityId: "", programId: ""})}
                >
                  <option value="">Select category</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Social Support">Social Support</option>
                </select>
              </div>

              {appointmentForm.serviceCategory === "Health" && (
                <div>
                  <Label>Select a Hospital or Clinic for Treatment</Label>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                      {healthFacilities.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground">
                          No hospitals available
                        </div>
                      ) : (
                        healthFacilities.map((facility: any) => (
                          <div
                            key={facility.id}
                            onClick={() => setAppointmentForm({...appointmentForm, facilityId: facility.id.toString()})}
                            className={`p-3 border rounded cursor-pointer transition-all ${
                              appointmentForm.facilityId === facility.id.toString()
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{facility.name}</p>
                                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                  <p>🏥 {facility.type} • {facility.level}</p>
                                  {facility.phone && <p>📞 {facility.phone}</p>}
                                  {facility.ward && <p>📍 {facility.ward}</p>}
                                  {facility.capacity && <p>👥 Capacity: {facility.capacity} beds</p>}
                                </div>
                              </div>
                              <div className="ml-2">
                                {appointmentForm.facilityId === facility.id.toString() && (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            {facility.services_offered && (
                              <div className="mt-2 text-xs text-gray-600">
                                <p className="font-medium">Services:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(() => {
                                    try {
                                      const services = JSON.parse(facility.services_offered || '[]');
                                      return services.slice(0, 3).map((service: string, idx: number) => (
                                        <span key={idx} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                          {service}
                                        </span>
                                      ));
                                    } catch {
                                      return null;
                                    }
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {appointmentForm.facilityId && (
                      <div className="bg-green-50 p-3 rounded border border-green-200 mt-3">
                        {(() => {
                          const selected = healthFacilities.find((f: any) => f.id.toString() === appointmentForm.facilityId);
                          if (!selected) return null;
                          return (
                            <div className="text-sm space-y-2">
                              <p className="font-semibold text-green-900">✓ Selected: {selected.name}</p>
                              <p className="text-green-700">You will receive treatment from doctors at this facility.</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {appointmentForm.serviceCategory === "Education" && (
                <div>
                  <Label>Select Education Facility</Label>
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 border rounded"
                      value={appointmentForm.facilityId}
                      onChange={(e) => setAppointmentForm({...appointmentForm, facilityId: e.target.value})}
                    >
                      <option value="">-- Choose a school --</option>
                      {educationFacilities.map((facility: any) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.name} • {facility.type}
                        </option>
                      ))}
                    </select>
                    {appointmentForm.facilityId && (
                      <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        {(() => {
                          const selected = educationFacilities.find((f: any) => f.id.toString() === appointmentForm.facilityId);
                          if (!selected) return null;
                          return (
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-indigo-900">{selected.name}</p>
                              <p className="text-indigo-700">{selected.type}</p>
                              {selected.phone && <p className="text-indigo-600">📞 {selected.phone}</p>}
                              {selected.ward && <p className="text-indigo-600">📍 {selected.ward}</p>}
                              {selected.capacity && (
                                <p className="text-indigo-600 text-xs mt-2">
                                  Capacity: {selected.capacity} | Enrolled: {selected.current_enrollment}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {appointmentForm.serviceCategory === "Social Support" && (
                <div>
                  <Label>Select Social Program</Label>
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 border rounded"
                      value={appointmentForm.programId}
                      onChange={(e) => setAppointmentForm({...appointmentForm, programId: e.target.value})}
                    >
                      <option value="">-- Choose a program --</option>
                      {socialPrograms.map((program: any) => (
                        <option key={program.id} value={program.id}>
                          {program.name} • {program.type}
                        </option>
                      ))}
                    </select>
                    {appointmentForm.programId && (
                      <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        {(() => {
                          const selected = socialPrograms.find((p: any) => p.id.toString() === appointmentForm.programId);
                          if (!selected) return null;
                          return (
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-purple-900">{selected.name}</p>
                              <p className="text-purple-700">{selected.type}</p>
                              {selected.description && <p className="text-purple-600 text-xs">{selected.description}</p>}
                              {selected.coverage_area && <p className="text-purple-600 text-xs">Coverage: {selected.coverage_area}</p>}
                              {selected.budget_allocated && (
                                <p className="text-purple-600 text-xs mt-2">
                                  Budget: {selected.currency} {selected.budget_allocated.toLocaleString()}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>Service Type</Label>
                <Input
                  placeholder="e.g., Routine Checkup, School Enrollment, Cash Transfer"
                  value={appointmentForm.serviceType}
                  onChange={(e) => setAppointmentForm({...appointmentForm, serviceType: e.target.value})}
                />
              </div>

              <div>
                <Label>Preferred Date</Label>
                <Input
                  type="date"
                  value={appointmentForm.preferredDate}
                  onChange={(e) => setAppointmentForm({...appointmentForm, preferredDate: e.target.value})}
                />
              </div>

              <div>
                <Label>Preferred Time (Optional)</Label>
                <Input
                  type="time"
                  value={appointmentForm.preferredTime}
                  onChange={(e) => setAppointmentForm({...appointmentForm, preferredTime: e.target.value})}
                />
              </div>

              <div>
                <Label>Urgency</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={appointmentForm.urgency}
                  onChange={(e) => setAppointmentForm({...appointmentForm, urgency: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Additional details about your request..."
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm({...appointmentForm, description: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowServiceModal(false);
                  setAppointmentForm({
                    residentId: "",
                    serviceCategory: "",
                    facilityId: "",
                    programId: "",
                    serviceType: "",
                    preferredDate: "",
                    preferredTime: "",
                    urgency: "Medium",
                    description: ""
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleRequestAppointment}>Submit Request</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service History Modal */}
      {showServiceHistoryModal && selectedResident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Complete service history for {selectedResident.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockServiceData.filter(s => s.residentId === selectedResident.id).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">{service.type} • {service.date}</p>
                      <p className="text-xs text-muted-foreground">{service.notes}</p>
                    </div>
                    <Badge variant={service.status === "Completed" ? "default" : "secondary"}>
                      {service.status}
                    </Badge>
                  </div>
                ))}
                {mockServiceData.filter(s => s.residentId === selectedResident.id).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No service records found</p>
                )}
              </div>
              <div className="mt-6">
                <Button onClick={() => setShowServiceHistoryModal(false)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
}
