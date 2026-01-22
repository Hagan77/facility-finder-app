import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Building2, CreditCard, TrendingUp, Calendar, FileText, Search, AlertCircle, Clock, CheckCircle, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import RegionIndicator from "./RegionIndicator";
import FacilitySearch from "./FacilitySearch";
import PaymentSearch from "./PaymentSearch";
import BulkUpload from "./BulkUpload";

interface AdminDashboardProps {
  sectorFilter?: string;
  title?: string;
}

const AdminDashboard = ({ sectorFilter, title = "Director Dashboard" }: AdminDashboardProps) => {
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
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getLocationDisplay } = useRegionFilter();

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscription for facility changes
    const channel = supabase
      .channel('facility-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'facilities'
        },
        () => {
          console.log('Facility change detected, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sectorFilter, selectedRegion, selectedOffice]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch ALL facilities without any limits - paginate if necessary
      let allFacilities: any[] = [];
      let facilitiesCount = 0;
      let from = 0;
      const pageSize = 1000;
      
      // Keep fetching until we have all data
      while (true) {
        let query = supabase
          .from("facilities")
          .select("*", { count: 'exact' })
          .range(from, from + pageSize - 1);
        
        // Apply region filter
        if (selectedRegion) {
          query = query.eq("region_id", selectedRegion.id);
        }
        
        // Apply office filter
        if (selectedOffice) {
          query = query.eq("office_id", selectedOffice.id);
        }
        
        if (sectorFilter) {
          // Use exact match for enum type, case-insensitive by converting to lowercase
          query = query.eq("sector", sectorFilter.toLowerCase() as any);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          allFacilities = [...allFacilities, ...data];
        }
        
        if (from === 0) {
          facilitiesCount = count || 0;
        }
        
        // Break if we got less than pageSize or no more data
        if (!data || data.length < pageSize) {
          break;
        }
        
        from += pageSize;
      }
      
      console.log(`Dashboard data fetch - Sector filter: ${sectorFilter || 'None'}`);
      console.log(`Fetched ${allFacilities.length} facilities, total count: ${facilitiesCount}`);

      // Helper function to parse DD/MM/YYYY date format
      const parseExpiryDate = (dateString: string | null): Date | null => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        // DD/MM/YYYY -> new Date(year, month-1, day)
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };

      // Calculate facility statuses
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
      const ninetyDaysFromNow = new Date(today);
      ninetyDaysFromNow.setDate(today.getDate() + 90);

      let expired = 0;
      let expiring = 0;
      let active = 0;
      const sectorStats: Record<string, { expired: number; expiring: number; active: number; total: number }> = {};
      const validFacilitiesList: any[] = [];
      const expiringFacilitiesList: any[] = [];
      const expiredFacilitiesList: any[] = [];

      allFacilities.forEach((facility) => {
        const expiryDate = parseExpiryDate(facility.expiry_date);
        // NORMALIZE sector name to uppercase for consistent grouping
        const sector = (facility.sector || "Unknown").toUpperCase();

        if (!sectorStats[sector]) {
          sectorStats[sector] = { expired: 0, expiring: 0, active: 0, total: 0 };
        }
        sectorStats[sector].total++;

        if (!expiryDate) {
          // No expiry date means active
          active++;
          sectorStats[sector].active++;
          validFacilitiesList.push(facility);
        } else if (expiryDate < today) {
          // Expired: past expiry date
          expired++;
          sectorStats[sector].expired++;
          expiredFacilitiesList.push(facility);
        } else if (expiryDate <= ninetyDaysFromNow) {
          // Expiring: within 90 days (60-90 days range)
          expiring++;
          sectorStats[sector].expiring++;
          expiringFacilitiesList.push(facility);
        } else {
          // Active: more than 90 days until expiry
          active++;
          sectorStats[sector].active++;
          validFacilitiesList.push(facility);
        }
      });

      const sectorBreakdown = Object.entries(sectorStats).map(([sector, stats]) => ({
        sector,
        ...stats,
      }));

      // Fetch recent facilities with sector filter
      let recentQuery = supabase
        .from("facilities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      // Apply region filter
      if (selectedRegion) {
        recentQuery = recentQuery.eq("region_id", selectedRegion.id);
      }
      
      // Apply office filter
      if (selectedOffice) {
        recentQuery = recentQuery.eq("office_id", selectedOffice.id);
      }
      
      if (sectorFilter) {
        // Use exact match for enum type, case-insensitive by converting to lowercase
        recentQuery = recentQuery.eq("sector", sectorFilter.toLowerCase() as any);
      }

      const { data: recentFacilities, error: facilityError } = await recentQuery;
      if (facilityError) throw facilityError;

      // Fetch total count of payments - filter by sector if applicable
      let paymentsCountQuery = supabase
        .from("payments")
        .select("*", { count: "exact", head: true });
      
      // Apply region filter
      if (selectedRegion) {
        paymentsCountQuery = paymentsCountQuery.eq("region_id", selectedRegion.id);
      }
      
      // Apply office filter
      if (selectedOffice) {
        paymentsCountQuery = paymentsCountQuery.eq("office_id", selectedOffice.id);
      }
      
      if (sectorFilter) {
        paymentsCountQuery = paymentsCountQuery.ilike("sector", sectorFilter);
      }
      
      const { count: paymentsCount, error: paymentsCountError } = await paymentsCountQuery;

      if (paymentsCountError) throw paymentsCountError;

      // Fetch ALL payments to calculate total revenue - filter by sector if applicable
      let allPaymentsQuery = supabase
        .from("payments")
        .select("amount_paid");
      
      // Apply region filter
      if (selectedRegion) {
        allPaymentsQuery = allPaymentsQuery.eq("region_id", selectedRegion.id);
      }
      
      // Apply office filter
      if (selectedOffice) {
        allPaymentsQuery = allPaymentsQuery.eq("office_id", selectedOffice.id);
      }
      
      if (sectorFilter) {
        allPaymentsQuery = allPaymentsQuery.ilike("sector", sectorFilter);
      }
      
      const { data: allPayments, error: allPaymentsError } = await allPaymentsQuery;

      if (allPaymentsError) throw allPaymentsError;

      // Fetch recent payments for display - filter by sector if applicable
      let recentPaymentsQuery = supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      // Apply region filter
      if (selectedRegion) {
        recentPaymentsQuery = recentPaymentsQuery.eq("region_id", selectedRegion.id);
      }
      
      // Apply office filter
      if (selectedOffice) {
        recentPaymentsQuery = recentPaymentsQuery.eq("office_id", selectedOffice.id);
      }
      
      if (sectorFilter) {
        recentPaymentsQuery = recentPaymentsQuery.ilike("sector", sectorFilter);
      }
      
      const { data: recentPayments, error: paymentError } = await recentPaymentsQuery;

      if (paymentError) throw paymentError;

      const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      const actualTotal = allFacilities.length;
      console.log(`Setting stats with totalFacilities: ${actualTotal}`);
      
      setStats({
        totalFacilities: actualTotal,
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
        totalFacilitiesList: allFacilities,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no facilities in this category",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Facility Name', 'Sector', 'Location', 'District', 'Expiry Date', 'Effective Date', 'File Location ID'];
    const csvContent = [
      headers.join(','),
      ...data.map(facility => [
        `"${facility.name || ''}"`,
        `"${facility.sector || ''}"`,
        `"${facility.location || ''}"`,
        `"${facility.district || ''}"`,
        `"${facility.expiry_date || ''}"`,
        `"${facility.effective_date || ''}"`,
        `"${facility.file_location_id || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${data.length} facilities exported to ${filename}.csv`,
    });
  };

  const getCurrentModalData = () => {
    switch (modalOpen) {
      case 'valid':
        return stats.validFacilitiesList;
      case 'expiring':
        return stats.expiringFacilitiesList;
      case 'expired':
        return stats.expiredFacilitiesList;
      default:
        return [];
    }
  };

  const getModalTitle = () => {
    switch (modalOpen) {
      case 'valid':
        return 'Valid Facilities';
      case 'expiring':
        return 'Expiring Facilities';
      case 'expired':
        return 'Expired Facilities';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-xl text-muted-foreground">
          {sectorFilter ? `${sectorFilter} Sector Overview` : "Overview of facility management system"}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`grid w-full ${!sectorFilter ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-1 h-auto p-1`}>
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="facility-search" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
            <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Facility Search</span>
          </TabsTrigger>
          <TabsTrigger value="payment-search" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
            <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Payment Search</span>
          </TabsTrigger>
          {!sectorFilter && (
            <TabsTrigger value="bulk-upload" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Bulk Upload</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">

      {/* Facility Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalOpen('valid')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Facilities</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeFacilities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Permits valid beyond 90 days
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full"
              onClick={(e) => {
                e.stopPropagation();
                exportToCSV(stats.validFacilitiesList, 'valid-facilities');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalOpen('expiring')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Facilities</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringFacilities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Expiring within 90 days
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full"
              onClick={(e) => {
                e.stopPropagation();
                exportToCSV(stats.expiringFacilitiesList, 'expiring-facilities');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalOpen('expired')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Facilities</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiredFacilities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Permits have expired
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full"
              onClick={(e) => {
                e.stopPropagation();
                exportToCSV(stats.expiredFacilitiesList, 'expired-facilities');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Facility Details Modal */}
      <Dialog open={modalOpen !== null} onOpenChange={(open) => !open && setModalOpen(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {getCurrentModalData().length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No facilities in this category</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>File Location ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentModalData().map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell>{facility.sector}</TableCell>
                      <TableCell>{facility.location}</TableCell>
                      <TableCell>{facility.district}</TableCell>
                      <TableCell>{facility.expiry_date || 'N/A'}</TableCell>
                      <TableCell>{facility.effective_date || 'N/A'}</TableCell>
                      <TableCell>{facility.file_location_id || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* General Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacilities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered facilities
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full"
              onClick={() => exportToCSV(stats.totalFacilitiesList, 'total-facilities')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payment records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Breakdown */}
      {!sectorFilter && stats.sectorBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Status by Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.sectorBreakdown.map((sector) => (
                <div key={sector.sector} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{sector.sector}</p>
                    <p className="text-sm text-muted-foreground">Total: {sector.total}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                      <p className="text-green-700 dark:text-green-400 font-semibold">{sector.active}</p>
                      <p className="text-xs text-green-600 dark:text-green-500">Active</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded">
                      <p className="text-orange-700 dark:text-orange-400 font-semibold">{sector.expiring}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-500">Expiring</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                      <p className="text-red-700 dark:text-red-400 font-semibold">{sector.expired}</p>
                      <p className="text-xs text-red-600 dark:text-red-500">Expired</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentFacilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No facilities registered yet
                </p>
              ) : (
                stats.recentFacilities.map((facility) => (
                  <div key={facility.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-sm text-muted-foreground">{facility.location}</p>
                      <p className="text-xs text-muted-foreground">{facility.sector}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(facility.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No payments recorded yet
                </p>
              ) : (
                stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{payment.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.location}</p>
                      <p className="text-xs text-muted-foreground">{payment.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payment.amount_paid)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.payment_date}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Refresh Button */}
        <div className="text-center">
          <Button onClick={fetchDashboardData} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        </TabsContent>

        <TabsContent value="facility-search" className="mt-6">
          <FacilitySearch />
        </TabsContent>

        <TabsContent value="payment-search" className="mt-6">
          <PaymentSearch />
        </TabsContent>

        {!sectorFilter && (
          <TabsContent value="bulk-upload" className="mt-6">
            <BulkUpload />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
