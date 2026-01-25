import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import RegionIndicator from "./RegionIndicator";

interface Facility {
  id: number;
  name: string;
  location: string;
  district: string;
  sector?: string | null;
  effective_date: string;
  expiry_date: string;
  created_at: string;
  file_location_id?: string | null;
  region_id?: string | null;
  office_id?: string | null;
}

const FacilitySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getLocationDisplay } = useRegionFilter();

  const handleSearch = async () => {
    if (!searchTerm.trim() && !locationFilter.trim()) {
      toast({
        title: "Please enter a facility name or location",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from("facilities")
        .select("*");

      // Log current filter state for debugging
      console.log("Search filters:", {
        selectedRegion: selectedRegion?.id,
        selectedOffice: selectedOffice?.id,
        searchTerm,
        locationFilter
      });

      // Only apply region/office filters if they are selected
      // This allows searching across all data when no region is selected
      if (selectedRegion?.id) {
        query = query.eq("region_id", selectedRegion.id);
      }
      
      if (selectedOffice?.id) {
        query = query.eq("office_id", selectedOffice.id);
      }

      // Apply name filter if provided
      if (searchTerm.trim()) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      // Apply location filter if provided
      if (locationFilter.trim()) {
        query = query.ilike("location", `%${locationFilter}%`);
      }

      const { data, error, count } = await query.order("name").order("location").limit(100);

      console.log("Search results:", { count: data?.length, error });

      if (error) {
        throw error;
      }

      setFacilities(data || []);
    } catch (error) {
      console.error("Error searching facilities:", error);
      toast({
        title: "Error searching facilities",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    
    try {
      // First, try parsing DD/MM/YYYY or D/M/YYYY format
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
          const year = parseInt(parts[2], 10);
          
          const date = new Date(year, month, day);
          
          // Validate the date
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long", 
              day: "numeric",
            });
          }
        }
      }
      
      // Try parsing standard date formats (YYYY-MM-DD, etc.)
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      
      // Fallback: return original string if all parsing fails
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // Group facilities by name for better organization
  const groupedFacilities = facilities.reduce((acc, facility) => {
    const key = facility.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(facility);
    return acc;
  }, {} as Record<string, Facility[]>);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Search Facilities</h3>
        <RegionIndicator />
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Facility Name</label>
            <Input
              placeholder="Search by facility name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
        <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching..." : "Search Facilities"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Searching within: {getLocationDisplay()}
        </p>
      </div>

      {searched && (
        <div className="space-y-6">
          {facilities.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No facilities found matching your search criteria in {getLocationDisplay()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFacilities).map(([facilityName, facilityGroup]) => (
                <div key={facilityName} className="space-y-3">
                  {facilityGroup.length > 1 && (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{facilityName}</h3>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        {facilityGroup.length} locations
                      </span>
                    </div>
                  )}
                  <div className="grid gap-3">
                    {facilityGroup.map((facility) => (
                      <Card key={facility.id} className="border-l-4 border-l-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl flex items-center justify-between">
                            <span>{facility.name}</span>
                            {facilityGroup.length > 1 && (
                              <span className="text-sm font-normal text-muted-foreground bg-background border px-2 py-1 rounded">
                                {facility.location}
                              </span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {facilityGroup.length === 1 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Location</p>
                                <p>{facility.location}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">District</p>
                              <p>{facility.district}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Sector</p>
                              <p>{facility.sector || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                              <p>{formatDate(facility.effective_date)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                              <p>{formatDate(facility.expiry_date)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">File Location ID</p>
                              <p>{facility.file_location_id || "Not specified"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilitySearch;
