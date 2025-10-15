import { Truck } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const grntemplatesConfig = {
  endpoint: 'grn-templates',
  title: 'GRN Templates',
  description: 'Manage grn templates for your ERP system',
  icon: <Truck className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter grn templates name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter grn templates code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function GRNTemplatesPage() {
  return <GenericMasterPage config={grntemplatesConfig} />
}