
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerLoyalty, LoyaltyTransaction } from '@/types/loyalty';

interface LoyaltyDashboardProps {
  customerId?: string;
}

const LoyaltyDashboard = ({ customerId }: LoyaltyDashboardProps) => {
  const { toast } = useToast();
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyalty | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLoyaltyData = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the database
      const mockLoyaltyData: CustomerLoyalty = {
        id: 'loyalty-1',
        customerId: customerId,
        totalPoints: 1250,
        availablePoints: 850,
        lifetimePoints: 3500,
        tier: 'silver',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockTransactions: LoyaltyTransaction[] = [
        {
          id: 'txn-1',
          customerId: customerId,
          transactionType: 'earned',
          points: 150,
          description: 'Purchase - Invoice #INV-001',
          balanceAfter: 850,
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: 'txn-2',
          customerId: customerId,
          transactionType: 'redeemed',
          points: 100,
          description: 'Redeemed for discount',
          balanceAfter: 700,
          createdAt: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];
      
      setLoyaltyData(mockLoyaltyData);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-500';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getTierProgress = (tier: string, lifetimePoints: number) => {
    const thresholds = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 };
    const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null;
    
    if (!nextTier) return 100;
    
    const current = thresholds[tier as keyof typeof thresholds];
    const next = thresholds[nextTier as keyof typeof thresholds];
    
    return Math.min(100, ((lifetimePoints - current) / (next - current)) * 100);
  };

  if (!loyaltyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No loyalty data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Loyalty Status
            <Badge className={getTierColor(loyaltyData.tier || 'bronze')}>
              {loyaltyData.tier?.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{loyaltyData.availablePoints}</p>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{loyaltyData.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{loyaltyData.lifetimePoints}</p>
              <p className="text-sm text-muted-foreground">Lifetime Points</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to next tier</span>
              <span>{Math.round(getTierProgress(loyaltyData.tier || 'bronze', loyaltyData.lifetimePoints))}%</span>
            </div>
            <Progress value={getTierProgress(loyaltyData.tier || 'bronze', loyaltyData.lifetimePoints)} />
          </div>
          
          <Button className="w-full" disabled={loyaltyData.availablePoints < 100}>
            Redeem Points ({loyaltyData.availablePoints} available)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.transactionType === 'earned' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.points} pts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Balance: {transaction.balanceAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard;
