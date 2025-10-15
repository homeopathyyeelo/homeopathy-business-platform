
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { DiscountCalculation, PriceCalculation } from '@/types/discount';

interface UseDiscountCalculationProps {
  supplierId: string;
  items: any[];
}

export const useDiscountCalculation = ({ supplierId, items }: UseDiscountCalculationProps) => {
  const { getAll } = useDatabase();
  const [calculations, setCalculations] = useState<Record<string, DiscountCalculation>>({});
  const [priceCalculations, setPriceCalculations] = useState<Record<string, PriceCalculation>>({});

  // Fetch supplier discounts
  const { data: supplierDiscounts = [] } = useQuery({
    queryKey: ['supplier-discounts', supplierId],
    queryFn: () => getAll('supplier_discounts').then(data => 
      data.filter((d: any) => d.supplier_id === supplierId && d.is_active)
    ),
    enabled: !!supplierId
  });

  // Calculate discounts for each item
  useEffect(() => {
    if (!supplierDiscounts.length || !items.length) return;

    const newCalculations: Record<string, DiscountCalculation> = {};
    const newPriceCalculations: Record<string, PriceCalculation> = {};

    items.forEach((item, index) => {
      if (!item.productId || !item.quantity || !item.unitPrice) return;

      const itemKey = `${index}-${item.productId}`;
      const originalAmount = item.quantity * item.unitPrice;
      
      let totalDiscount = 0;
      const breakdown: any[] = [];

      // Calculate brand-wise discount
      const brandDiscount = supplierDiscounts.find((d: any) => 
        d.discount_type === 'brand' && d.brand_id === item.brandId
      );
      
      let brandDiscountAmount = 0;
      if (brandDiscount) {
        brandDiscountAmount = (originalAmount * brandDiscount.discount_percentage) / 100;
        if (brandDiscount.discount_amount) {
          brandDiscountAmount += brandDiscount.discount_amount;
        }
        totalDiscount += brandDiscountAmount;
        breakdown.push({
          type: 'Brand Discount',
          percentage: brandDiscount.discount_percentage,
          amount: brandDiscountAmount,
          reason: `Brand-wise discount for ${item.brandName || 'selected brand'}`
        });
      }

      // Calculate category-wise discount
      const categoryDiscount = supplierDiscounts.find((d: any) => 
        d.discount_type === 'category' && d.category_id === item.categoryId
      );
      
      let categoryDiscountAmount = 0;
      if (categoryDiscount) {
        categoryDiscountAmount = (originalAmount * categoryDiscount.discount_percentage) / 100;
        if (categoryDiscount.discount_amount) {
          categoryDiscountAmount += categoryDiscount.discount_amount;
        }
        totalDiscount += categoryDiscountAmount;
        breakdown.push({
          type: 'Category Discount',
          percentage: categoryDiscount.discount_percentage,
          amount: categoryDiscountAmount,
          reason: `Category-wise discount for ${item.categoryName || 'selected category'}`
        });
      }

      // Calculate volume-based discount
      const volumeDiscounts = supplierDiscounts.filter((d: any) => 
        d.discount_type === 'volume' &&
        (d.min_quantity ? item.quantity >= d.min_quantity : true) &&
        (d.min_amount ? originalAmount >= d.min_amount : true)
      );
      
      let volumeDiscountAmount = 0;
      volumeDiscounts.forEach((discount: any) => {
        const discountAmount = (originalAmount * discount.discount_percentage) / 100;
        if (discount.discount_amount) {
          volumeDiscountAmount += discount.discount_amount;
        }
        volumeDiscountAmount += discountAmount;
        breakdown.push({
          type: 'Volume Discount',
          percentage: discount.discount_percentage,
          amount: discountAmount + (discount.discount_amount || 0),
          reason: `Volume discount for qty: ${item.quantity}, amount: ₹${originalAmount}`
        });
      });
      totalDiscount += volumeDiscountAmount;

      // Calculate payment terms discount (this would be applied at purchase level)
      const paymentDiscount = supplierDiscounts.find((d: any) => 
        d.discount_type === 'payment_terms'
      );
      
      let paymentDiscountAmount = 0;
      if (paymentDiscount) {
        paymentDiscountAmount = (originalAmount * paymentDiscount.discount_percentage) / 100;
        if (paymentDiscount.discount_amount) {
          paymentDiscountAmount += paymentDiscount.discount_amount;
        }
        totalDiscount += paymentDiscountAmount;
        breakdown.push({
          type: 'Payment Terms Discount',
          percentage: paymentDiscount.discount_percentage,
          amount: paymentDiscountAmount,
          reason: `Early payment discount (${paymentDiscount.payment_terms_days} days)`
        });
      }

      const discountedAmount = originalAmount - totalDiscount;

      newCalculations[itemKey] = {
        brandDiscount: brandDiscountAmount,
        categoryDiscount: categoryDiscountAmount,
        volumeDiscount: volumeDiscountAmount,
        paymentDiscount: paymentDiscountAmount,
        totalDiscount,
        originalAmount,
        discountedAmount,
        breakdown
      };

      // Calculate suggested pricing
      const discountedRate = item.unitPrice - (totalDiscount / item.quantity);
      const marginPercentage = 25; // Default 25% margin, can be configurable
      const suggestedRetailPrice = discountedRate * (1 + marginPercentage / 100);
      const suggestedWholesalePrice = discountedRate * (1 + (marginPercentage - 5) / 100); // 5% less margin for wholesale
      const mrp = suggestedRetailPrice * 1.1; // 10% above retail as MRP

      newPriceCalculations[itemKey] = {
        originalRate: item.unitPrice,
        discountedRate,
        marginPercentage,
        suggestedRetailPrice,
        suggestedWholesalePrice,
        mrp
      };
    });

    setCalculations(newCalculations);
    setPriceCalculations(newPriceCalculations);
  }, [supplierDiscounts, items]);

  const getItemDiscount = (index: number, productId: string): DiscountCalculation | null => {
    const itemKey = `${index}-${productId}`;
    return calculations[itemKey] || null;
  };

  const getItemPricing = (index: number, productId: string): PriceCalculation | null => {
    const itemKey = `${index}-${productId}`;
    return priceCalculations[itemKey] || null;
  };

  const getTotalDiscountAmount = (): number => {
    return Object.values(calculations).reduce((sum, calc) => sum + calc.totalDiscount, 0);
  };

  const getTotalOriginalAmount = (): number => {
    return Object.values(calculations).reduce((sum, calc) => sum + calc.originalAmount, 0);
  };

  const getTotalDiscountedAmount = (): number => {
    return Object.values(calculations).reduce((sum, calc) => sum + calc.discountedAmount, 0);
  };

  return {
    calculations,
    priceCalculations,
    getItemDiscount,
    getItemPricing,
    getTotalDiscountAmount,
    getTotalOriginalAmount,
    getTotalDiscountedAmount,
    supplierDiscounts
  };
};
