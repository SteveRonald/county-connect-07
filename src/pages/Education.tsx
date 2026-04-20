import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Users, School, BookOpen, TrendingUp, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

interface StatItem {
  title: string;
  value: string;
}

interface EducationData {
  stats: StatItem[];
  appointmentChart: { name: string; value: number }[];
  typeBreakdown: { name: string; value: number }[];
}

const staticStats = [
  { title: "Total Students", icon: Users, color: "bg-blue-500" },
  { title: "Schools", icon: School, color: "bg-blue-600" },
  { title: "Literacy Rate", icon: BookOpen, color: "bg-green-500" },
  { title: "Completion Rate", icon: Award, color: "bg-purple-500" },
];

export default function Education() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [appointmentChart, setAppointmentChart] = useState<EducationData["appointmentChart"]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<EducationData["typeBreakdown"]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Primary School",
    level: "Primary",
    ward: "",
    sub_county: "",
    address: "",
    phone: "",
    email: "",
    capacity: "",
  });

  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(apiUrl("education/summary"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error("Failed to fetch education data");
        }

        const data: EducationData = await response.json();
        setStats(data.stats || []);
        setAppointmentChart(data.appointmentChart || []);
        setTypeBreakdown(data.typeBreakdown || []);
      } catch (error) {
        console.error("Error fetching education data:", error);
        toast({
          title: "Error",
          description: "Failed to load education data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEducationData();
  }, []);

  const handleCreateFacility = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(apiUrl("facilities/education"), {
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
        throw new Error(data.error || "Failed to create education facility");
      }

      toast({ title: "Education facility added", description: "The facility is now available for appointments." });
      setShowAddModal(false);
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
        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Education Module</h1>
          <p className="text-muted-foreground">School enrollment, literacy rates, and educational facilities</p>
        </div>
        <div className="ml-auto">
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>Add Education Facility</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Education Facility</DialogTitle>
                <DialogDescription>Create a facility that users can request education appointments for.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre-primary">Pre-primary</SelectItem>
                        <SelectItem value="Primary School">Primary School</SelectItem>
                        <SelectItem value="Secondary School">Secondary School</SelectItem>
                        <SelectItem value="Tertiary Institution">Tertiary Institution</SelectItem>
                        <SelectItem value="Vocational Training">Vocational Training</SelectItem>
                        <SelectItem value="Special Education">Special Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Level</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre-primary">Pre-primary</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Tertiary">Tertiary</SelectItem>
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
            <CardTitle>Education Appointments Overview</CardTitle>
            <CardDescription>Facility and appointment status counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
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
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Pending vs Approved</CardTitle>
          <CardDescription>Current appointment queue by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {appointmentChart.map((item) => (
              <div key={item.name} className="p-4 border rounded-lg text-center">
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schools Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <School className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats[0]?.value || 0}</p>
            <p className="text-sm text-muted-foreground">Available Facilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <School className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats[1]?.value || 0}</p>
            <p className="text-sm text-muted-foreground">Requested Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-8 h-8 text-blue-700 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats[2]?.value || 0}</p>
            <p className="text-sm text-muted-foreground">Approved Appointments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
