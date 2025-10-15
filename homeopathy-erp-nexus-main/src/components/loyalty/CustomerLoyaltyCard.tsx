
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CustomerLoyalty, LoyaltyTransaction } from '@/types/loyalty';

interface CustomerLoyaltyCardProps {
  loyalty?: CustomerLoyalty;
  transactions?: LoyaltyTransaction[];
  onRedeemPoints?: () => void;
}

const CustomerLoyaltyCard = ({ 
  loyalty, 
  transactions, 
  onRedeemPoints 
}: CustomerLoyaltyCardProps) => {
  if (!loyalty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program</CardTitle>
          <CardDescription>Customer is not enrolled in the loyalty program</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>This customer has not been enrolled in the loyalty program yet.</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Enroll Customer</Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate next tier progress
  const currentTier = loyalty.tier || 'bronze';
  const tierThresholds: Record<string, number> = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000
  };

  const nextTier = currentTier === 'bronze' ? 'silver' 
    : currentTier === 'silver' ? 'gold'
    : currentTier === 'gold' ? 'platinum'
    : null;

  const currentThreshold = tierThresholds[currentTier] || 0;
  const nextThreshold = nextTier ? tierThresholds[nextTier] : tierThresholds.platinum;
  
  const progressPercentage = nextTier 
    ? Math.min(100, ((loyalty.lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  const pointsToNextTier = nextTier ? nextThreshold - loyalty.lifetimePoints : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loyalty Status</CardTitle>
            <CardDescription>Customer's loyalty program details</CardDescription>
          </div>
          <div className="bg-primary/10 px-3 py-1 rounded-full text-primary font-semibold capitalize">
            {currentTier} Member
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-muted-foreground text-sm">Available Points</p>
            <p className="text-3xl font-bold">{loyalty.availablePoints}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-muted-foreground text-sm">Lifetime Points</p>
            <p className="text-3xl font-bold">{loyalty.lifetimePoints}</p>
          </div>
        </div>
        
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Progress to {nextTier}</span>
              <span>{pointsToNextTier} points needed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        {transactions && transactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Activity</h4>
            <ul className="space-y-1 text-sm">
              {transactions.slice(0, 3).map(transaction => (
                <li key={transaction.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>{transaction.description}</span>
                  <span className={transaction.transactionType === 'earned' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.points} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {/* View full history */}}
        >
          View History
        </Button>
        <Button
          disabled={!loyalty.availablePoints || loyalty.availablePoints < 100}
          onClick={onRedeemPoints}
        >
          Redeem Points
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerLoyaltyCard;
