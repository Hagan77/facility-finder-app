import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AddFacility = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    district: "",
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
        title: "Please fill in all fields",
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
        description: `${formData.name} has been added to the database`,
      });

      // Reset form
      setFormData({
        name: "",
        location: "",
        district: "",
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Facility</CardTitle>
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
  );
};

export default AddFacility;