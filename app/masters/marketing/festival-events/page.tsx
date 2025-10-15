import { TrendingUp } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const festivaleventsConfig = {
  endpoint: 'festival-events',
  title: 'Festival Events',
  description: 'Manage festival events for your ERP system',
  icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter festival events name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter festival events code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function FestivalEventsPage() {
  return <GenericMasterPage config={festivaleventsConfig} />
}