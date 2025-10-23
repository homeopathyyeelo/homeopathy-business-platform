
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LoyaltyTier } from '@/types/loyalty';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialTiers: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minimumPoints: 0,
    bonusMultiplier: 1.0,
    description: "Entry level tier for all customers",
    benefits: ["Earn 1x points on all purchases"],
    icon: "",
    isActive: true
  },
  {
    id: "silver",
    name: "Silver",
    minimumPoints: 500,
    bonusMultiplier: 1.2,
    description: "Silver members earn extra points",
    benefits: ["Earn 1.2x points on all purchases", "Free shipping on orders above 500"],
    icon: "",
    isActive: true
  },
  {
    id: "gold",
    name: "Gold",
    minimumPoints: 2000,
    bonusMultiplier: 1.5,
    description: "VIP treatment for gold members",
    benefits: ["Earn 1.5x points on all purchases", "Free shipping on all orders", "Priority customer service"],
    icon: "",
    isActive: true
  },
  {
    id: "platinum",
    name: "Platinum",
    minimumPoints: 5000,
    bonusMultiplier: 2.0,
    description: "Exclusive benefits for our most loyal customers",
    benefits: ["Earn 2x points on all purchases", "Free shipping on all orders", "Priority customer service", "Exclusive early access to new products"],
    icon: "",
    isActive: true
  }
];

const LoyaltyTiers = () => {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<LoyaltyTier[]>(initialTiers);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [benefitInput, setBenefitInput] = useState("");
  
  const handleAddBenefit = () => {
    if (!benefitInput.trim() || !editingTier) return;
    
    setEditingTier({
      ...editingTier,
      benefits: [...(editingTier.benefits || []), benefitInput.trim()]
    });
    setBenefitInput("");
  };
  
  const handleRemoveBenefit = (index: number) => {
    if (!editingTier) return;
    
    setEditingTier({
      ...editingTier,
      benefits: editingTier.benefits?.filter((_, i) => i !== index) || []
    });
  };
  
  const handleSaveTier = () => {
    if (!editingTier) return;
    
    // If editing an existing tier
    if (editingTier.id && tiers.some(t => t.id === editingTier.id)) {
      setTiers(tiers.map(tier => 
        tier.id === editingTier.id ? editingTier : tier
      ));
      toast({
        title: "Tier Updated",
        description: `${editingTier.name} tier has been updated`
      });
    } 
    // If adding a new tier
    else {
      // Generate a simple ID based on the name
      const newId = editingTier.name?.toLowerCase().replace(/\s+/g, '-') || `tier-${Date.now()}`;
      setTiers([...tiers, { ...editingTier, id: newId }]);
      toast({
        title: "Tier Added",
        description: `${editingTier.name} tier has been added`
      });
    }
    
    setDialogOpen(false);
    setEditingTier(null);
  };
  
  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTier({...tier});
    setDialogOpen(true);
  };
  
  const handleDeleteTier = (tierId: string) => {
    setTiers(tiers.filter(tier => tier.id !== tierId));
    toast({
      title: "Tier Deleted",
      description: "Loyalty tier has been removed"
    });
  };
  
  const handleAddNewTier = () => {
    setEditingTier({
      id: "",
      name: "",
      minimumPoints: 0,
      bonusMultiplier: 1.0,
      description: "",
      benefits: [],
      icon: "",
      isActive: true
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Loyalty Program Tiers</CardTitle>
            <CardDescription>Define different levels of customer loyalty</CardDescription>
          </div>
          <Button onClick={handleAddNewTier} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Add Tier</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Minimum Points</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="text-2xl">{tier.icon}</TableCell>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.minimumPoints}</TableCell>
                  <TableCell>{tier.bonusMultiplier}x points</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${tier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTier(tier)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTier?.id ? 'Edit' : 'Add New'} Loyalty Tier</DialogTitle>
            <DialogDescription>
              Define the tier details and benefits
            </DialogDescription>
          </DialogHeader>
          
          {editingTier && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tier-name">Tier Name</Label>
                <Input
                  id="tier-name"
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({...editingTier, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier-icon">Icon</Label>
                <Input
                  id="tier-icon"
                  value={editingTier.icon}
                  onChange={(e) => setEditingTier({...editingTier, icon: e.target.value})}
                  placeholder="Emoji or icon character"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier-points">Minimum Points</Label>
                <Input
                  id="tier-points"
                  type="number"
                  min="0"
                  value={editingTier.minimumPoints}
                  onChange={(e) => setEditingTier({...editingTier, minimumPoints: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier-multiplier">Points Multiplier</Label>
                <Input
                  id="tier-multiplier"
                  type="number"
                  min="1"
                  step="0.1"
                  value={editingTier.bonusMultiplier}
                  onChange={(e) => setEditingTier({...editingTier, bonusMultiplier: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground">Multiplier for points earned at this tier (1.0 = 1x, 1.5 = 1.5x, etc.)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier-description">Description</Label>
                <Input
                  id="tier-description"
                  value={editingTier.description || ''}
                  onChange={(e) => setEditingTier({...editingTier, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Active Status</Label>
                  <Switch
                    checked={editingTier.isActive}
                    onCheckedChange={(checked) => setEditingTier({...editingTier, isActive: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier-benefits">Benefits</Label>
                <div className="flex gap-2">
                  <Input
                    id="tier-benefits"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder="Add a benefit"
                  />
                  <Button type="button" onClick={handleAddBenefit} size="sm">Add</Button>
                </div>
                
                <ul className="mt-2 space-y-1">
                  {editingTier.benefits?.map((benefit, index) => (
                    <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                      <span>{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBenefit(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveTier}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyTiers;
