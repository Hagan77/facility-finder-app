import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building2, CreditCard, TrendingUp, Calendar, FileText, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalFacilities: 0,
    totalPayments: 0,
    totalRevenue: 0,
    recentFacilities: [] as any[],
    recentPayments: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total count of facilities
      const { count: facilitiesCount, error: facilitiesCountError } = await supabase
        .from("facilities")
        .select("*", { count: "exact", head: true });

      if (facilitiesCountError) throw facilitiesCountError;

      // Fetch recent facilities
      const { data: recentFacilities, error: facilityError } = await supabase
        .from("facilities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (facilityError) throw facilityError;

      // Fetch total count of payments
      const { count: paymentsCount, error: paymentsCountError } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      if (paymentsCountError) throw paymentsCountError;

      // Fetch ALL payments to calculate total revenue
      const { data: allPayments, error: allPaymentsError } = await supabase
        .from("payments")
        .select("amount_paid");

      if (allPaymentsError) throw allPaymentsError;

      // Fetch recent payments for display
      const { data: recentPayments, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (paymentError) throw paymentError;

      const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      setStats({
        totalFacilities: facilitiesCount || 0,
        totalPayments: paymentsCount || 0,
        totalRevenue,
        recentFacilities: recentFacilities || [],
        recentPayments: recentPayments || [],
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <h1 className="text-4xl font-bold mb-2">Director Dashboard</h1>
        <p className="text-xl text-muted-foreground">Overview of facility management system</p>
      </div>

      {/* Stats Cards */}
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time revenue
            </p>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default AdminDashboard;
