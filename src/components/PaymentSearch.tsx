import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Building2, Calendar, DollarSign, Tag } from "lucide-react";
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

const PaymentSearch = () => {
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getLocationDisplay } = useRegionFilter();

  const handleSearch = async () => {
    if (!searchName.trim() && !searchLocation.trim()) {
      toast({
        title: "Search required",
        description: "Please enter at least a facility name or location to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from("payments").select("*");

      // Apply region filter
      if (selectedRegion) {
        query = query.eq("region_id", selectedRegion.id);
      }
      
      // Apply office filter
      if (selectedOffice) {
        query = query.eq("office_id", selectedOffice.id);
      }

      if (searchName.trim()) {
        query = query.ilike("name", `%${searchName.trim()}%`);
      }

      if (searchLocation.trim()) {
        query = query.ilike("location", `%${searchLocation.trim()}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error searching payments:", error);
        toast({
          title: "Search failed",
          description: "There was an error searching for payments. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error("Error searching payments:", error);
      toast({
        title: "Search failed",
        description: "There was an error searching for payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date not available";
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount);
  };

  // Group payments by name for better organization
  const groupedPayments = payments.reduce((acc, payment) => {
    const key = payment.name;
    if (!acc[key]) {
      acc[key] = [];
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="facilityName" className="text-sm font-medium">
                Facility Name
              </label>
              <Input
                id="facilityName"
                placeholder="Enter facility name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                placeholder="Enter location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Searching..." : "Search Payment Status"}
          </Button>
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Payment Records Found ({payments.length} results)
                </h2>
              </div>
              
              <div className="space-y-6">
                {Object.entries(groupedPayments).map(([facilityName, facilityPayments]) => (
                  <div key={facilityName} className="space-y-3">
                    <h3 className="text-lg font-medium text-primary">
                      {facilityName}
                    </h3>
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
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSearch;
