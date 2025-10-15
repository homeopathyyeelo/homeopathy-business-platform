
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useState } from 'react';

interface ProductSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  rackLocations?: string[];
}

const ProductSearchBar = ({ searchTerm, setSearchTerm, rackLocations = [] }: ProductSearchBarProps) => {
  const [searchType, setSearchType] = useState<'text' | 'rack'>('text');
  const [selectedRack, setSelectedRack] = useState<string>('');

  // When rack location changes
  const handleRackChange = (value: string) => {
    setSelectedRack(value);
    setSearchType('rack');
    setSearchTerm(`rack:${value}`);
  };

  // When text search changes
  const handleTextSearch = (value: string) => {
    setSearchType('text');
    setSearchTerm(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSelectedRack('');
    setSearchType('text');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mb-6">
      {/* Text search */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 start-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search products by name, SKU or manufacturer..."
          value={searchType === 'text' ? searchTerm : ''}
          onChange={(e) => handleTextSearch(e.target.value)}
          className="pl-10 w-full"
          disabled={searchType === 'rack'}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Rack location filter */}
      {rackLocations.length > 0 && (
        <div className="w-full sm:w-64">
          <Select 
            value={selectedRack} 
            onValueChange={handleRackChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by rack location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All locations</SelectItem>
              {rackLocations.map((rack) => (
                <SelectItem key={rack} value={rack}>
                  {rack}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default ProductSearchBar;
