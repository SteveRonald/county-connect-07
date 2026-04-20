import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Syringe, AlertTriangle, Baby, Shield, Building } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

interface StatItem {
  title: string;
  value: string;
}

interface HealthData {
  stats: StatItem[];
  appointmentChart: { name: string; value: number }[];
  typeBreakdown: { name: string; value: number }[];
}

const staticStats = [
  { title: "Health Records", icon: Heart, color: "bg-green-500" },
  { title: "Immunizations", icon: Syringe, color: "bg-blue-500" },
  { title: "Active Outbreaks", icon: AlertTriangle, color: "bg-red-500" },
  { title: "Facilities", icon: Building, color: "bg-purple-500" },
];

const appointmentColors = [
  "hsl(142, 76%, 36%)",
  "hsl(221, 83%, 53%)",
  "hsl(199, 89%, 38%)",
  "hsl(173, 58%, 39%)",
  "hsl(280, 65%, 52%)",
];

export default function Health() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [appointmentChart, setAppointmentChart] = useState<HealthData["appointmentChart"]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<HealthData["typeBreakdown"]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Clinic",
    level: "Level 1",
    ward: "",
    sub_county: "",
    address: "",
    phone: "",
    email: "",
    capacity: "",
  });

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(apiUrl("health/summary"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error("Failed to fetch health data");
        }

        const data: HealthData = await response.json();
        setStats(data.stats || []);
        setAppointmentChart(data.appointmentChart || []);
        setTypeBreakdown(data.typeBreakdown || []);
      } catch (error) {
        console.error("Error fetching health data:", error);
        toast({
          title: "Error",
          description: "Failed to load health data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, []);

  const handleCreateFacility = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(apiUrl("facilities/health"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? Number(formData.capacity) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create health facility");
      }

      toast({ title: "Health facility added", description: "The facility is now available for appointments." });
      setShowAddModal(false);
      setFormData({
        name: "",
        type: "Clinic",
        level: "Level 1",
        ward: "",
        sub_county: "",
        address: "",
        phone: "",
        email: "",
        capacity: "",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create facility",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Health Module</h1>
          <p className="text-muted-foreground">Healthcare records, immunization, and disease monitoring</p>
        </div>
        <div className="ml-auto">
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>Add Health Facility</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Health Facility</DialogTitle>
                <DialogDescription>Create a facility that users can request appointments for.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hospital">Hospital</SelectItem>
                        <SelectItem value="Clinic">Clinic</SelectItem>
                        <SelectItem value="Health Center">Health Center</SelectItem>
                        <SelectItem value="Dispensary">Dispensary</SelectItem>
                        <SelectItem value="Maternity Home">Maternity Home</SelectItem>
                        <SelectItem value="Specialized Center">Specialized Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Level</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Level 1">Level 1</SelectItem>
                        <SelectItem value="Level 2">Level 2</SelectItem>
                        <SelectItem value="Level 3">Level 3</SelectItem>
                        <SelectItem value="Level 4">Level 4</SelectItem>
                        <SelectItem value="Level 5">Level 5</SelectItem>
                        <SelectItem value="Level 6">Level 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2"><Label>Ward</Label><Input value={formData.ward} onChange={(e) => setFormData({ ...formData, ward: e.target.value })} /></div>
                  <div className="grid gap-2"><Label>Sub County</Label><Input value={formData.sub_county} onChange={(e) => setFormData({ ...formData, sub_county: e.target.value })} /></div>
                </div>
                <div className="grid gap-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                  <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                </div>
                <div className="grid gap-2"><Label>Capacity</Label><Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleCreateFacility} disabled={saving}>{saving ? "Saving..." : "Create Facility"}</Button>
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Health Appointments Overview</CardTitle>
            <CardDescription>Facility and appointment status counts</CardDescription>
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
                    <Cell key={`${entry.name}-${index}`} fill={appointmentColors[index % appointmentColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility Type Breakdown</CardTitle>
            <CardDescription>Active facility types in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Maternal Health */}
      <Card>
        <CardHeader>
          <CardTitle>Pending vs Approved</CardTitle>
          <CardDescription>Current appointment queue by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {appointmentChart.map((item, index) => (
              <div key={item.name} className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: appointmentColors[index % appointmentColors.length] }} />
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Insurance */}
      <Card>
        <CardHeader>
          <CardTitle>Health Facilities</CardTitle>
          <CardDescription>Facilities available for appointment booking</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Newly created health facilities become selectable on the user appointment page automatically.</p>
        </CardContent>
      </Card>
    </div>
  );
}
