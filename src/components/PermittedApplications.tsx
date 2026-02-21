import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import { FileSpreadsheet, Upload, Trash2, Search, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

const PermittedApplications = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { selectedRegion, selectedOffice, getRegionData, getLocationDisplay } = useRegionFilter();

  useEffect(() => {
    fetchFacilities();
  }, [selectedRegion, selectedOffice]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      let query = supabase.from("permitted_applications").select("*").order("name");

      if (selectedRegion?.id) {
        query = query.eq("region_id", selectedRegion.id);
      }
      if (selectedOffice?.id) {
        query = query.eq("office_id", selectedOffice.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast({ title: "Error loading facilities", variant: "destructive" });
    } finally {
      setLoading(false);
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
      fetchFacilities();
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

        const regionData = getRegionData();
        const mapped = json.map((row: any) => ({
          name: row["Facility Name"] || row["name"] || row["Facility"] || "",
          sector: row["Sector"] || row["sector"] || "",
          location: row["Location"] || row["location"] || "",
          district: row["District"] || row["district"] || "",
          effective_date: row["Effective Date"] || row["effective_date"] || "",
          expiry_date: row["Expiry Date"] || row["expiry_date"] || "",
          file_location_id: row["File Location ID"] || row["file_location_id"] || "",
          region_id: regionData.region_id,
          office_id: regionData.office_id,
        }));

        if (mapped.length === 0) {
          toast({ title: "No data found in file", variant: "destructive" });
          return;
        }

        const { error } = await supabase.from("permitted_applications").insert(mapped);
        if (error) throw error;

        toast({ title: "Upload successful", description: `${mapped.length} facilities uploaded` });
        fetchFacilities();
      } catch (error: any) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = facilities.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      f.name?.toLowerCase().includes(term) ||
      f.sector?.toLowerCase().includes(term) ||
      f.location?.toLowerCase().includes(term) ||
      f.district?.toLowerCase().includes(term)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Permitted Applications
        </CardTitle>
        <CardDescription>
          Manage permitted facility applications — {getLocationDisplay()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
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
            <Button variant="outline" onClick={fetchFacilities} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
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
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No facilities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((f) => (
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
          {filtered.length > 0 && (
            <div className="p-2 text-center text-sm text-muted-foreground border-t">
              Showing {filtered.length} of {facilities.length} facilities
            </div>
          )}
        </div>

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
