import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Building2, Calendar, DollarSign, Tag, Download, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import RegionIndicator from "./RegionIndicator";

interface Payment {
  id: string;
  name: string;
  location: string;
  sector: string | null;
  category: string | null;
  amount_paid: number;
  payment_date: string;
  created_at: string;
  region_id?: string | null;
  office_id?: string | null;
}

const SECTOR_OPTIONS = [
  "hospitality", "health", "mining", "infrastructure", "education",
  "agriculture", "manufacturing", "tourism", "finance", "transportation",
  "energy", "chemicals", "telecommunication", "quarry", "small scale mining",
  "mines and quarry", "chemicals & pesticide",
];

const PaymentSearch = () => {
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getLocationDisplay } = useRegionFilter();

  const handleSearch = async () => {
    if (!searchName.trim() && !searchLocation.trim() && sectorFilter === "all") {
      toast({
        title: "Search required",
        description: "Please enter at least a facility name, location, or select a sector.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from("payments").select("*");

      if (selectedRegion?.id) {
        query = query.eq("region_id", selectedRegion.id);
      }
      if (selectedOffice?.id) {
        query = query.eq("office_id", selectedOffice.id);
      }
      if (searchName.trim()) {
        query = query.ilike("name", `%${searchName.trim()}%`);
      }
      if (searchLocation.trim()) {
        query = query.ilike("location", `%${searchLocation.trim()}%`);
      }
      if (sectorFilter !== "all") {
        query = query.ilike("sector", sectorFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(200);

      if (error) {
        toast({ title: "Search failed", description: "Please try again.", variant: "destructive" });
        return;
      }

      setPayments(data || []);
    } catch (error) {
      toast({ title: "Search failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString || "N/A";
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "Date not available";
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount);
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount_paid, 0);

  const exportSearchResults = () => {
    if (payments.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ['Name', 'Amount Paid', 'Location', 'Sector', 'Category', 'Payment Date'];
    const csvContent = [
      headers.join(','),
      ...payments.map(p => [
        `"${p.name || ''}"`, `"${p.amount_paid || 0}"`, `"${p.location || ''}"`,
        `"${p.sector || ''}"`, `"${p.category || ''}"`, `"${p.payment_date || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `payment-search-results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful", description: `${payments.length} payments exported` });
  };

  const groupedPayments = payments.reduce((acc, payment) => {
    const key = payment.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(payment);
    return acc;
  }, {} as Record<string, Payment[]>);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Payment Status
            </CardTitle>
            <RegionIndicator />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="facilityName" className="text-sm font-medium">Facility Name</label>
              <Input
                id="facilityName"
                placeholder="Enter facility name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input
                id="location"
                placeholder="Enter location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sector</label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {SECTOR_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} disabled={isLoading} className="md:w-auto">
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search Payment Status"}
            </Button>
            {hasSearched && payments.length > 0 && (
              <Button variant="outline" onClick={exportSearchResults}>
                <Download className="h-4 w-4 mr-2" />
                Export Results ({payments.length})
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Searching within: {getLocationDisplay()}
          </p>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No payment records found matching your search criteria in {getLocationDisplay()}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold">{payments.length}</div>
                    <div className="text-xs text-muted-foreground">Records Found</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {formatAmount(totalAmount)}
                    </div>
                    <div className="text-xs text-green-600">Total Amount</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold">{Object.keys(groupedPayments).length}</div>
                    <div className="text-xs text-muted-foreground">Unique Facilities</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPayments).map(([facilityName, facilityPayments]) => {
                  const facilityTotal = facilityPayments.reduce((s, p) => s + p.amount_paid, 0);
                  return (
                    <div key={facilityName} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-primary">{facilityName}</h3>
                        <span className="text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
                          {formatAmount(facilityTotal)}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {facilityPayments.map((payment) => (
                          <Card key={payment.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm">{payment.name}</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>{payment.location}</span>
                                </div>
                                {payment.sector && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="w-4 h-4" />
                                    <span>{payment.sector}</span>
                                  </div>
                                )}
                                {payment.category && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="w-4 h-4" />
                                    <span>{payment.category}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-medium text-primary">
                                    {formatAmount(payment.amount_paid)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(payment.payment_date)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSearch;
