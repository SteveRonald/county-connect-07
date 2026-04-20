import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Edit, MoreHorizontal, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

interface Citizen {
  id: number;
  citizen_code: string;
  full_name: string;
  id_number: string;
  gender: string;
  age: number;
  ward: string;
  status: string;
}

export default function Citizens() {
  const [searchTerm, setSearchTerm] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchCitizens();
  }, []);

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
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
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
    </div>
  );
}
