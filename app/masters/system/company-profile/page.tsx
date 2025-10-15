import { Building2 } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const companyprofileConfig = {
  endpoint: 'company-profile',
  title: 'Company Profile',
  description: 'Manage company profile for your ERP system',
  icon: <Building2 className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter company profile name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter company profile code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function CompanyProfilePage() {
  return <GenericMasterPage config={companyprofileConfig} />
}