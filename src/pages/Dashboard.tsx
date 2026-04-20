import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, GraduationCap, HandHeart, TrendingUp, TrendingDown, Building2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { apiUrl } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface DashboardStats {
  title: string;
  value: number;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}

interface RecentActivity {
  id?: number;
  service_category: string;
  action: string;
  action_date?: string;
  notes?: string;
}

interface TrendData {
  range: string;
  labels: string[];
  series: {
    Health: number[];
    Education: number[];
    Social: number[];
  };
}

const defaultStats: DashboardStats[] = [
  {
    title: "Total Population",
    value: 0,
    change: "+0.0%",
    trend: "up",
    icon: Users,
    color: "bg-primary",
  },
  {
    title: "Health Records",
    value: 0,
    change: "+0.0%",
    trend: "up",
    icon: Heart,
    color: "bg-green-500",
  },
  {
    title: "Students Enrolled",
    value: 0,
    change: "+0.0%",
    trend: "up",
    icon: GraduationCap,
    color: "bg-blue-500",
  },
  {
    title: "Social Beneficiaries",
    value: 0,
    change: "+0.0%",
    trend: "up",
    icon: HandHeart,
    color: "bg-purple-500",
  },
];

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState<{ role: string; name: string; id?: number } | null>(null);
  const [stats, setStats] = useState<DashboardStats[]>(defaultStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; health: number; education: number; social: number }[]>([]);
  const [populationData, setPopulationData] = useState<{ ward: string; population: number }[]>([]);
  const [genderData, setGenderData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        // Check auth and verify admin role
        const authResponse = await fetch(apiUrl("auth/me"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!authResponse.ok) {
          navigate("/", { replace: true });
          return;
        }

        const authData = await authResponse.json();
        const userData = authData.user || authData;
        if (userData.role !== "admin") {
          navigate("/user-dashboard", { replace: true });
          return;
        }
        setUserInfo(userData);

        // Fetch dashboard summary (global stats)
        const summaryResponse = await fetch(apiUrl("dashboard/summary"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();

          // Transform stats
          const transformedStats = summaryData.stats.map((stat: any) => ({
            ...stat,
            icon:
              stat.title === "Total Population"
                ? Users
                : stat.title === "Health Records"
                  ? Heart
                  : stat.title === "Students Enrolled"
                    ? GraduationCap
                    : HandHeart,
            color:
              stat.title === "Total Population"
                ? "bg-primary"
                : stat.title === "Health Records"
                  ? "bg-green-500"
                  : stat.title === "Students Enrolled"
                    ? "bg-blue-500"
                    : "bg-purple-500",
          }));
          setStats(transformedStats);

          // Transform recent activity
          if (summaryData.recentActivity && Array.isArray(summaryData.recentActivity)) {
            setRecentActivity(summaryData.recentActivity);
          }

          // Transform trend data for chart
          if (summaryData.trend && summaryData.trend.labels) {
            const chartData = summaryData.trend.labels.map((label: string, idx: number) => ({
              month: label,
              health: summaryData.trend.series.Health[idx] || 0,
              education: summaryData.trend.series.Education[idx] || 0,
              social: summaryData.trend.series["Social"] ? summaryData.trend.series["Social"][idx] || 0 : summaryData.trend.series["Social Support"]?.[idx] || 0,
            }));
            setTrendData(chartData);
          }
        } else {
          toast({ title: "Error", description: "Failed to fetch dashboard summary", variant: "destructive" });
        }

        // Fetch all citizens for population data
        const citizensResponse = await fetch(apiUrl("citizens"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (citizensResponse.ok) {
          const citizensData = await citizensResponse.json();
          const citizens = citizensData.data || [];

          // Group by ward for population by ward chart
          const wardCounts: Record<string, number> = {};
          let maleCount = 0;
          let femaleCount = 0;

          citizens.forEach((citizen: any) => {
            const ward = citizen.ward || "Unknown";
            wardCounts[ward] = (wardCounts[ward] || 0) + 1;

            if (citizen.gender?.toLowerCase() === "male") {
              maleCount++;
            } else if (citizen.gender?.toLowerCase() === "female") {
              femaleCount++;
            }
          });

          // Convert ward counts to chart format
          const wardData = Object.entries(wardCounts).map(([ward, count]) => ({
            ward,
            population: count as number,
          }));
          setPopulationData(wardData);

          // Set gender data
          setGenderData([
            { name: "Male", value: maleCount, color: "hsl(199, 89%, 38%)" },
            { name: "Female", value: femaleCount, color: "hsl(173, 58%, 39%)" },
          ]);
        }
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Population by Ward */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Population by Ward</CardTitle>
            <CardDescription>Distribution across all wards in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="ward" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="population" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Male vs Female population</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {genderData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Population Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Activity Trend</CardTitle>
            <CardDescription>Monthly service activity across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="health" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)" }}
                  name="Health"
                />
                <Line 
                  type="monotone" 
                  dataKey="education" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(217, 91%, 60%)" }}
                  name="Education"
                />
                <Line 
                  type="monotone" 
                  dataKey="social" 
                  stroke="hsl(280, 85%, 65%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(280, 85%, 65%)" }}
                  name="Social"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest service actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const date = activity.action_date ? new Date(activity.action_date) : new Date();
                  const timeStr = date.toLocaleString();
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action || "Service action"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.service_category}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{timeStr}</span>
                        </div>
                        {activity.notes && <p className="text-xs text-muted-foreground mt-1">{activity.notes}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
