
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PurchaseStatusCardsProps {
  totalPurchases: number;
  purchasesThisMonth: number;
  pendingPayments: number;
}

export const PurchaseStatusCards: React.FC<PurchaseStatusCardsProps> = ({
  totalPurchases,
  purchasesThisMonth,
  pendingPayments
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPurchases}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{purchasesThisMonth}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{pendingPayments}</div>
        </CardContent>
      </Card>
    </div>
  );
};
