
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DiscountCalculation, PriceCalculation } from '@/types/discount';
import { IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';

interface PurchaseItemDiscountInfoProps {
  discount: DiscountCalculation;
  pricing: PriceCalculation;
  index: number;
}

const PurchaseItemDiscountInfo = ({ discount, pricing, index }: PurchaseItemDiscountInfoProps) => {
  if (!discount || discount.totalDiscount === 0) return null;

  return (
    <Card className="mt-2 bg-green-50 border-green-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Total Discount: ₹{discount.totalDiscount.toFixed(2)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {((discount.totalDiscount / discount.originalAmount) * 100).toFixed(1)}% off
          </Badge>
        </div>
        
        {/* Discount Breakdown */}
        <div className="space-y-1">
          {discount.breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-green-700">
              <span>{item.type}:</span>
              <span>₹{item.amount.toFixed(2)} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
        
        {/* Pricing Information */}
        {pricing && (
          <div className="mt-3 pt-2 border-t border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Suggested Pricing</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Effective Rate:</span>
                <span className="font-medium">₹{pricing.discountedRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retail Price:</span>
                <span className="font-medium">₹{pricing.suggestedRetailPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wholesale Price:</span>
                <span className="font-medium">₹{pricing.suggestedWholesalePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MRP:</span>
                <span className="font-medium">₹{pricing.mrp.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-1 text-xs text-blue-600">
              Margin: {pricing.marginPercentage}% | 
              Savings: ₹{(pricing.originalRate - pricing.discountedRate).toFixed(2)}/unit
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseItemDiscountInfo;
