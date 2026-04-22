import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Edit, MoreHorizontal, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Citizen {
  id: number;
  citizen_code: string;
  full_name: string;
  id_number: string;
  gender: string;
  age: number;
  ward: string;
  sub_county?: string | null;
  status: string;
}

const fallbackConstituencyWards: Record<string, string[]> = {
  Soy: ["Kuinet/Kapsuswa", "Segero/Barsombe", "Kipsomba", "Soy", "Moi's Bridge"],
  Turbo: ["Ngenyilel", "Tapsagoi", "Kamagut", "Kiplombe", "Kapsaos"],
  Moiben: ["Tembelio", "Sergoit", "Karuna/Meibeki", "Moiben", "Kimumu"],
  Ainabkoi: ["Kapsoya", "Kaptagat", "Ainabkoi/Olare"],
  Kapseret: ["Simat/Kapseret", "Kipkenyo", "Ngeria", "Megun"],
  Kesses: ["Racecourse", "Cheptiret/Kipchamo", "Tulwet/Chuiyat", "Tarakwa"],
};

export default function Citizens() {
  const [searchTerm, setSearchTerm] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    id_number: "",
    gender: "",
    age: "",
    county: "Uasin Gishu",
    constituency: "",
    ward: "",
    status: "",
  });

  const constituencyWardMap = (() => {
    const map: Record<string, Set<string>> = {};
    citizens.forEach((citizen) => {
      const constituency = (citizen.sub_county || "").trim();
      const ward = (citizen.ward || "").trim();
      if (!constituency || !ward) {
        return;
      }
      if (!map[constituency]) {
        map[constituency] = new Set<string>();
      }
      map[constituency].add(ward);
    });

    const merged: Record<string, string[]> = {};
    Object.entries(fallbackConstituencyWards).forEach(([constituency, wards]) => {
      merged[constituency] = [...wards];
    });

    Object.entries(map).forEach(([constituency, wards]) => {
      const existing = new Set(merged[constituency] || []);
      wards.forEach((ward) => existing.add(ward));
      merged[constituency] = Array.from(existing);
    });

    return merged;
  })();

  const constituencyOptions = Object.keys(constituencyWardMap);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(apiUrl("citizens"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setCitizens(data.data || []);
      } else {
        toast({ title: "Error", description: "Failed to fetch citizens", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching citizens:", error);
      toast({ title: "Error", description: "Failed to load citizens data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  const handleViewCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setShowViewDialog(true);
  };

  const handleOpenEdit = (citizen: Citizen) => {
    const existingConstituency = (citizen.sub_county || "").trim();
    const inferredConstituency = Object.entries(constituencyWardMap).find(([, wards]) => wards.includes(citizen.ward))?.[0] || "Soy";
    const constituency = existingConstituency || inferredConstituency;
    setSelectedCitizen(citizen);
    setEditForm({
      full_name: citizen.full_name,
      id_number: citizen.id_number,
      gender: citizen.gender,
      age: String(citizen.age),
      county: "Uasin Gishu",
      constituency,
      ward: citizen.ward,
      status: citizen.status,
    });
    setShowEditDialog(true);
  };

  const updateCitizen = async (citizenId: number, payload: Record<string, string | number>) => {
    const token = getAuthToken();
    const response = await fetch(apiUrl(`citizens/${citizenId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || "Failed to update citizen");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCitizen) {
      return;
    }

    try {
      setUpdating(true);
      await updateCitizen(selectedCitizen.id, {
        full_name: editForm.full_name.trim(),
        id_number: editForm.id_number.trim(),
        gender: editForm.gender.trim(),
        age: Number(editForm.age),
        sub_county: editForm.constituency.trim(),
        ward: editForm.ward.trim(),
        status: editForm.status.trim(),
      });

      toast({
        title: "Citizen Updated",
        description: `${editForm.full_name} was updated successfully.`,
      });

      setShowEditDialog(false);
      setSelectedCitizen(null);
      await fetchCitizens();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDeceased = async (citizen: Citizen) => {
    try {
      await updateCitizen(citizen.id, { status: "Deceased" });
      toast({
        title: "Status Updated",
        description: `${citizen.full_name} has been marked as Deceased.`,
      });
      await fetchCitizens();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Unable to mark citizen as deceased.",
        variant: "destructive",
      });
    }
  };

  const filteredCitizens = citizens.filter((citizen) => {
    const matchesSearch = 
      citizen.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citizen.id_number.includes(searchTerm);
    const matchesWard = wardFilter === "all" || citizen.ward === wardFilter;
    return matchesSearch && matchesWard;
  });

  const handleDownloadRegistry = (format: string) => {
    // Create CSV content
    const headers = ["ID", "Name", "ID Number", "Gender", "Age", "Ward", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredCitizens.map(citizen => 
        [citizen.citizen_code, citizen.full_name, citizen.id_number, citizen.gender, citizen.age, citizen.ward, citizen.status].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citizens_registry_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Successful",
      description: `Citizens registry downloaded as ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Citizens Registry</h1>
          <p className="text-muted-foreground">Manage and view citizen records</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download Registry
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDownloadRegistry("csv")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadRegistry("excel")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  <SelectItem value="Ward 1">Ward 1</SelectItem>
                  <SelectItem value="Ward 2">Ward 2</SelectItem>
                  <SelectItem value="Ward 3">Ward 3</SelectItem>
                  <SelectItem value="Ward 4">Ward 4</SelectItem>
                  <SelectItem value="Ward 5">Ward 5</SelectItem>
                  <SelectItem value="Ward 6">Ward 6</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading citizens...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Citizen ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCitizens.length > 0 ? (
                    filteredCitizens.map((citizen) => (
                      <TableRow key={citizen.id}>
                        <TableCell className="font-medium">{citizen.citizen_code}</TableCell>
                        <TableCell>{citizen.full_name}</TableCell>
                        <TableCell>{citizen.id_number}</TableCell>
                        <TableCell>{citizen.gender}</TableCell>
                        <TableCell>{citizen.age}</TableCell>
                        <TableCell>{citizen.ward}</TableCell>
                        <TableCell>
                          <Badge variant={citizen.status === "Active" ? "default" : "secondary"}>
                            {citizen.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCitizen(citizen)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(citizen)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {citizen.status !== "Deceased" ? (
                                <DropdownMenuItem onClick={() => handleMarkDeceased(citizen)}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Mark as Deceased
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No citizens found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCitizens.length} of {citizens.length} citizens
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Citizen Details</DialogTitle>
            <DialogDescription>View the selected citizen record.</DialogDescription>
          </DialogHeader>
          {selectedCitizen ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Citizen ID:</span> {selectedCitizen.citizen_code}</div>
              <div><span className="font-medium">Full Name:</span> {selectedCitizen.full_name}</div>
              <div><span className="font-medium">ID Number:</span> {selectedCitizen.id_number}</div>
              <div><span className="font-medium">Gender:</span> {selectedCitizen.gender}</div>
              <div><span className="font-medium">Age:</span> {selectedCitizen.age}</div>
              <div><span className="font-medium">Ward:</span> {selectedCitizen.ward}</div>
              <div><span className="font-medium">Status:</span> {selectedCitizen.status}</div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Citizen</DialogTitle>
            <DialogDescription>Update citizen details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input id="edit-full-name" value={editForm.full_name} onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-id-number">ID Number</Label>
              <Input id="edit-id-number" value={editForm.id_number} onChange={(e) => setEditForm((prev) => ({ ...prev, id_number: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <Input id="edit-gender" value={editForm.gender} onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-age">Age</Label>
                <Input id="edit-age" type="number" min={0} value={editForm.age} onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-ward">Ward</Label>
                <Select
                  value={editForm.ward || undefined}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, ward: value }))}
                >
                  <SelectTrigger id="edit-ward">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {(constituencyWardMap[editForm.constituency] || []).map((ward) => (
                      <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Input id="edit-status" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-county">County</Label>
                <Select value={editForm.county} onValueChange={(value) => setEditForm((prev) => ({ ...prev, county: value }))}>
                  <SelectTrigger id="edit-county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-constituency">Constituency</Label>
                <Select
                  value={editForm.constituency || undefined}
                  onValueChange={(value) => {
                    const wards = constituencyWardMap[value] || [];
                    setEditForm((prev) => ({
                      ...prev,
                      constituency: value,
                      ward: wards.includes(prev.ward) ? prev.ward : (wards[0] || ""),
                    }));
                  }}
                >
                  <SelectTrigger id="edit-constituency">
                    <SelectValue placeholder="Select constituency" />
                  </SelectTrigger>
                  <SelectContent>
                    {constituencyOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updating}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updating}>{updating ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
