
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useDiscountCalculation } from "./useDiscountCalculation";

export const usePurchaseForm = (onSave: () => void, initialData?: any) => {
  const { getAll, create } = useDatabase();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default form data
  const [formData, setFormData] = useState({
    supplierInfo: initialData?.supplierId || "",
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate || "",
    status: initialData?.status || "draft",
    paymentStatus: initialData?.paymentStatus || "pending",
    notes: initialData?.notes || "",
    items: initialData?.items || [
      { productId: "", brandId: "", categoryId: "", quantity: 1, unitPrice: 0 }
    ]
  });
  
  // Fetch data from API
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getAll("suppliers")
  });
  
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getAll("products")
  });
  
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getAll("brands")
  });
  
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAll("categories")
  });

  // Calculate discounts using the hook
  const {
    getTotalDiscountAmount,
    getTotalOriginalAmount,
    getTotalDiscountedAmount
  } = useDiscountCalculation({
    supplierId: formData.supplierInfo,
    items: formData.items.map((item, index) => ({
      ...item,
      brandId: products.find(p => p.id === item.productId)?.brand_id,
      categoryId: products.find(p => p.id === item.productId)?.category_id
    }))
  });

  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "quantity" || field === "unitPrice" ? Number(value) : value
    };
    
    // If product changed, update related fields
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unitPrice = product.purchase_price || 0;
        updatedItems[index].brandId = product.brand_id || "";
        updatedItems[index].categoryId = product.category_id || "";
      }
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productId: "", brandId: "", categoryId: "", quantity: 1, unitPrice: 0 }
      ]
    });
  };
  
  const removeItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems.length ? updatedItems : [
        { productId: "", brandId: "", categoryId: "", quantity: 1, unitPrice: 0 }
      ]
    });
  };
  
  // Calculate totals with discounts
  const calculateSubtotal = () => {
    const discountedTotal = getTotalDiscountedAmount();
    return discountedTotal > 0 ? discountedTotal : formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };
  
  const subtotal = calculateSubtotal();
  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const totalDiscountApplied = getTotalDiscountAmount();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierInfo) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.items[0].productId) {
      toast({
        title: "Missing Information",
        description: "Please add at least one product",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const purchaseData = {
        purchase_number: `PO-${Date.now()}`,
        supplier_id: formData.supplierInfo,
        purchase_date: formData.purchaseDate,
        due_date: formData.dueDate || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total: total,
        total_discount_applied: totalDiscountApplied,
        effective_total: total,
        status: formData.status,
        payment_status: formData.paymentStatus,
        notes: formData.notes,
        created_at: new Date()
      };
      
      // Create the purchase
      const purchase = await create("purchases", purchaseData);
      
      // Create purchase items with discount information
      const purchaseItems = formData.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId);
        return {
          purchase_id: purchase.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          original_rate: item.unitPrice,
          total: item.quantity * item.unitPrice,
          applicable_discounts: JSON.stringify({
            brandId: product?.brand_id,
            categoryId: product?.category_id
          }),
          created_at: new Date()
        };
      });
      
      for (const item of purchaseItems) {
        await create("purchase_items", item);
      }
      
      toast({
        title: "Purchase Created",
        description: `Purchase created successfully with ₹${totalDiscountApplied.toFixed(2)} total discount applied`
      });
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create purchase: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    suppliers,
    products,
    brands,
    categories,
    isSubmitting,
    subtotal,
    taxAmount,
    total,
    totalDiscountApplied,
    handleChange,
    handleSelectChange,
    handleItemChange,
    addItem,
    removeItem,
    handleSubmit
  };
};
