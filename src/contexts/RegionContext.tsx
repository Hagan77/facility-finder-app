import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Office {
  id: string;
  region_id: string;
  office_name: string;
}

interface RegionContextType {
  regions: Region[];
  offices: Office[];
  selectedRegion: Region | null;
  selectedOffice: Office | null;
  setSelectedRegion: (region: Region | null) => void;
  setSelectedOffice: (office: Office | null) => void;
  loading: boolean;
  getOfficesForRegion: (regionId: string) => Office[];
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedRegion, setSelectedRegionState] = useState<Region | null>(null);
  const [selectedOffice, setSelectedOfficeState] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegionsAndOffices();
    
    // Load saved selection from localStorage
    const savedRegion = localStorage.getItem("selectedRegion");
    const savedOffice = localStorage.getItem("selectedOffice");
    
    if (savedRegion) {
      setSelectedRegionState(JSON.parse(savedRegion));
    }
    if (savedOffice) {
      setSelectedOfficeState(JSON.parse(savedOffice));
    }
  }, []);

  const fetchRegionsAndOffices = async () => {
    try {
      setLoading(true);
      
      const [regionsResult, officesResult] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("offices").select("*").order("office_name")
      ]);

      if (regionsResult.error) throw regionsResult.error;
      if (officesResult.error) throw officesResult.error;

      setRegions((regionsResult.data || []) as Region[]);
      setOffices((officesResult.data || []) as Office[]);
    } catch (error) {
      console.error("Error fetching regions and offices:", error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedRegion = (region: Region | null) => {
    setSelectedRegionState(region);
    if (region) {
      localStorage.setItem("selectedRegion", JSON.stringify(region));
    } else {
      localStorage.removeItem("selectedRegion");
    }
    // Clear office when region changes
    setSelectedOffice(null);
  };

  const setSelectedOffice = (office: Office | null) => {
    setSelectedOfficeState(office);
    if (office) {
      localStorage.setItem("selectedOffice", JSON.stringify(office));
    } else {
      localStorage.removeItem("selectedOffice");
    }
  };

  const getOfficesForRegion = (regionId: string): Office[] => {
    return offices.filter(office => office.region_id === regionId);
  };

  return (
    <RegionContext.Provider value={{
      regions,
      offices,
      selectedRegion,
      selectedOffice,
      setSelectedRegion,
      setSelectedOffice,
      loading,
      getOfficesForRegion,
    }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
