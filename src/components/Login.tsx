import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRegion } from "@/contexts/RegionContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, MapPin, Building2, ShieldAlert } from "lucide-react";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const { login } = useAuth();
  const { regions, offices, selectedRegion, selectedOffice, setSelectedRegion, setSelectedOffice, loading: regionsLoading, getOfficesForRegion } = useRegion();
  const { toast } = useToast();

  const availableOffices = selectedRegion ? getOfficesForRegion(selectedRegion.id) : [];

  useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      const ashanti = regions.find(r => r.code === 'AS');
      if (ashanti) setSelectedRegion(ashanti);
    }
  }, [regions, selectedRegion, setSelectedRegion]);

  useEffect(() => {
    if (selectedRegion && !selectedOffice && availableOffices.length === 1) {
      setSelectedOffice(availableOffices[0]);
    }
  }, [selectedRegion, selectedOffice, availableOffices, setSelectedOffice]);

  const handleRegionChange = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (region) setSelectedRegion(region);
  };

  const handleOfficeChange = (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    if (office) setSelectedOffice(office);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegion) {
      toast({ title: "Region Required", description: "Please select a region before logging in", variant: "destructive" });
      return;
    }

    if (!selectedOffice) {
      toast({ title: "Office Required", description: "Please select an office before logging in", variant: "destructive" });
      return;
    }

    setIsLogging(true);

    const result = login(username, password, selectedOffice.office_name);

    if (!result.success) {
      if ("reason" in result && result.reason === "wrong_office") {
        toast({
          title: "Access Denied",
          description: "You are attempting to log into the wrong office. Please select your assigned office to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}! You are logged into ${selectedRegion.name} - ${selectedOffice.office_name}.`,
      });
    }
    setIsLogging(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">Login</CardTitle>
          <CardDescription>Enter your credentials to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Region Selection */}
            <div className="space-y-2">
              <Label htmlFor="region" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Region
              </Label>
              <Select value={selectedRegion?.id || ""} onValueChange={handleRegionChange} disabled={regionsLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={regionsLoading ? "Loading regions..." : "Select region"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Office Selection */}
            <div className="space-y-2">
              <Label htmlFor="office" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Office
              </Label>
              <Select value={selectedOffice?.id || ""} onValueChange={handleOfficeChange} disabled={!selectedRegion || availableOffices.length === 0}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={
                    !selectedRegion ? "Select a region first"
                      : availableOffices.length === 0 ? "No offices available"
                      : "Select office"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {availableOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>{office.office_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <p className="text-xs text-muted-foreground">
                You must select the office you are assigned to. Cross-office login attempts will be denied.
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLogging || regionsLoading || !selectedOffice}>
              {isLogging ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
