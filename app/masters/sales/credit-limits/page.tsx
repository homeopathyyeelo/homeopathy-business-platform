import { ShoppingCart } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const creditlimitsConfig = {
  endpoint: 'credit-limits',
  title: 'Credit Limits',
  description: 'Manage credit limits for your ERP system',
  icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter credit limits name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter credit limits code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function CreditLimitsPage() {
  return <GenericMasterPage config={creditlimitsConfig} />
}