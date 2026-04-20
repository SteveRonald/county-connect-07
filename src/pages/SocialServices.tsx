import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandHeart, Users, Home, Briefcase, Heart, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

interface StatItem {
  title: string;
  value: string;
}

interface SocialServicesData {
  stats: StatItem[];
  appointmentChart: { name: string; value: number }[];
  typeBreakdown: { name: string; value: number }[];
}

const staticStats = [
  { title: "Available Programs", icon: Heart, color: "bg-purple-500" },
  { title: "Requested Appointments", icon: HandHeart, color: "bg-purple-600" },
  { title: "Approved Appointments", icon: Briefcase, color: "bg-red-500" },
  { title: "Awaiting Approval", icon: Home, color: "bg-blue-500" },
];

const chartColors = [
  "hsl(280, 65%, 52%)",
  "hsl(280, 65%, 62%)",
  "hsl(280, 65%, 72%)",
  "hsl(280, 65%, 45%)",
  "hsl(280, 65%, 35%)",
];

export default function SocialServices() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [appointmentChart, setAppointmentChart] = useState<SocialServicesData["appointmentChart"]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<SocialServicesData["typeBreakdown"]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Cash Transfer",
    description: "",
    eligibility_criteria: "",
    coverage_area: "",
    budget_allocated: "",
    currency: "KES",
  });

  useEffect(() => {
    const fetchSocialServicesData = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(apiUrl("social-services/summary"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error("Failed to fetch social services data");
        }

        const data: SocialServicesData = await response.json();
        setStats(data.stats || []);
        setAppointmentChart(data.appointmentChart || []);
        setTypeBreakdown(data.typeBreakdown || []);
      } catch (error) {
        console.error("Error fetching social services data:", error);
        toast({
          title: "Error",
          description: "Failed to load social services data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSocialServicesData();
  }, []);

  const handleCreateProgram = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(apiUrl("facilities/social-programs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          budget_allocated: formData.budget_allocated ? Number(formData.budget_allocated) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create social program");
      }

      toast({ title: "Social program added", description: "The program is now available for appointments." });
      setShowAddModal(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create program",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
          <HandHeart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Services Module</h1>
          <p className="text-muted-foreground">Welfare programs, vulnerable populations, and employment data</p>
        </div>
        <div className="ml-auto">
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>Add Social Program</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Social Program</DialogTitle>
                <DialogDescription>Create a social program that users can request.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash Transfer">Cash Transfer</SelectItem>
                      <SelectItem value="Food Assistance">Food Assistance</SelectItem>
                      <SelectItem value="Housing Support">Housing Support</SelectItem>
                      <SelectItem value="Medical Aid">Medical Aid</SelectItem>
                      <SelectItem value="Education Support">Education Support</SelectItem>
                      <SelectItem value="Disability Support">Disability Support</SelectItem>
                      <SelectItem value="Elderly Care">Elderly Care</SelectItem>
                      <SelectItem value="Orphan Support">Orphan Support</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Eligibility Criteria</Label><Input value={formData.eligibility_criteria} onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Coverage Area</Label><Input value={formData.coverage_area} onChange={(e) => setFormData({ ...formData, coverage_area: e.target.value })} /></div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2"><Label>Budget Allocated</Label><Input type="number" value={formData.budget_allocated} onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })} /></div>
                  <div className="grid gap-2"><Label>Currency</Label><Input value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleCreateProgram} disabled={saving}>{saving ? "Saving..." : "Create Program"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {staticStats.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <div className="h-8 bg-muted rounded mt-2 w-20 animate-pulse" />
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center opacity-50`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          stats.map((stat, index) => {
            const staticStat = staticStats[index];
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${staticStat?.color || 'bg-gray-500'} flex items-center justify-center`}>
                      {staticStat && <staticStat.icon className="w-6 h-6 text-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Social Appointments Overview</CardTitle>
            <CardDescription>Program and appointment status counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {appointmentChart.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Type Breakdown</CardTitle>
            <CardDescription>Active social programs by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="value" fill="hsl(280, 65%, 52%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Case Priority Breakdown</CardTitle>
          <CardDescription>Appointment queue by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {appointmentChart.map((item, index) => (
              <div key={item.name} className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                <p className="text-lg font-bold">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Program Availability Note</CardTitle>
          <CardDescription>New programs are immediately available in the user appointment flow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Programs created here will show up on the user appointment page without any extra mapping.</p>
        </CardContent>
      </Card>
    </div>
  );
}
