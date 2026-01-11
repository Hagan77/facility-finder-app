import { useRegion } from "@/contexts/RegionContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";

interface RegionIndicatorProps {
  className?: string;
}

const RegionIndicator = ({ className }: RegionIndicatorProps) => {
  const { selectedRegion, selectedOffice } = useRegion();

  if (!selectedRegion) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
        <MapPin className="h-3 w-3" />
        <span className="text-xs">{selectedRegion.name}</span>
      </Badge>
      {selectedOffice && (
        <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
          <Building2 className="h-3 w-3" />
          <span className="text-xs">{selectedOffice.office_name}</span>
        </Badge>
      )}
    </div>
  );
};

export default RegionIndicator;
