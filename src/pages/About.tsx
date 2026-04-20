import { PublicLayout } from "@/components/layout/PublicLayout";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, GraduationCap, HandHeart, BarChart3, Shield, Database, Activity, Settings, Globe, MapPin, Clock, CheckCircle } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/user-dashboard", { replace: true });
    }
  }, [navigate]);

  const modules = [
    {
      icon: Users,
      title: "Population Management",
      description: "Comprehensive citizen registration, demographic tracking, and household management with real-time updates.",
      features: ["Resident Registration", "Demographic Analysis", "Household Mapping", "Status Tracking"],
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Heart,
      title: "Health Services",
      description: "Track medical visits, vaccinations, and health campaigns with detailed patient histories and outcomes.",
      features: ["Medical Records", "Visit Tracking", "Vaccination Management", "Health Analytics"],
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: GraduationCap,
      title: "Education Services",
      description: "Manage school enrollments, attendance tracking, and educational support programs across all institutions.",
      features: ["School Enrollment", "Attendance Tracking", "Performance Monitoring", "Resource Allocation"],
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: HandHeart,
      title: "Social Support",
      description: "Coordinate welfare programs, cash transfers, and social assistance with beneficiary tracking.",
      features: ["Cash Transfers", "Food Assistance", "Housing Support", "Beneficiary Management"],
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Generate comprehensive reports, visualize trends, and make data-driven decisions with interactive dashboards.",
      features: ["Custom Reports", "Data Visualization", "Trend Analysis", "Export Capabilities"],
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      icon: Shield,
      title: "Security & Access",
      description: "Role-based access control, audit trails, and secure data management ensuring privacy and compliance.",
      features: ["User Management", "Role-Based Access", "Audit Logs", "Data Encryption"],
      color: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  const stats = [
    { label: "Citizens Managed", value: "50,000+", icon: Users },
    { label: "Health Records", value: "125,000+", icon: Heart },
    { label: "School Enrollments", value: "15,000+", icon: GraduationCap },
    { label: "Support Cases", value: "8,500+", icon: HandHeart }
  ];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">About CPMS</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The Centralized Population Management System (CPMS) is a comprehensive digital platform 
            designed to transform how county governments manage citizen services and administrative operations.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Database className="w-8 h-8 text-blue-500 mb-2" />
                <CardTitle>Centralized Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Unified data management across all departments ensuring data consistency and integrity.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Activity className="w-8 h-8 text-green-500 mb-2" />
                <CardTitle>Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Live data synchronization across all modules providing up-to-date information.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="w-8 h-8 text-purple-500 mb-2" />
                <CardTitle>Multi-Department</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seamless integration between health, education, social services, and administrative departments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4">System Modules</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our comprehensive system includes specialized modules designed to meet the unique needs of each department.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <module.icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose CPMS?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Time Efficiency</h3>
                  <p className="text-sm text-muted-foreground">
                    Reduce administrative workload by 60% through automated processes and digital workflows.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Improved Service Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Better coordination between departments leads to faster and more effective citizen services.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Data-Driven Decisions</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive analytics and reporting enable informed policy and resource allocation decisions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Easy Implementation</h3>
                  <p className="text-sm text-muted-foreground">
                    User-friendly interface and comprehensive training ensure smooth adoption across all departments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your County Operations?</h2>
          <p className="text-muted-foreground mb-6">
            Join other counties in modernizing their service delivery and citizen management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
            <Button variant="outline" onClick={() => navigate("/contact")}>Contact Us</Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
