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
import * as XLSX from 'xlsx';

// Parse DD/MM/YYYY date format to Date object
const parseDateDDMMYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
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

  const parseFacilitiesExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Map the Excel columns to database columns
        const mappedData = json.map((row: any) => ({
          name: row['Facility Name'] || row['name'] || '',
          sector: row['Sector'] || row['sector'] || '',
          location: row['Location'] || row['location'] || '',
          district: row['District'] || row['district'] || '',
          expiry_date: row['Expiry Date'] || row['expiry_date'] || '',
          effective_date: row['Effective Date'] || row['effective_date'] || '',
          file_location_id: row['File Location ID'] || row['file_location_id'] || '',
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
        
        // Map the Excel columns to database columns
        const mappedData = json.map((row: any) => ({
          name: row['Name'] || row['name'] || '',
          sector: row['Sector'] || row['sector'] || '',
          location: row['Location'] || row['location'] || '',
          category: row['Category'] || row['category'] || '',
          amount_paid: parseFloat(row['Amount Paid'] || row['amount_paid'] || '0'),
          payment_date: row['Payment Date'] || row['payment_date'] || '',
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
      const { data, error } = await supabase
        .from('facilities')
        .insert(facilitiesData);

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
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentsData);

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
