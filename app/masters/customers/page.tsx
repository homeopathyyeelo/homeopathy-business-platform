import { Users } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const customerConfig = {
  endpoint: 'customers',
  title: 'Customers',
  description: 'Manage your customer database including retail, B2B, and VIP customers',
  icon: <Users className="w-8 h-8 text-green-600" />,
  tableColumns: [
    { key: 'name', label: 'Customer Name', sortable: true },
    { key: 'code', label: 'Customer Code', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', render: (value) => value || 'N/A' },
    { key: 'city', label: 'City', sortable: true },
    { key: 'customer_group_name', label: 'Group', render: (value: any) => value || 'No Group' },
    { key: 'credit_limit', label: 'Credit Limit', render: (value: any) => value ? `${value}` : 'No Limit' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code', 'phone', 'email', 'city'],
  formFields: [
    { key: 'name', label: 'Customer Name', type: 'text', required: true, placeholder: 'Enter customer name' },
    { key: 'code', label: 'Customer Code', type: 'text', required: true, placeholder: 'Enter customer code' },
    { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Enter customer address' },
    { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'Enter city' },
    { key: 'state', label: 'State', type: 'text', required: true, placeholder: 'Enter state' },
    { key: 'pincode', label: 'Pincode', type: 'text', required: true, placeholder: 'Enter pincode' },
    { key: 'gst_number', label: 'GST Number', type: 'text', placeholder: 'Enter GST number' },
    { key: 'customer_group_id', label: 'Customer Group', type: 'select' as const, placeholder: 'Select customer group' },
    { key: 'credit_limit', label: 'Credit Limit', type: 'number' as const, placeholder: '0' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function CustomersPage() {
  return <GenericMasterPage config={customerConfig} />
}
