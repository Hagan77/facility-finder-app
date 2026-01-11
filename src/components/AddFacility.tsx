import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRegionFilter } from "@/hooks/useRegionFilter";
import RegionIndicator from "./RegionIndicator";
import { Building, Search, CreditCard, Info, Database } from "lucide-react";

type SectorType = "agriculture" | "chemicals" | "education" | "energy" | "finance" | "health" | "hospitality" | "infrastructure" | "manufacturing" | "mining" | "quarry" | "telecommunication" | "tourism" | "transportation";

const AddFacility = () => {
  const [databaseType, setDatabaseType] = useState<"permit" | "payment">("permit");
  const [facilityFormData, setFacilityFormData] = useState<{
    name: string;
    location: string;
    district: string;
    sector: SectorType | "";
    file_location_id: string;
    effective_date: string;
    expiry_date: string;
  }>({
    name: "",
    location: "",
    district: "",
    sector: "",
    file_location_id: "",
    effective_date: "",
    expiry_date: "",
  });
  const [paymentFormData, setPaymentFormData] = useState({
    name: "",
    location: "",
    sector: "",
    category: "",
    amount_paid: "",
    payment_date: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getRegionData, getLocationDisplay } = useRegionFilter();

  const handleFacilityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFacilityFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (databaseType === "permit") {
      if (!facilityFormData.name || !facilityFormData.location || !facilityFormData.district || !facilityFormData.sector || !facilityFormData.file_location_id || !facilityFormData.effective_date || !facilityFormData.expiry_date) {
        toast({
          title: "Please fill in all required fields",
          description: "All fields including sector are required",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!paymentFormData.name || !paymentFormData.location || !paymentFormData.amount_paid || !paymentFormData.payment_date) {
        toast({
          title: "Please fill in all required fields",
          description: "Name, location, amount paid, and payment date are required",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (databaseType === "permit") {
        // Only insert if sector is not empty
        if (!facilityFormData.sector) {
          throw new Error("Sector is required");
        }

        const regionData = getRegionData();
        const { error } = await supabase
          .from("facilities")
          .insert([{
            name: facilityFormData.name,
            location: facilityFormData.location,
            district: facilityFormData.district,
            sector: facilityFormData.sector as SectorType,
            file_location_id: facilityFormData.file_location_id,
            effective_date: facilityFormData.effective_date,
            expiry_date: facilityFormData.expiry_date,
            region_id: regionData.region_id,
            office_id: regionData.office_id,
          }]);

        if (error) {
          console.error("Facility insert error:", error);
          throw error;
        }

        toast({
          title: "Facility added successfully",
          description: `${facilityFormData.name} has been added to the permit database. You can now search for it in "Check Permit Status".`,
        });

        // Reset form
        setFacilityFormData({
          name: "",
          location: "",
          district: "",
          sector: "",
          file_location_id: "",
          effective_date: "",
          expiry_date: "",
        });
      } else {
        const regionData = getRegionData();
        const paymentData = {
          ...paymentFormData,
          amount_paid: parseFloat(paymentFormData.amount_paid),
          region_id: regionData.region_id,
          office_id: regionData.office_id,
        };

        const { error } = await supabase
          .from("payments")
          .insert([paymentData]);

        if (error) {
          console.error("Payment insert error:", error);
          throw error;
        }

        toast({
          title: "Payment record added successfully",
          description: `Payment record for ${paymentFormData.name} has been added to the payment database. You can now search for it in "Check Payment Status".`,
        });

        // Reset form
        setPaymentFormData({
          name: "",
          location: "",
          sector: "",
          category: "",
          amount_paid: "",
          payment_date: "",
        });
      }
    } catch (error: any) {
      console.error("Error adding record:", error);
      toast({
        title: `Error adding ${databaseType === "permit" ? "facility" : "payment record"}`,
        description: error?.message || "Please check console for details and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>About Adding Records:</strong> Choose between adding to the permit database 
          (searchable via "Check Permit Status") or payment database (searchable via "Check Payment Status").
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Permit Database
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Facilities added here can be searched in "Check Permit Status" using facility name or location.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Database
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Payment records added here can be searched in "Check Payment Status".
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Add New Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="database-type">Select Database</Label>
              <Select value={databaseType} onValueChange={(value: "permit" | "payment") => setDatabaseType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permit">Permit Status Database</SelectItem>
                  <SelectItem value="payment">Payment Records Database</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {databaseType === "permit" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={facilityFormData.name}
                    onChange={handleFacilityInputChange}
                    placeholder="Enter facility name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={facilityFormData.location}
                    onChange={handleFacilityInputChange}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    name="district"
                    value={facilityFormData.district}
                    onChange={handleFacilityInputChange}
                    placeholder="Enter district"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Select 
                    value={facilityFormData.sector} 
                    onValueChange={(value: SectorType) => setFacilityFormData(prev => ({ ...prev, sector: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="tourism">Tourism</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="chemicals">Chemicals</SelectItem>
                      <SelectItem value="telecommunication">Telecommunication</SelectItem>
                      <SelectItem value="quarry">Quarry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_location_id">File Location ID</Label>
                  <Input
                    id="file_location_id"
                    name="file_location_id"
                    value={facilityFormData.file_location_id}
                    onChange={handleFacilityInputChange}
                    placeholder="Enter file location ID"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="effective_date">Effective Date</Label>
                    <Input
                      id="effective_date"
                      name="effective_date"
                      type="date"
                      value={facilityFormData.effective_date}
                      onChange={handleFacilityInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      name="expiry_date"
                      type="date"
                      value={facilityFormData.expiry_date}
                      onChange={handleFacilityInputChange}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={paymentFormData.name}
                    onChange={handlePaymentInputChange}
                    placeholder="Enter facility name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={paymentFormData.location}
                    onChange={handlePaymentInputChange}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sector (Optional)</Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={paymentFormData.sector}
                    onChange={handlePaymentInputChange}
                    placeholder="e.g., Mining, Agriculture, Manufacturing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    name="category"
                    value={paymentFormData.category}
                    onChange={handlePaymentInputChange}
                    placeholder="e.g., License Fee, Permit Fee"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_paid">Amount Paid (GHS)</Label>
                    <Input
                      id="amount_paid"
                      name="amount_paid"
                      type="number"
                      step="0.01"
                      value={paymentFormData.amount_paid}
                      onChange={handlePaymentInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      value={paymentFormData.payment_date}
                      onChange={handlePaymentInputChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? `Adding ${databaseType === "permit" ? "Facility" : "Payment Record"}...` 
                : `Add ${databaseType === "permit" ? "Facility" : "Payment Record"}`
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFacility;