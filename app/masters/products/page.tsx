import { Building2 } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const productConfig = {
  endpoint: 'products',
  title: 'Products',
  description: 'Manage your homeopathy product catalog including medicines, dilutions, and remedies',
  icon: <Building2 className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'code', label: 'Product Code', sortable: true },
    { key: 'category_name', label: 'Category', render: (value: any) => value || 'Uncategorized' },
    { key: 'brand_name', label: 'Brand', render: (value: any) => value || 'No Brand' },
    { key: 'potency_name', label: 'Potency', render: (value: any) => value || 'N/A' },
    { key: 'packing_size_name', label: 'Pack Size', render: (value: any) => value || 'N/A' },
    { key: 'is_prescription_required', label: 'Rx Required', render: (value: boolean) => value ? 'Yes' : 'No' },
    { key: 'is_active', label: 'Status', render: (value: boolean) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code', 'category_name', 'brand_name'],
  formFields: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'code', label: 'Product Code', type: 'text', required: true, placeholder: 'Enter product code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Product description' },
    { key: 'category_id', label: 'Category', type: 'select' as const, required: true, placeholder: 'Select category',
      options: [] // Will be populated from categories API
    },
    { key: 'brand_id', label: 'Brand', type: 'select' as const, placeholder: 'Select brand',
      options: [] // Will be populated from brands API
    },
    { key: 'potency_id', label: 'Potency', type: 'select' as const, placeholder: 'Select potency',
      options: [] // Will be populated from potencies API
    },
    { key: 'packing_size_id', label: 'Pack Size', type: 'select' as const, required: true, placeholder: 'Select pack size',
      options: [] // Will be populated from packing sizes API
    },
    { key: 'hsn_code_id', label: 'HSN Code', type: 'select' as const, placeholder: 'Select HSN code',
      options: [] // Will be populated from HSN codes API
    },
    { key: 'barcode', label: 'Barcode', type: 'text' as const, placeholder: 'Enter barcode' },
    { key: 'reorder_level', label: 'Reorder Level', type: 'number' as const, placeholder: '0' },
    { key: 'min_stock_level', label: 'Min Stock Level', type: 'number' as const, placeholder: '0' },
    { key: 'max_stock_level', label: 'Max Stock Level', type: 'number' as const, placeholder: '0' },
    { key: 'is_prescription_required', label: 'Prescription Required', type: 'boolean' as const },
    { key: 'is_active', label: 'Active', type: 'boolean' as const },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function ProductsPage() {
  return <GenericMasterPage config={productConfig} />
}
