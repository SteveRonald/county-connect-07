import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, FileText, Download, Calendar, Filter, FileSpreadsheet, Printer, AlertTriangle, CheckCircle, Clock, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

interface ReportParams {
  type: string;
  format: string;
  period: string;
  department: string;
  filters: Record<string, any>;
}

interface PriorityCase {
  id: string;
  type: string;
  name: string;
  priority: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
}

interface RecentReport {
  id: number;
  name: string;
  generated_at: string;
  file_type: string;
  file_size: string;
}

export default function Reports() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [priorityCases, setPriorityCases] = useState<Record<string, PriorityCase[]>>({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [userInfo, setUserInfo] = useState<{ role: string; name: string; household_id?: number; household_code?: string } | null>(null);
  const [householdResidents, setHouseholdResidents] = useState<any[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [reportForm, setReportForm] = useState({
    type: "population",
    format: "PDF",
    period: "monthly",
    filters: {}
  });
  const [updateForm, setUpdateForm] = useState({
    action: "",
    notes: ""
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchReportMetadata();
  }, []);

  useEffect(() => {
    if (householdId !== null) {
      fetchPriorityCases();
    }
  }, [householdId]);

  useEffect(() => {
    setReportForm(prev => ({ ...prev, period: selectedPeriod }));
  }, [selectedPeriod]);

  const fetchReportMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` };
      const [templatesRes, recentRes] = await Promise.all([
        fetch(apiUrl("reports/templates"), { headers }),
        fetch(apiUrl("reports/recent"), { headers }),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setReportTemplates(templatesData.data ?? []);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentReports(recentData.data ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch report metadata:", error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` };
      const response = await fetch(apiUrl("auth/me"), { headers });
      if (response.ok) {
        const data = await response.json();
        const user = data.user ?? data;
        setUserInfo(user);
        setHouseholdId(user.household_id ? Number(user.household_id) : null);
        if (user.household_id) {
          const residentsRes = await fetch(apiUrl(`citizens?household_id=${Number(user.household_id)}`), { headers });
          if (residentsRes.ok) {
            const residentsData = await residentsRes.json();
            setHouseholdResidents(residentsData.data ?? []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const fetchPriorityCases = async () => {
    try {
      if (!householdId) {
        setPriorityCases({});
        return;
      }
      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` };
      const url = householdId ? apiUrl(`reports/priority-cases?household_id=${householdId}`) : apiUrl("reports/priority-cases");
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setPriorityCases(data.priority_cases || {});
      }
    } catch (error) {
      console.error("Failed to fetch priority cases:", error);
    }
  };

  const handleGenerateReport = async (overrideParams?: Partial<ReportParams>) => {
    try {
      const mergedFilters = {
        ...(reportForm.filters || {}),
        ...(overrideParams?.filters || {}),
        household_id: householdId ?? undefined,
      };
      const params: ReportParams = {
        ...reportForm,
        department: selectedDepartment,
        period: selectedPeriod,
        ...overrideParams,
        filters: mergedFilters
      };

      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` };
      const response = await fetch(apiUrl("reports/generate"), {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      if (data.download_url) {
        toast({
          title: "Report Generated",
          description: "Your download is starting...",
        });
        window.open(data.download_url, '_blank');
      }
      setShowGenerateModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCase = async () => {
    if (!selectedCase || !updateForm.action) {
      toast({
        title: "Validation Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(apiUrl("reports/priority-cases/update"), {
        method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          case_id: selectedCase.id,
          case_type: selectedCase.type,
          action: updateForm.action,
          notes: updateForm.notes
        }),
      });

      if (response.ok) {
        toast({
          title: "Case Updated",
          description: "Priority case has been updated successfully",
        });
        
        setShowUpdateModal(false);
        fetchPriorityCases();
        setUpdateForm({ action: "", notes: "" });
        setSelectedCase(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update case",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = (filename: string, reportName?: string) => {
    toast({
      title: "Downloading Report",
      description: reportName || filename,
    });
    window.open(apiUrl(`reports/download/${filename}`), '_blank');
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'health': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'education': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'social_services': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export reports across all departments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Household Report</CardTitle>
          <CardDescription>{householdId ? `Reports scoped to household #${householdId}` : 'Select parameters to generate a household report'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Household</div>
              <div className="text-sm text-muted-foreground">
                {householdId ? `#${householdId}${userInfo?.household_code ? ` • ${userInfo.household_code}` : ''}` : 'No linked household found for this account.'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Residents: {householdResidents.length}</div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="demographics">Demographics</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="social">Social Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button className="gap-2" onClick={() => setShowGenerateModal(true)}>
                  <FileText className="w-4 h-4" />
                  Generate Household Report
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowGenerateModal(true)}>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Available Report Templates</CardTitle>
            <CardDescription>Live templates returned by the backend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingMetadata ? (
                <p className="text-sm text-muted-foreground">Loading report templates...</p>
              ) : reportTemplates.length > 0 ? (
                reportTemplates.map((template) => (
                  <div key={template.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="secondary">{template.department}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No report templates found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Reports stored in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingMetadata ? (
                <p className="text-sm text-muted-foreground">Loading recent reports...</p>
              ) : recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(report.generated_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{report.file_type}</p>
                      <p className="text-sm text-muted-foreground">{report.file_size}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reports have been generated yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Household Residents</CardTitle>
            <CardDescription>Linked members in this household</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{householdResidents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Priority Cases</CardTitle>
            <CardDescription>Household-scoped cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.values(priorityCases).reduce((sum, items) => sum + items.length, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Scope</CardTitle>
            <CardDescription>Only household-linked records are shown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {householdId ? `Household #${householdId}` : 'No linked household'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Household Report Preview</CardTitle>
          <CardDescription>Members and case activity for your household</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {householdResidents.length > 0 ? householdResidents.map((resident) => (
              <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{resident.full_name}</p>
                  <p className="text-sm text-muted-foreground">{resident.citizen_code} • {resident.ward}</p>
                </div>
                <Badge variant={resident.status === 'Active' ? 'default' : 'secondary'}>{resident.status}</Badge>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No household residents found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Household Report</DialogTitle>
            <DialogDescription>Configure and generate a report for the linked household</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportForm.type} onValueChange={(value) => setReportForm({ ...reportForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="population">Population Report</SelectItem>
                  <SelectItem value="health">Health Report</SelectItem>
                  <SelectItem value="education">Education Report</SelectItem>
                  <SelectItem value="social_services">Social Services Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-period">Period</Label>
              <Select value={reportForm.period} onValueChange={(value) => setReportForm({ ...reportForm, period: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-format">Format</Label>
              <Select value={reportForm.format} onValueChange={(value) => setReportForm({ ...reportForm, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleGenerateReport()}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Case Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Priority Case</DialogTitle>
            <DialogDescription>Update the status and add notes for this case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={updateForm.action} onValueChange={(value) => setUpdateForm({ ...updateForm, action: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCase}>
              Update Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
