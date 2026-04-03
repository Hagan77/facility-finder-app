import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

const SECTOR_OPTIONS = [
  "hospitality", "health", "mining", "infrastructure", "education",
  "agriculture", "manufacturing", "tourism", "finance", "transportation",
  "energy", "chemicals", "telecommunication", "quarry", "small scale mining",
  "mines and quarry", "chemicals & pesticide",
];

const FacilitySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getLocationDisplay } = useRegionFilter();

  const handleSearch = async () => {
    if (!searchTerm.trim() && !locationFilter.trim() && sectorFilter === "all") {
      toast({
        title: "Please enter a facility name, location, or select a sector",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase.from("facilities").select("*");

      if (selectedRegion?.id) {
        query = query.eq("region_id", selectedRegion.id);
      }
      if (selectedOffice?.id) {
        query = query.eq("office_id", selectedOffice.id);
      }
      if (searchTerm.trim()) {
        query = query.ilike("name", `%${searchTerm}%`);
      }
      if (locationFilter.trim()) {
        query = query.ilike("location", `%${locationFilter}%`);
      }

      const { data, error } = await query.order("name").limit(200);
      if (error) throw error;

      let results = data || [];
      // Client-side sector filter (ENUM type)
      if (sectorFilter !== "all") {
        results = results.filter(f =>
          f.sector?.toLowerCase().trim() === sectorFilter.toLowerCase()
        );
      }

      setFacilities(results);
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

  const formatDate = (dateString: string | number) => {
    if (!dateString) return "Not specified";
    if (typeof dateString === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateString * 86400000);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    const str = String(dateString);
    try {
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          }
        }
      }
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getStatus = (facility: Facility): 'valid' | 'expiring' | 'expired' => {
    if (!facility.expiry_date) return 'valid';
    const str = String(facility.expiry_date);
    let expiryDate: Date | null = null;
    if (typeof facility.expiry_date === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      expiryDate = new Date(excelEpoch.getTime() + (facility.expiry_date as any) * 86400000);
    } else if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      expiryDate = new Date(str);
    }
    if (!expiryDate || isNaN(expiryDate.getTime())) return 'valid';
    const today = new Date(); today.setHours(0,0,0,0);
    const ninety = new Date(today); ninety.setDate(today.getDate() + 90);
    if (expiryDate < today) return 'expired';
    if (expiryDate <= ninety) return 'expiring';
    return 'valid';
  };

  const exportSearchResults = () => {
    if (facilities.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ['Facility Name', 'Sector', 'Location', 'District', 'Expiry Date', 'Effective Date', 'File Location ID', 'Status'];
    const csvContent = [
      headers.join(','),
      ...facilities.map(f => [
        `"${f.name || ''}"`, `"${f.sector || ''}"`, `"${f.location || ''}"`,
        `"${f.district || ''}"`, `"${f.expiry_date || ''}"`, `"${f.effective_date || ''}"`,
        `"${f.file_location_id || ''}"`, `"${getStatus(f)}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `facility-search-results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful", description: `${facilities.length} facilities exported` });
  };

  // Summary stats
  const summary = {
    valid: facilities.filter(f => getStatus(f) === 'valid').length,
    expiring: facilities.filter(f => getStatus(f) === 'expiring').length,
    expired: facilities.filter(f => getStatus(f) === 'expired').length,
  };

  const groupedFacilities = facilities.reduce((acc, facility) => {
    const key = facility.name;
    if (!acc[key]) acc[key] = [];
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
        <div className="grid gap-2 md:grid-cols-3">
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
          <div>
            <label className="text-sm font-medium mb-2 block">Sector</label>
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
          <Button onClick={handleSearch} disabled={loading} className="md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search Facilities"}
          </Button>
          {searched && facilities.length > 0 && (
            <Button variant="outline" onClick={exportSearchResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results ({facilities.length})
            </Button>
          )}
        </div>
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
              {/* Results summary bar */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{facilities.length}</div>
                  <div className="text-xs text-muted-foreground">Total Found</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" />{summary.valid}
                  </div>
                  <div className="text-xs text-green-600">Valid</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600 flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />{summary.expiring}
                  </div>
                  <div className="text-xs text-orange-600">Expiring</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4" />{summary.expired}
                  </div>
                  <div className="text-xs text-red-600">Expired</div>
                </div>
              </div>

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
                    {facilityGroup.map((facility) => {
                      const status = getStatus(facility);
                      return (
                        <Card key={facility.id} className={`border-l-4 ${
                          status === 'valid' ? 'border-l-green-500' :
                          status === 'expiring' ? 'border-l-orange-500' :
                          'border-l-red-500'
                        }`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-xl flex items-center justify-between">
                              <span>{facility.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  status === 'valid' ? 'default' :
                                  status === 'expiring' ? 'secondary' : 'destructive'
                                } className={
                                  status === 'valid' ? 'bg-green-600' :
                                  status === 'expiring' ? 'bg-orange-500' : ''
                                }>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                                {facilityGroup.length > 1 && (
                                  <span className="text-sm font-normal text-muted-foreground bg-background border px-2 py-1 rounded">
                                    {facility.location}
                                  </span>
                                )}
                              </div>
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
                      );
                    })}
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
