
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";
import { LocationFilter } from "@/types/location";

interface LocationSelectorProps {
  selectedLocations: LocationFilter;
  onLocationChange: (locations: LocationFilter) => void;
}

const LocationSelector = ({ selectedLocations, onLocationChange }: LocationSelectorProps) => {
  const [locationInputs, setLocationInputs] = useState({
    states: '',
    districts: '',
    cities: '',
    villages: '',
    localities: '',
    streets: '',
    pincodes: ''
  });

  const handleAddLocation = (level: keyof LocationFilter, value: string) => {
    if (!value.trim()) return;
    
    const currentValues = selectedLocations[level] || [];
    const newValues = [...currentValues, value.trim()];
    
    onLocationChange({
      ...selectedLocations,
      [level]: newValues
    });
    
    // Clear input
    setLocationInputs(prev => ({ ...prev, [level]: '' }));
  };

  const removeLocationFilter = (level: keyof LocationFilter, value: any) => {
    const currentValues = selectedLocations[level] || [];
    const newValues = currentValues.filter(v => v !== value);
    
    onLocationChange({
      ...selectedLocations,
      [level]: newValues
    });
  };

  const handleKeyPress = (level: keyof LocationFilter, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation(level, locationInputs[level]);
    }
  };

  const getSelectedLocationTags = () => {
    const selected: { level: string; name: string; value: any }[] = [];
    
    Object.entries(selectedLocations).forEach(([level, values]) => {
      if (values && values.length > 0) {
        values.forEach(value => {
          selected.push({ 
            level, 
            name: `${level.slice(0, -1)}: ${value}`, 
            value 
          });
        });
      }
    });
    
    return selected;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Targeting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'states', label: 'States' },
            { key: 'districts', label: 'Districts' },
            { key: 'cities', label: 'Cities' },
            { key: 'villages', label: 'Villages' },
            { key: 'localities', label: 'Localities' },
            { key: 'streets', label: 'Streets' },
            { key: 'pincodes', label: 'Pincodes' }
          ].map(({ key, label }) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={locationInputs[key as keyof typeof locationInputs]}
                onChange={(e) => setLocationInputs(prev => ({ 
                  ...prev, 
                  [key]: e.target.value 
                }))}
                onKeyPress={(e) => handleKeyPress(key as keyof LocationFilter, e)}
                placeholder={`Enter ${label.toLowerCase()} and press Enter`}
              />
            </div>
          ))}
        </div>

        {/* Selected Locations Display */}
        {getSelectedLocationTags().length > 0 && (
          <div>
            <Label>Selected Locations</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {getSelectedLocationTags().map((location, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {location.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeLocationFilter(location.level as keyof LocationFilter, location.value)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Location Summary */}
        <div className="text-sm text-muted-foreground">
          {getSelectedLocationTags().length === 0 
            ? "Add locations to target specific geographic areas"
            : `Targeting ${getSelectedLocationTags().length} location ${getSelectedLocationTags().length === 1 ? 'filter' : 'filters'}`
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;
