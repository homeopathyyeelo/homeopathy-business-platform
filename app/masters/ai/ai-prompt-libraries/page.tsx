import { Bot } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const aipromptLIBRARIESConfig = {
  endpoint: 'ai-prompt-libraries',
  title: 'AI Prompt Libraries',
  description: 'Manage ai prompt libraries for your ERP system',
  icon: <Bot className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter ai prompt libraries name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter ai prompt libraries code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function AIPromptLibrariesPage() {
  return <GenericMasterPage config={aiprompt-librariesConfig} />
}