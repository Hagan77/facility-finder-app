import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Facility {
  id: number;
  name: string;
  location: string;
  district: string;
  effective_date: string;
  expiry_date: string;
  created_at: string;
}

const FacilitySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a facility name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .order("name");

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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a facility by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {searched && (
        <div className="space-y-4">
          {facilities.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No facilities found matching "{searchTerm}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {facilities.map((facility) => (
                <Card key={facility.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{facility.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p>{facility.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">District</p>
                        <p>{facility.district}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                        <p>{formatDate(facility.effective_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                        <p>{formatDate(facility.expiry_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilitySearch;