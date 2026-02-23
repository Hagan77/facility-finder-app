import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import { FileSpreadsheet, Upload, Trash2, Search, RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";

// Convert Excel serial date number to DD/MM/YYYY string
const excelDateToString = (value: any): string => {
  if (!value && value !== 0) return '';
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(value);
};

// Case-insensitive row value getter
const getRowValue = (row: any, keys: string[]): string => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
    if (match && row[match] !== undefined && row[match] !== null) {
      return String(row[match]);
    }
  }
  return "";
};

// Get raw value (preserving type for date conversion)
const getRawValue = (row: any, keys: string[]): any => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
    if (match && row[match] !== undefined && row[match] !== null) {
      return row[match];
    }
  }
  return "";
};

const PermittedApplications = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getRegionData, getLocationDisplay } = useRegionFilter();

  const handleSearch = async () => {
    if (!searchTerm.trim() && !locationFilter.trim()) {
      toast({ title: "Please enter a facility name or location", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase.from("permitted_applications").select("*").order("name");

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

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error("Error searching:", error);
      toast({ title: "Error searching facilities", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      let query = supabase.from("permitted_applications").select("*").order("name");

      if (selectedRegion?.id) {
        query = query.eq("region_id", selectedRegion.id);
      }
      if (selectedOffice?.id) {
        query = query.eq("office_id", selectedOffice.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "No data to export", variant: "destructive" });
        return;
      }

      const exportData = data.map((f: any) => ({
        "Facility Name": f.name || "",
        "Sector": f.sector || "",
        "Location": f.location || "",
        "District": f.district || "",
        "Effective Date": f.effective_date || "",
        "Expiry Date": f.expiry_date || "",
        "File Location ID": f.file_location_id || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Permitted Applications");
      XLSX.writeFile(wb, `permitted_applications_${getLocationDisplay().replace(/\s+/g, "_")}.xlsx`);

      toast({ title: "Export successful", description: `${data.length} records exported` });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("permitted_applications").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Facility deleted successfully" });
      setDeleteId(null);
      // Remove from local state
      setFacilities(prev => prev.filter(f => f.id !== deleteId));
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setUploading(true);
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        console.log("Permitted Apps Excel headers:", json.length > 0 ? Object.keys(json[0] as any) : "empty");
        console.log("First row:", json[0]);

        const regionData = getRegionData();
        const mapped = json.map((row: any) => {
          const rawEffective = getRawValue(row, ["effective date", "effective_date", "effectivedate"]);
          const rawExpiry = getRawValue(row, ["expiry date", "expiry_date", "expirydate"]);

          return {
            name: getRowValue(row, ["facility name", "name", "facility"]),
            sector: getRowValue(row, ["sector"]),
            location: getRowValue(row, ["location"]),
            district: getRowValue(row, ["district"]),
            effective_date: excelDateToString(rawEffective),
            expiry_date: excelDateToString(rawExpiry),
            file_location_id: getRowValue(row, ["file location id", "file_location_id", "file location"]),
            region_id: regionData.region_id,
            office_id: regionData.office_id,
          };
        });

        if (mapped.length === 0) {
          toast({ title: "No data found in file", variant: "destructive" });
          return;
        }

        const { error } = await supabase.from("permitted_applications").insert(mapped);
        if (error) throw error;

        toast({ title: "Upload successful", description: `${mapped.length} facilities uploaded` });
        // If user had searched, refresh results
        if (searched) {
          handleSearch();
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Permitted Applications
        </CardTitle>
        <CardDescription>
          Search and manage permitted facility applications — {getLocationDisplay()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search bar */}
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Facility Name</label>
              <Input
                placeholder="Search by facility name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="outline" onClick={handleExportAll} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export All"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="w-[60px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Searching...
                      </TableCell>
                    </TableRow>
                  ) : facilities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No facilities found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    facilities.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell>{f.sector}</TableCell>
                        <TableCell>{f.location}</TableCell>
                        <TableCell>{f.district}</TableCell>
                        <TableCell>{f.effective_date || "N/A"}</TableCell>
                        <TableCell>{f.expiry_date || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(f.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {facilities.length > 0 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                Showing {facilities.length} results
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-8 text-muted-foreground">
            Search for facilities by name or location above
          </div>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete this facility? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PermittedApplications;
