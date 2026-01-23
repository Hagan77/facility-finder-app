import { useRegion } from "@/contexts/RegionContext";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Hook to apply region and office filters to Supabase queries
 * All data queries should use this to ensure proper data isolation
 */
export const useRegionFilter = () => {
  const { selectedRegion, selectedOffice } = useRegion();

  /**
   * Apply region/office filter to a Supabase query builder
   * @param query - The Supabase query builder
   * @returns The filtered query builder
   */
  const applyRegionFilter = <T extends PostgrestFilterBuilder<any, any, any>>(query: T): T => {
    let filteredQuery = query;
    
    if (selectedRegion) {
      filteredQuery = filteredQuery.eq("region_id", selectedRegion.id) as T;
    }
    
    if (selectedOffice) {
      filteredQuery = filteredQuery.eq("office_id", selectedOffice.id) as T;
    }
    
    return filteredQuery;
  };

  /**
   * Get the region/office IDs for inserts
   */
  const getRegionData = () => ({
    region_id: selectedRegion?.id || null,
    office_id: selectedOffice?.id || null,
  });

  /**
   * Get display string for current region/office
   */
  const getLocationDisplay = () => {
    if (!selectedRegion) return "All Regions";
    if (!selectedOffice) return selectedRegion.name;
    return `${selectedRegion.name} - ${selectedOffice.office_name}`;
  };

  return {
    selectedRegion,
    selectedOffice,
    applyRegionFilter,
    getRegionData,
    getLocationDisplay,
    hasRegion: !!selectedRegion,
    hasOffice: !!selectedOffice,
  };
};
