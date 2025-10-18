import { Truck } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const purchaseReturnReasonsConfig = {
  endpoint: 'purchase-return-reasons',
  title: 'Purchase Return Reasons',
  description: 'Manage purchase return reasons for your ERP system',
  icon: <Truck className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter purchase return reasons name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter purchase return reasons code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function PurchaseReturnReasonsPage() {
  return <GenericMasterPage config={purchaseReturnReasonsConfig} />
}