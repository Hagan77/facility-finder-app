import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, CreditCard, TrendingUp, Calendar, FileText, Search, AlertCircle, 
  Clock, CheckCircle, Download, Upload, Users, Settings, Shield, Trash2, 
  Edit, RefreshCw, BarChart3, Activity, Database, UserCog, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FacilitySearch from "./FacilitySearch";
import PaymentSearch from "./PaymentSearch";
import BulkUpload from "./BulkUpload";

// Hardcoded users from AuthContext for display
const systemUsers = [
  { username: "admin", role: "admin", sector: null },
  { username: "user", role: "user", sector: null },
  { username: "Eugene", role: "sector_head", sector: "hospitality" },
  { username: "Hospitality Head", role: "sector_head", sector: "hospitality" },
  { username: "Hagan", role: "user", sector: null },
  { username: "Zenora1", role: "user", sector: null },
  { username: "Head1", role: "admin", sector: null },
  { username: "Head2", role: "admin", sector: null },
  { username: "Health Head", role: "sector_head", sector: "health" },
  { username: "Mining Head", role: "sector_head", sector: "mining" },
  { username: "Infrastructure Head", role: "sector_head", sector: "infrastructure" },
  { username: "Education Head", role: "sector_head", sector: "education" },
  { username: "Agriculture Head", role: "sector_head", sector: "agriculture" },
  { username: "Manufacturing Head", role: "sector_head", sector: "manufacturing" },
  { username: "Tourism Head", role: "sector_head", sector: "tourism" },
  { username: "Finance Head", role: "sector_head", sector: "finance" },
  { username: "Transportation Head", role: "sector_head", sector: "transportation" },
  { username: "Energy Head", role: "sector_head", sector: "energy" },
  { username: "Chemicals Head", role: "sector_head", sector: "chemicals" },
  { username: "Telecommunication Head", role: "sector_head", sector: "telecommunication" },
  { username: "Quarry Head", role: "sector_head", sector: "quarry" },
];

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalFacilities: 0,
    totalPayments: 0,
    totalRevenue: 0,
    recentFacilities: [] as any[],
    recentPayments: [] as any[],
    expiredFacilities: 0,
    expiringFacilities: 0,
    activeFacilities: 0,
    sectorBreakdown: [] as any[],
    validFacilitiesList: [] as any[],
    expiringFacilitiesList: [] as any[],
    expiredFacilitiesList: [] as any[],
    totalFacilitiesList: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<'valid' | 'expiring' | 'expired' | null>(null);
  const [editFacilityModal, setEditFacilityModal] = useState<any>(null);
  const [deleteFacilityModal, setDeleteFacilityModal] = useState<any>(null);
  const [editPaymentModal, setEditPaymentModal] = useState<any>(null);
  const [deletePaymentModal, setDeletePaymentModal] = useState<any>(null);
  const [allFacilities, setAllFacilities] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [exportSector, setExportSector] = useState<string>("all");
  const [exportStatus, setExportStatus] = useState<string>("all");
  const { toast } = useToast();

  // Helper to parse dates - handles multiple formats (M/D/YYYY, D/M/YYYY, etc.)
  const parseExpiryDate = (dateString: string | number | null): Date | null => {
    if (!dateString) return null;
    // Handle Excel serial date numbers
    if (typeof dateString === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateString * 86400000);
    }
    const str = String(dateString);
    // Remove time portion if present (e.g., "9/9/2026 0:00" -> "9/9/2026")
    const cleanDate = str.split(' ')[0].trim();
    const parts = cleanDate.split('/');
    if (parts.length !== 3) return null;
    
    const part1 = parseInt(parts[0], 10);
    const part2 = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(part1) || isNaN(part2) || isNaN(year)) return null;
    
    // Determine if format is M/D/YYYY or D/M/YYYY based on values
    // If part1 > 12, it must be a day (D/M/YYYY format)
    // If part2 > 12, it must be a day (M/D/YYYY format)
    // Otherwise assume M/D/YYYY (US format) as that's what the data shows
    let month: number, day: number;
    
    if (part1 > 12) {
      // First part > 12 means it's day (D/M/YYYY)
      day = part1;
      month = part2 - 1;
    } else if (part2 > 12) {
      // Second part > 12 means it's day (M/D/YYYY)
      month = part1 - 1;
      day = part2;
    } else {
      // Both <= 12, assume M/D/YYYY (matches DB format "9/9/2026")
      month = part1 - 1;
      day = part2;
    }
    
    return new Date(year, month, day);
  };

  // Get unique sectors from facilities
  const getUniqueSectors = (): string[] => {
    const sectors = new Set<string>();
    allFacilities.forEach(f => {
      if (f.sector) sectors.add(f.sector.toUpperCase());
    });
    return Array.from(sectors).sort();
  };

  // Get facility status
  const getFacilityStatus = (facility: any): 'valid' | 'expiring' | 'expired' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDaysFromNow = new Date(today);
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    const expiryDate = parseExpiryDate(facility.expiry_date);
    
    if (!expiryDate) return 'valid';
    if (expiryDate <= today) return 'expired';
    if (expiryDate <= ninetyDaysFromNow) return 'expiring';
    return 'valid';
  };

  // Filter facilities for export based on sector and status
  const getFilteredFacilitiesForExport = (): any[] => {
    let filtered = [...allFacilities];
    
    if (exportSector !== "all") {
      filtered = filtered.filter(f => 
        f.sector?.toUpperCase() === exportSector.toUpperCase()
      );
    }
    
    if (exportStatus !== "all") {
      filtered = filtered.filter(f => getFacilityStatus(f) === exportStatus);
    }
    
    return filtered;
  };

  // Filter payments for export based on sector
  const getFilteredPaymentsForExport = (): any[] => {
    if (exportSector === "all") return allPayments;
    return allPayments.filter(p => 
      p.sector?.toUpperCase() === exportSector.toUpperCase()
    );
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAllData();

    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () => {
        fetchDashboardData();
        fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDashboardData();
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      const { data: facilities } = await supabase.from("facilities").select("*").order("created_at", { ascending: false });
      const { data: payments } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      setAllFacilities(facilities || []);
      setAllPayments(payments || []);
    } catch (error) {
      console.error("Error fetching all data:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      let allFacilitiesData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("facilities")
          .select("*")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        
        if (data && data.length > 0) {
          allFacilitiesData = [...allFacilitiesData, ...data];
        }
        
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ninetyDaysFromNow = new Date(today);
      ninetyDaysFromNow.setDate(today.getDate() + 90);

      let expired = 0, expiring = 0, active = 0;
      const sectorStats: Record<string, { expired: number; expiring: number; active: number; total: number }> = {};
      const validFacilitiesList: any[] = [];
      const expiringFacilitiesList: any[] = [];
      const expiredFacilitiesList: any[] = [];

      allFacilitiesData.forEach((facility) => {
        const expiryDate = parseExpiryDate(facility.expiry_date);
        const sector = (facility.sector || "Unknown").toUpperCase();

        if (!sectorStats[sector]) {
          sectorStats[sector] = { expired: 0, expiring: 0, active: 0, total: 0 };
        }
        sectorStats[sector].total++;

        if (!expiryDate) {
          active++;
          sectorStats[sector].active++;
          validFacilitiesList.push(facility);
        } else if (expiryDate <= today) {
          expired++;
          sectorStats[sector].expired++;
          expiredFacilitiesList.push(facility);
        } else if (expiryDate <= ninetyDaysFromNow) {
          expiring++;
          sectorStats[sector].expiring++;
          expiringFacilitiesList.push(facility);
        } else {
          active++;
          sectorStats[sector].active++;
          validFacilitiesList.push(facility);
        }
      });

      const sectorBreakdown = Object.entries(sectorStats).map(([sector, stats]) => ({
        sector,
        ...stats,
      }));

      const { data: recentFacilities } = await supabase
        .from("facilities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const { count: paymentsCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      const { data: allPaymentsData } = await supabase
        .from("payments")
        .select("amount_paid");

      const { data: recentPayments } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const totalRevenue = allPaymentsData?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      setStats({
        totalFacilities: allFacilitiesData.length,
        totalPayments: paymentsCount || 0,
        totalRevenue,
        recentFacilities: recentFacilities || [],
        recentPayments: recentPayments || [],
        expiredFacilities: expired,
        expiringFacilities: expiring,
        activeFacilities: active,
        sectorBreakdown,
        validFacilitiesList,
        expiringFacilitiesList,
        expiredFacilitiesList,
        totalFacilitiesList: allFacilitiesData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error loading dashboard",
        description: "Could not fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility = async (id: number) => {
    try {
      const { error } = await supabase.from("facilities").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Facility deleted successfully" });
      setDeleteFacilityModal(null);
      fetchAllData();
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast({ title: "Error deleting facility", variant: "destructive" });
    }
  };

  const handleUpdateFacility = async () => {
    if (!editFacilityModal) return;
    try {
      const { error } = await supabase
        .from("facilities")
        .update({
          name: editFacilityModal.name,
          sector: editFacilityModal.sector,
          location: editFacilityModal.location,
          district: editFacilityModal.district,
          expiry_date: editFacilityModal.expiry_date,
          effective_date: editFacilityModal.effective_date,
          file_location_id: editFacilityModal.file_location_id,
        })
        .eq("id", editFacilityModal.id);
      if (error) throw error;
      toast({ title: "Facility updated successfully" });
      setEditFacilityModal(null);
      fetchAllData();
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating facility:", error);
      toast({ title: "Error updating facility", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Payment deleted successfully" });
      setDeletePaymentModal(null);
      fetchAllData();
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({ title: "Error deleting payment", variant: "destructive" });
    }
  };

  const handleUpdatePayment = async () => {
    if (!editPaymentModal) return;
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          name: editPaymentModal.name,
          amount_paid: editPaymentModal.amount_paid,
          location: editPaymentModal.location,
          sector: editPaymentModal.sector,
          category: editPaymentModal.category,
          payment_date: editPaymentModal.payment_date,
        })
        .eq("id", editPaymentModal.id);
      if (error) throw error;
      toast({ title: "Payment updated successfully" });
      setEditPaymentModal(null);
      fetchAllData();
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({ title: "Error updating payment", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };

  const exportToCSV = (data: any[], filename: string, type: 'facility' | 'payment') => {
    if (data.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    let headers: string[];
    let rows: string[];

    if (type === 'facility') {
      headers = ['Facility Name', 'Sector', 'Location', 'District', 'Expiry Date', 'Effective Date', 'File Location ID'];
      rows = data.map(f => [
        `"${f.name || ''}"`, `"${f.sector || ''}"`, `"${f.location || ''}"`,
        `"${f.district || ''}"`, `"${f.expiry_date || ''}"`, `"${f.effective_date || ''}"`,
        `"${f.file_location_id || ''}"`,
      ].join(','));
    } else {
      headers = ['Name', 'Amount Paid', 'Location', 'Sector', 'Category', 'Payment Date'];
      rows = data.map(p => [
        `"${p.name || ''}"`, `"${p.amount_paid || 0}"`, `"${p.location || ''}"`,
        `"${p.sector || ''}"`, `"${p.category || ''}"`, `"${p.payment_date || ''}"`,
      ].join(','));
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful", description: `${data.length} records exported` });
  };

  const filteredFacilities = allFacilities.filter(f => 
    f.name?.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
    f.sector?.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
    f.location?.toLowerCase().includes(facilitySearchTerm.toLowerCase())
  );

  const filteredPayments = allPayments.filter(p => 
    p.name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
    p.sector?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(paymentSearchTerm.toLowerCase())
  );

  const getCurrentModalData = () => {
    switch (modalOpen) {
      case 'valid': return stats.validFacilitiesList;
      case 'expiring': return stats.expiringFacilitiesList;
      case 'expired': return stats.expiredFacilitiesList;
      default: return [];
    }
  };

  const getModalTitle = () => {
    switch (modalOpen) {
      case 'valid': return 'Valid Facilities';
      case 'expiring': return 'Expiring Facilities';
      case 'expired': return 'Expired Facilities';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
        </div>
        <p className="text-xl text-muted-foreground">Full system control and management</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="text-xs sm:text-sm py-2">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Facilities</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="bulk-upload" className="text-xs sm:text-sm py-2">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Valid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeFacilities}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Expiring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.expiringFacilities}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Expired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.expiredFacilities}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* System Summary */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Facilities</span>
                  <span className="font-bold">{stats.totalFacilities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Payments</span>
                  <span className="font-bold">{stats.totalPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sectors</span>
                  <span className="font-bold">{stats.sectorBreakdown.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="font-bold">{systemUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admins</span>
                  <span className="font-bold">{systemUsers.filter(u => u.role === 'admin').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector Heads</span>
                  <span className="font-bold">{systemUsers.filter(u => u.role === 'sector_head').length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm" onClick={() => exportToCSV(allFacilities, 'all-facilities', 'facility')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Facilities
                </Button>
                <Button className="w-full" size="sm" variant="outline" onClick={() => exportToCSV(allPayments, 'all-payments', 'payment')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Payments
                </Button>
                <Button className="w-full" size="sm" variant="secondary" onClick={() => { fetchDashboardData(); fetchAllData(); }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Advanced Export
              </CardTitle>
              <CardDescription>Export facilities by sector and status, or payments by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Filters */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter by Sector</Label>
                    <Select value={exportSector} onValueChange={setExportSector}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sectors</SelectItem>
                        {getUniqueSectors().map((sector) => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter by Status (Facilities only)</Label>
                    <Select value={exportStatus} onValueChange={setExportStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="valid">Valid Only</SelectItem>
                        <SelectItem value="expiring">Expiring Only</SelectItem>
                        <SelectItem value="expired">Expired Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Export Buttons */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">
                      Facilities to export: <span className="text-primary font-bold">{getFilteredFacilitiesForExport().length}</span>
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const data = getFilteredFacilitiesForExport();
                        const filename = `facilities-${exportSector === 'all' ? 'all-sectors' : exportSector.toLowerCase()}-${exportStatus === 'all' ? 'all-status' : exportStatus}`;
                        exportToCSV(data, filename, 'facility');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Filtered Facilities
                    </Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">
                      Payments to export: <span className="text-primary font-bold">{getFilteredPaymentsForExport().length}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        const data = getFilteredPaymentsForExport();
                        const filename = `payments-${exportSector === 'all' ? 'all-sectors' : exportSector.toLowerCase()}`;
                        exportToCSV(data, filename, 'payment');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Filtered Payments
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Sector Breakdown</CardTitle>
              <CardDescription>Facility status by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-center">Valid</TableHead>
                      <TableHead className="text-center">Expiring</TableHead>
                      <TableHead className="text-center">Expired</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.sectorBreakdown.map((sector) => (
                      <TableRow key={sector.sector}>
                        <TableCell className="font-medium">{sector.sector}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700">{sector.active}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">{sector.expiring}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-red-50 text-red-700">{sector.expired}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold">{sector.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities Management Tab */}
        <TabsContent value="facilities" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Facility Management
                  </CardTitle>
                  <CardDescription>Edit or delete facilities</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search facilities..."
                    value={facilitySearchTerm}
                    onChange={(e) => setFacilitySearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <Button size="sm" variant="outline" onClick={() => exportToCSV(filteredFacilities, 'facilities-export', 'facility')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>File ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFacilities.slice(0, 100).map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell className="font-medium">{facility.name}</TableCell>
                        <TableCell>{facility.sector}</TableCell>
                        <TableCell>{facility.location}</TableCell>
                        <TableCell>{facility.expiry_date}</TableCell>
                        <TableCell className="text-xs">{facility.file_location_id}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditFacilityModal({...facility})}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteFacilityModal(facility)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredFacilities.length > 100 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing 100 of {filteredFacilities.length} facilities. Use search to filter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Management Tab */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Management
                  </CardTitle>
                  <CardDescription>Edit or delete payment records</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search payments..."
                    value={paymentSearchTerm}
                    onChange={(e) => setPaymentSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <Button size="sm" variant="outline" onClick={() => exportToCSV(filteredPayments, 'payments-export', 'payment')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.slice(0, 100).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.name}</TableCell>
                        <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                        <TableCell>{payment.sector}</TableCell>
                        <TableCell>{payment.location}</TableCell>
                        <TableCell>{payment.payment_date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditPaymentModal({...payment})}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletePaymentModal(payment)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredPayments.length > 100 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing 100 of {filteredPayments.length} payments. Use search to filter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                System Users
              </CardTitle>
              <CardDescription>View all registered users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Sector</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'sector_head' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.sector || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk-upload" className="mt-6">
          <BulkUpload />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Facility Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valid</span>
                    <span>{stats.activeFacilities} ({((stats.activeFacilities / stats.totalFacilities) * 100 || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ width: `${(stats.activeFacilities / stats.totalFacilities) * 100 || 0}%` }} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expiring</span>
                    <span>{stats.expiringFacilities} ({((stats.expiringFacilities / stats.totalFacilities) * 100 || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all" 
                      style={{ width: `${(stats.expiringFacilities / stats.totalFacilities) * 100 || 0}%` }} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expired</span>
                    <span>{stats.expiredFacilities} ({((stats.expiredFacilities / stats.totalFacilities) * 100 || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all" 
                      style={{ width: `${(stats.expiredFacilities / stats.totalFacilities) * 100 || 0}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Sectors by Facility Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.sectorBreakdown
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((sector, index) => (
                      <div key={sector.sector} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{sector.sector}</span>
                            <span>{sector.total}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all" 
                              style={{ width: `${(sector.total / stats.totalFacilities) * 100}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-5xl font-bold text-primary mb-2">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-muted-foreground">Total Revenue from {stats.totalPayments} Payments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Facility Modal */}
      <Dialog open={!!editFacilityModal} onOpenChange={(open) => !open && setEditFacilityModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Facility</DialogTitle>
          </DialogHeader>
          {editFacilityModal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Facility Name</Label>
                <Input value={editFacilityModal.name || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input value={editFacilityModal.sector || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, sector: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={editFacilityModal.location || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input value={editFacilityModal.district || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, district: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input value={editFacilityModal.expiry_date || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, expiry_date: e.target.value})} placeholder="DD/MM/YYYY" />
                </div>
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input value={editFacilityModal.effective_date || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, effective_date: e.target.value})} placeholder="DD/MM/YYYY" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>File Location ID</Label>
                <Input value={editFacilityModal.file_location_id || ''} onChange={(e) => setEditFacilityModal({...editFacilityModal, file_location_id: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFacilityModal(null)}>Cancel</Button>
            <Button onClick={handleUpdateFacility}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Facility Confirmation Modal */}
      <Dialog open={!!deleteFacilityModal} onOpenChange={(open) => !open && setDeleteFacilityModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Facility</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteFacilityModal?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFacilityModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteFacility(deleteFacilityModal?.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      <Dialog open={!!editPaymentModal} onOpenChange={(open) => !open && setEditPaymentModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editPaymentModal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editPaymentModal.name || ''} onChange={(e) => setEditPaymentModal({...editPaymentModal, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input type="number" value={editPaymentModal.amount_paid || 0} onChange={(e) => setEditPaymentModal({...editPaymentModal, amount_paid: parseFloat(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={editPaymentModal.location || ''} onChange={(e) => setEditPaymentModal({...editPaymentModal, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Input value={editPaymentModal.sector || ''} onChange={(e) => setEditPaymentModal({...editPaymentModal, sector: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={editPaymentModal.category || ''} onChange={(e) => setEditPaymentModal({...editPaymentModal, category: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input value={editPaymentModal.payment_date || ''} onChange={(e) => setEditPaymentModal({...editPaymentModal, payment_date: e.target.value})} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPaymentModal(null)}>Cancel</Button>
            <Button onClick={handleUpdatePayment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Modal */}
      <Dialog open={!!deletePaymentModal} onOpenChange={(open) => !open && setDeletePaymentModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the payment for "{deletePaymentModal?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePaymentModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeletePayment(deletePaymentModal?.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
