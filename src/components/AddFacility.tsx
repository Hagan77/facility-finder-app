import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, Search, CreditCard, Info } from "lucide-react";

const AddFacility = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    district: "",
    sector: "",
    effective_date: "",
    expiry_date: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.district || !formData.effective_date || !formData.expiry_date) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, location, district, and dates are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("facilities")
        .insert([formData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Facility added successfully",
        description: `${formData.name} has been added to the permit database. You can now search for it in "Check Permit Status".`,
      });

      // Reset form
      setFormData({
        name: "",
        location: "",
        district: "",
        sector: "",
        effective_date: "",
        expiry_date: "",
      });
    } catch (error) {
      console.error("Error adding facility:", error);
      toast({
        title: "Error adding facility",
        description: "Please try again later",
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
          <strong>About Adding Facilities:</strong> When you add a facility here, it will be stored in the permit database. 
          You can then search for this facility using the <strong>"Check Permit Status"</strong> function. 
          To add payment records for this facility, you'll need to add them separately to the payment database.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              After Adding - Check Permit Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once added, you can search for this facility in the "Check Permit Status" section using the facility name or location.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Records Separate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Payment records are stored separately. Use "Check Payment Status" to search existing payment data.
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Add New Facility to Permit Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Facility Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter facility name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              placeholder="Enter district"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector (Optional)</Label>
            <Input
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              placeholder="e.g., Mining, Agriculture, Manufacturing"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                name="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding Facility..." : "Add Facility"}
          </Button>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFacility;