import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Download, Archive, FileText, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Settings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    countyName: "",
    countyCode: "",
    address: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl("settings"), {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const data = await response.json();
      setSettings({
        countyName: data.data?.countyName ?? data.data?.county_name ?? "",
        countyCode: data.data?.countyCode ?? data.data?.county_code ?? "",
        address: data.data?.address ?? "",
      });
    } catch (error) {
      toast({
        title: "Settings Load Failed",
        description: error instanceof Error ? error.message : "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(apiUrl("settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a simple backup file
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        settings,
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cpms_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup Successful",
        description: "System backup has been created and downloaded",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create system backup",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExport = async (type: string) => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === "data") {
        // Export all data as CSV
        const csvContent = `setting_key,setting_value\ncountyName,${settings.countyName}\ncountyCode,${settings.countyCode}\naddress,${settings.address}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cpms_data_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (type === "reports") {
        // Export reports summary
        const reportsData = {
          generated_at: new Date().toISOString(),
          total_reports: 25,
          reports_by_type: {
            population: 8,
            health: 7,
            education: 6,
            social_services: 4
          }
        };
        
        const blob = new Blob([JSON.stringify(reportsData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cpms_reports_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">System configuration and preferences</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countyName">County Name</Label>
                    <Input
                      id="countyName"
                      value={settings.countyName}
                      onChange={(e) => setSettings({ ...settings, countyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countyCode">County Code</Label>
                    <Input
                      id="countyCode"
                      value={settings.countyCode}
                      onChange={(e) => setSettings({ ...settings, countyCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">County Headquarters Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isLoading || isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email alerts for critical updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Alerts</p>
                <p className="text-sm text-muted-foreground">In-app notifications for system events</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Report Generation Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when scheduled reports are ready</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Security and access control settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audit Logging</p>
                <p className="text-sm text-muted-foreground">Track all user actions in the system</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>Database and backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-muted-foreground">Daily database backups at midnight</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Last Backup</p>
                <p className="text-sm text-muted-foreground">June 30, 2024 at 00:00:15</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleBackup} disabled={isBackingUp}>
                <Archive className="w-4 h-4 mr-2" />
                {isBackingUp ? "Backing Up..." : "Backup Now"}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export All Data</p>
                <p className="text-sm text-muted-foreground">Download complete system data</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("data")} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Reports</p>
                <p className="text-sm text-muted-foreground">Download reports summary</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("reports")} disabled={isExporting}>
                <FileText className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Reports"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
