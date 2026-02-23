import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import * as XLSX from 'xlsx';

// Convert Excel serial date number to DD/MM/YYYY string
const excelDateToString = (value: any): string => {
  if (!value) return '';
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

// Normalize sector values to match the database ENUM
// The ENUM has many variants; we try to match the trimmed value as-is first,
// then fall back to a canonical lowercase form
const SECTOR_MAP: Record<string, string> = {
  'hospitality': 'hospitality',
  'health': 'health',
  'mining': 'mining',
  'infrastructure': 'infrastructure',
  'education': 'education',
  'agriculture': 'agriculture',
  'manufacturing': 'manufacturing',
  'tourism': 'tourism',
  'finance': 'finance',
  'transportation': 'transportation',
  'energy': 'energy',
  'chemicals': 'chemicals',
  'telecommunication': 'telecommunication',
  'quarry': 'quarry',
  'small scale mining': 'small scale mining',
  'mines and quarry': 'mines and quarry',
  'chemicals & pesticide': 'chemicals & pesticide',
  'chemicals & pesticides': 'chemicals & pesticides',
};

const normalizeSector = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  // Try exact match first (some enum values have uppercase variants)
  // Then try lowercase mapping
  const lower = trimmed.toLowerCase();
  return SECTOR_MAP[lower] || trimmed;
};

// Parse DD/MM/YYYY date format to Date object
const parseDateDDMMYYYY = (dateStr: string | number): Date | null => {
  if (!dateStr) return null;
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateStr * 86400000);
  }
  const str = String(dateStr);
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  // Try other formats
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Calculate facility status based on expiry date
const getFacilityStatus = (expiryDateStr: string): 'valid' | 'expiring' | 'expired' => {
  const expiryDate = parseDateDDMMYYYY(expiryDateStr);
  if (!expiryDate) return 'expired';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const ninetyDaysFromNow = new Date(today);
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  
  if (expiryDate <= today) return 'expired';
  if (expiryDate <= ninetyDaysFromNow) return 'expiring';
  return 'valid';
};

const BulkUpload = () => {
  const [facilitiesFile, setFacilitiesFile] = useState<File | null>(null);
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null);
  const [facilitiesData, setFacilitiesData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [facilitiesUploading, setFacilitiesUploading] = useState(false);
  const [paymentsUploading, setPaymentsUploading] = useState(false);
  const { toast } = useToast();
  const { getRegionData, getLocationDisplay } = useRegionFilter();

  // Calculate facility status summary
  const facilitySummary = useMemo(() => {
    const valid = facilitiesData.filter(f => getFacilityStatus(f.expiry_date) === 'valid').length;
    const expiring = facilitiesData.filter(f => getFacilityStatus(f.expiry_date) === 'expiring').length;
    const expired = facilitiesData.filter(f => getFacilityStatus(f.expiry_date) === 'expired').length;
    return { valid, expiring, expired };
  }, [facilitiesData]);

  const handleFacilitiesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFacilitiesFile(file);
      parseFacilitiesExcel(file);
    }
  };

  const handlePaymentsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentsFile(file);
      parsePaymentsExcel(file);
    }
  };

  // Helper to find a value from a row using case-insensitive key matching
  const getRowValue = (row: any, ...keys: string[]): any => {
    // First try exact match
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    // Then try case-insensitive match
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const found = rowKeys.find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
      if (found && row[found] !== undefined && row[found] !== null) return row[found];
    }
    return '';
  };

  const parseFacilitiesExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Excel headers:", json.length > 0 ? Object.keys(json[0] as any) : "empty");
        console.log("First row:", json[0]);
        
        // Map the Excel columns to database columns with case-insensitive matching
        const mappedData = json.map((row: any) => ({
          name: getRowValue(row, 'Facility Name', 'Name', 'name', 'facility name', 'FACILITY NAME'),
          sector: normalizeSector(String(getRowValue(row, 'Sector', 'sector', 'SECTOR') || '')),
          location: getRowValue(row, 'Location', 'location', 'LOCATION'),
          district: getRowValue(row, 'District', 'district', 'DISTRICT'),
          expiry_date: excelDateToString(getRowValue(row, 'Expiry Date', 'expiry_date', 'Expiry date', 'EXPIRY DATE')),
          effective_date: excelDateToString(getRowValue(row, 'Effective Date', 'effective_date', 'Effective date', 'EFFECTIVE DATE')),
          file_location_id: getRowValue(row, 'File Location ID', 'file_location_id', 'File Location Id', 'FILE LOCATION ID', 'File location ID'),
        }));
        
        setFacilitiesData(mappedData);
        toast({
          title: "File parsed successfully",
          description: `Found ${mappedData.length} facilities to upload`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "Please make sure the Excel file is properly formatted",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const parsePaymentsExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Payment Excel headers:", json.length > 0 ? Object.keys(json[0] as any) : "empty");
        
        const mappedData = json.map((row: any) => ({
          name: getRowValue(row, 'Name', 'name', 'NAME'),
          sector: normalizeSector(String(getRowValue(row, 'Sector', 'sector', 'SECTOR') || '')),
          location: getRowValue(row, 'Location', 'location', 'LOCATION'),
          category: getRowValue(row, 'Category', 'category', 'CATEGORY'),
          amount_paid: parseFloat(getRowValue(row, 'Amount Paid', 'amount_paid', 'AMOUNT PAID', 'Amount') || '0'),
          payment_date: excelDateToString(getRowValue(row, 'Payment Date', 'payment_date', 'PAYMENT DATE', 'Date')),
        }));
        
        setPaymentsData(mappedData);
        toast({
          title: "File parsed successfully",
          description: `Found ${mappedData.length} payments to upload`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "Please make sure the Excel file is properly formatted",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const uploadFacilities = async () => {
    if (facilitiesData.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please select and parse an Excel file first",
        variant: "destructive",
      });
      return;
    }

    setFacilitiesUploading(true);
    try {
      const regionData = getRegionData();
      const dataWithRegion = facilitiesData.map(f => ({
        ...f,
        region_id: regionData.region_id,
        office_id: regionData.office_id,
      }));
      
      const { data, error } = await supabase
        .from('facilities')
        .insert(dataWithRegion as any);

      if (error) throw error;

      toast({
        title: "Upload successful",
        description: `${facilitiesData.length} facilities uploaded successfully`,
      });
      
      // Reset
      setFacilitiesFile(null);
      setFacilitiesData([]);
      const fileInput = document.getElementById('facilities-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading",
        variant: "destructive",
      });
    } finally {
      setFacilitiesUploading(false);
    }
  };

  const uploadPayments = async () => {
    if (paymentsData.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please select and parse an Excel file first",
        variant: "destructive",
      });
      return;
    }

    setPaymentsUploading(true);
    try {
      const regionData = getRegionData();
      const dataWithRegion = paymentsData.map(p => ({
        ...p,
        region_id: regionData.region_id,
        office_id: regionData.office_id,
      }));
      
      const { data, error } = await supabase
        .from('payments')
        .insert(dataWithRegion);

      if (error) throw error;

      toast({
        title: "Upload successful",
        description: `${paymentsData.length} payments uploaded successfully`,
      });
      
      // Reset
      setPaymentsFile(null);
      setPaymentsData([]);
      const fileInput = document.getElementById('payments-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading",
        variant: "destructive",
      });
    } finally {
      setPaymentsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Bulk Data Upload</h2>
        <p className="text-muted-foreground">Upload Excel files to add facilities and payments in bulk</p>
      </div>

      {/* Region indicator for uploads */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Data will be uploaded to:</p>
              <p className="text-lg font-bold text-primary">{getLocationDisplay()}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All uploaded records will be automatically tagged with your selected region and office. 
            This data will only be visible to users viewing the same region.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="facilities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facilities">Upload Facilities</TabsTrigger>
          <TabsTrigger value="payments">Upload Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Facilities Excel Upload
              </CardTitle>
              <CardDescription>
                Upload an Excel file with the following columns: Facility Name, Sector, Location, District, Expiry Date, Effective Date, File Location ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facilities-file-input">Select Excel File</Label>
                <Input
                  id="facilities-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFacilitiesFileChange}
                />
              </div>

              {facilitiesData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{facilitiesData.length} facilities ready to upload</span>
                  </div>

                  {/* Status Summary */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{facilitySummary.valid}</div>
                      <div className="text-xs text-muted-foreground">Valid (&gt;90 days)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">{facilitySummary.expiring}</div>
                      <div className="text-xs text-muted-foreground">Expiring (0-90 days)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{facilitySummary.expired}</div>
                      <div className="text-xs text-muted-foreground">Expired</div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Facility Name</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facilitiesData.slice(0, 10).map((facility, index) => {
                            const status = getFacilityStatus(facility.expiry_date);
                            return (
                              <TableRow key={index}>
                                <TableCell>{facility.name}</TableCell>
                                <TableCell>{facility.sector}</TableCell>
                                <TableCell>{facility.location}</TableCell>
                                <TableCell>{facility.expiry_date}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    status === 'valid' ? 'default' : 
                                    status === 'expiring' ? 'secondary' : 'destructive'
                                  } className={
                                    status === 'valid' ? 'bg-green-600' : 
                                    status === 'expiring' ? 'bg-amber-600' : ''
                                  }>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {facilitiesData.length > 10 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        Showing 10 of {facilitiesData.length} rows
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={uploadFacilities} 
                    disabled={facilitiesUploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {facilitiesUploading ? 'Uploading...' : `Upload ${facilitiesData.length} Facilities`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Payments Excel Upload
              </CardTitle>
              <CardDescription>
                Upload an Excel file with the following columns: Name, Sector, Location, Category, Amount Paid, Payment Date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payments-file-input">Select Excel File</Label>
                <Input
                  id="payments-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handlePaymentsFileChange}
                />
              </div>

              {paymentsData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{paymentsData.length} payments ready to upload</span>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount Paid</TableHead>
                            <TableHead>Payment Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData.slice(0, 10).map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell>{payment.name}</TableCell>
                              <TableCell>{payment.sector}</TableCell>
                              <TableCell>{payment.location}</TableCell>
                              <TableCell>{payment.category}</TableCell>
                              <TableCell>₵{payment.amount_paid.toFixed(2)}</TableCell>
                              <TableCell>{payment.payment_date}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {paymentsData.length > 10 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        Showing 10 of {paymentsData.length} rows
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={uploadPayments} 
                    disabled={paymentsUploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {paymentsUploading ? 'Uploading...' : `Upload ${paymentsData.length} Payments`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            Excel Format Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">For Facilities:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Column headers: Facility Name, Sector, Location, District, Expiry Date, Effective Date, File Location ID</li>
              <li>Required columns: Facility Name, File Location ID</li>
              <li>Date format: DD/MM/YYYY (e.g., 25/12/2024)</li>
              <li>Status: Valid (&gt;90 days), Expiring (0-90 days), Expired (past date)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">For Payments:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Column headers: Name, Sector, Location, Category, Amount Paid, Payment Date</li>
              <li>Required columns: Name, Location, Amount Paid, Payment Date</li>
              <li>Amount Paid should be a number</li>
              <li>Date format: DD/MM/YYYY (e.g., 25/12/2024)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUpload;
