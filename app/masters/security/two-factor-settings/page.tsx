import { Shield } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const twoFactorSettingsConfig = {
  endpoint: 'two-factor-settings',
  title: '2FA Settings',
  description: 'Manage 2fa settings for your ERP system',
  icon: <Shield className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter 2fa settings name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter 2fa settings code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function TwoFactorSettingsPage() {
  return <GenericMasterPage config={twoFactorSettingsConfig} />
}