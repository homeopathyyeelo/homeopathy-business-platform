import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Product } from '@/types/product';
import { Inventory } from '@/types/inventory';

interface ValidationError {
  field: string;
  message: string;
}

interface InventoryValidationState {
  errors: ValidationError[];
  isValid: boolean;
  loading: boolean;
}

export function useInventoryValidation() {
  const { toast } = useToast();
  const [validationState, setValidationState] = useState<InventoryValidationState>({
    errors: [],
    isValid: true,
    loading: false
  });

  const validateProduct = useCallback((product: Partial<Product>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!product.name || product.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Product name must be at least 2 characters long'
      });
    }

    // SKU validation
    if (!product.sku || product.sku.trim().length < 3) {
      errors.push({
        field: 'sku',
        message: 'SKU must be at least 3 characters long'
      });
    }

    // Price validation
    if (!product.purchasePrice || product.purchasePrice <= 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price must be greater than 0'
      });
    }

    if (!product.defaultSellingPriceRetail || product.defaultSellingPriceRetail <= 0) {
      errors.push({
        field: 'defaultSellingPriceRetail',
        message: 'Retail price must be greater than 0'
      });
    }

    if (product.purchasePrice && product.defaultSellingPriceRetail && product.purchasePrice >= product.defaultSellingPriceRetail) {
      errors.push({
        field: 'defaultSellingPriceRetail',
        message: 'Retail price must be greater than purchase price'
      });
    }

    // Homeopathy specific validations - all products are homeopathic
    if (!product.potency) {
      errors.push({
        field: 'potency',
        message: 'Potency is required for homeopathic medicines'
      });
    }

    if (!product.form) {
      errors.push({
        field: 'form',
        message: 'Medicine form is required for homeopathic medicines'
      });
    }

    return errors;
  }, []);

  const validateInventory = useCallback((inventory: Partial<Inventory>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Product ID validation
    if (!inventory.productId) {
      errors.push({
        field: 'productId',
        message: 'Product is required'
      });
    }

    // Batch number validation
    if (!inventory.batchNumber || inventory.batchNumber.trim().length < 2) {
      errors.push({
        field: 'batchNumber',
        message: 'Batch number must be at least 2 characters long'
      });
    }

    // Quantity validation
    if (inventory.quantityInStock === undefined || inventory.quantityInStock < 0) {
      errors.push({
        field: 'quantityInStock',
        message: 'Quantity must be greater than or equal to 0'
      });
    }

    // Expiry date validation
    if (inventory.expiryDate && new Date(inventory.expiryDate) <= new Date()) {
      errors.push({
        field: 'expiryDate',
        message: 'Expiry date must be in the future'
      });
    }

    // Price validation
    if (inventory.purchasePrice && inventory.purchasePrice <= 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price must be greater than 0'
      });
    }

    if (inventory.sellingPriceRetail && inventory.sellingPriceRetail <= 0) {
      errors.push({
        field: 'sellingPriceRetail',
        message: 'Retail price must be greater than 0'
      });
    }

    return errors;
  }, []);

  const validateStockMovement = useCallback((movement: {
    productId?: string;
    quantity?: number;
    type?: string;
    batchNumber?: string;
  }): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!movement.productId) {
      errors.push({
        field: 'productId',
        message: 'Product is required'
      });
    }

    if (!movement.quantity || movement.quantity <= 0) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be greater than 0'
      });
    }

    if (!movement.type) {
      errors.push({
        field: 'type',
        message: 'Movement type is required'
      });
    }

    if (!movement.batchNumber) {
      errors.push({
        field: 'batchNumber',
        message: 'Batch number is required'
      });
    }

    return errors;
  }, []);

  const validateBatch = useCallback((batch: {
    batchNumber?: string;
    expiryDate?: string;
    quantity?: number;
  }): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!batch.batchNumber || batch.batchNumber.trim().length < 2) {
      errors.push({
        field: 'batchNumber',
        message: 'Batch number must be at least 2 characters long'
      });
    }

    if (!batch.expiryDate) {
      errors.push({
        field: 'expiryDate',
        message: 'Expiry date is required'
      });
    } else if (new Date(batch.expiryDate) <= new Date()) {
      errors.push({
        field: 'expiryDate',
        message: 'Expiry date must be in the future'
      });
    }

    if (!batch.quantity || batch.quantity < 0) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be greater than or equal to 0'
      });
    }

    return errors;
  }, []);

  const runValidation = useCallback(async (
    type: 'product' | 'inventory' | 'stockMovement' | 'batch',
    data: any
  ): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, loading: true }));

    try {
      let errors: ValidationError[] = [];

      switch (type) {
        case 'product':
          errors = validateProduct(data);
          break;
        case 'inventory':
          errors = validateInventory(data);
          break;
        case 'stockMovement':
          errors = validateStockMovement(data);
          break;
        case 'batch':
          errors = validateBatch(data);
          break;
        default:
          errors = [{ field: 'general', message: 'Unknown validation type' }];
      }

      const isValid = errors.length === 0;

      setValidationState({
        errors,
        isValid,
        loading: false
      });

      if (!isValid) {
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} validation error(s)`,
          variant: "destructive"
        });
      }

      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState({
        errors: [{ field: 'general', message: 'Validation failed' }],
        isValid: false,
        loading: false
      });

      toast({
        title: "Validation Error",
        description: "An error occurred during validation",
        variant: "destructive"
      });

      return false;
    }
  }, [validateProduct, validateInventory, validateStockMovement, validateBatch, toast]);

  const clearValidation = useCallback(() => {
    setValidationState({
      errors: [],
      isValid: true,
      loading: false
    });
  }, []);

  const getFieldError = useCallback((field: string): string | null => {
    const error = validationState.errors.find(e => e.field === field);
    return error ? error.message : null;
  }, [validationState.errors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return validationState.errors.some(e => e.field === field);
  }, [validationState.errors]);

  return {
    validationState,
    validateProduct,
    validateInventory,
    validateStockMovement,
    validateBatch,
    runValidation,
    clearValidation,
    getFieldError,
    hasFieldError
  };
}