import { Package } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const productvariantsConfig = {
  endpoint: 'product-variants',
  title: 'Product Variants',
  description: 'Manage product variants for your ERP system',
  icon: <Package className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter product variants name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter product variants code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function ProductVariantsPage() {
  return <GenericMasterPage config={productvariantsConfig} />
}