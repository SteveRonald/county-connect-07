import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

interface DemographicsStats {
  title: string;
  value: number;
  icon: any;
  color: string;
}

interface WardData {
  ward: string;
  population: number;
}

const defaultStats: DemographicsStats[] = [
  { title: "Total Population", value: 0, icon: Users, color: "bg-orange-500" },
  { title: "Active Population", value: 0, icon: Users, color: "bg-orange-600" },
];

export default function Demographics() {
  const [stats, setStats] = useState<DemographicsStats[]>(defaultStats);
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemographicsData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        const response = await fetch(apiUrl("demographics/summary"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();

          // Transform stats
          const transformedStats = data.stats.map((stat: any) => ({
            ...stat,
            icon: Users,
            color:
              stat.title === "Total Population"
                ? "bg-orange-500"
                : stat.title === "Active"
                  ? "bg-orange-600"
                  : "bg-gray-500",
          }));
          setStats(transformedStats);

          // Transform ward data
          if (data.populationByWard && Array.isArray(data.populationByWard)) {
            const transformed = data.populationByWard.map((w: any) => ({
              ward: w.ward || "Unknown",
              population: parseInt(w.population || 0),
            }));
            setWardData(transformed);
          }
        } else {
          toast({ title: "Error", description: "Failed to fetch demographics data", variant: "destructive" });
        }
      } catch (error) {
        console.error("Demographics data fetch failed:", error);
        toast({ title: "Error", description: "Failed to load demographics data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDemographicsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading demographics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demographics</h1>
          <p className="text-muted-foreground">Population statistics and geographic distribution</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Population Distribution by Ward */}
      <Card>
        <CardHeader>
          <CardTitle>Population Distribution by Ward</CardTitle>
          <CardDescription>Current population across all wards</CardDescription>
        </CardHeader>
        <CardContent>
          {wardData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wardData}>
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
                <Bar dataKey="population" fill="hsl(24, 95%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">No ward data available</p>
          )}
        </CardContent>
      </Card>

      {/* Wards Summary Grid */}
      {wardData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ward Summary</CardTitle>
            <CardDescription>Population by administrative ward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {wardData.map((ward) => (
                <div key={ward.ward} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">{ward.ward}</span>
                  </div>
                  <p className="text-xl font-bold">{ward.population.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">people</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
