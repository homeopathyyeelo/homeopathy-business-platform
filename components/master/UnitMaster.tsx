
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UnitForm from './unit-form/UnitForm';

const UnitMaster = () => {
  const { getAll } = useDatabase();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  
  const { data: units = [], isLoading, refetch } = useQuery({
    queryKey: ['units'],
    queryFn: () => getAll('units')
  });
  
  const filteredUnits = units.filter((unit: any) => {
    const searchLower = searchTerm.toLowerCase();
    return unit.name?.toLowerCase().includes(searchLower) || 
           unit.short_name?.toLowerCase().includes(searchLower);
  });
  
  const handleAddUnit = () => {
    setSelectedUnit(null);
    setIsDialogOpen(true);
  };
  
  const handleEditUnit = (unit: any) => {
    setSelectedUnit(unit);
    setIsDialogOpen(true);
  };
  
  const handleSaveUnit = async () => {
    setIsDialogOpen(false);
    await refetch();
    toast({
      title: selectedUnit ? "Unit Updated" : "Unit Created",
      description: `Unit has been ${selectedUnit ? 'updated' : 'added'} successfully`
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Units</CardTitle>
        <Button onClick={handleAddUnit}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Unit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <Input 
            placeholder="Search units..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="max-w-xs"
          />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Base Unit</TableHead>
              <TableHead>Conversion Factor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading units...</TableCell>
              </TableRow>
            ) : filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No units found</TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit: any) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell>{unit.short_name}</TableCell>
                  <TableCell>
                    {unit.base_unit_id ? 
                      units.find((u: any) => u.id === unit.base_unit_id)?.name || '-' 
                      : 'Base Unit'}
                  </TableCell>
                  <TableCell>{unit.conversion_factor}</TableCell>
                  <TableCell>{unit.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Unit Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUnit ? 'Edit Unit' : 'Add New Unit'}
            </DialogTitle>
          </DialogHeader>
          <UnitForm 
            unit={selectedUnit}
            allUnits={units}
            onSave={handleSaveUnit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UnitMaster;
