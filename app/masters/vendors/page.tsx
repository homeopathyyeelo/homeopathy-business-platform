import { Truck } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const vendorConfig = {
  endpoint: 'vendors',
  title: 'Vendors',
  description: 'Manage your suppliers and distributors for procurement',
  icon: <Truck className="w-8 h-8 text-purple-600" />,
  tableColumns: [
    { key: 'name', label: 'Vendor Name', sortable: true },
    { key: 'code', label: 'Vendor Code', sortable: true },
    { key: 'contact_person', label: 'Contact Person', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', render: (value) => value || 'N/A' },
    { key: 'city', label: 'City', sortable: true },
    { key: 'vendor_type_name', label: 'Type', render: (value: any) => value || 'Not Specified' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code', 'contact_person', 'phone', 'city'],
  formFields: [
    { key: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'Enter vendor name' },
    { key: 'code', label: 'Vendor Code', type: 'text', required: true, placeholder: 'Enter vendor code' },
    { key: 'contact_person', label: 'Contact Person', type: 'text', required: true, placeholder: 'Enter contact person' },
    { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Enter vendor address' },
    { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'Enter city' },
    { key: 'state', label: 'State', type: 'text', required: true, placeholder: 'Enter state' },
    { key: 'pincode', label: 'Pincode', type: 'text', required: true, placeholder: 'Enter pincode' },
    { key: 'gst_number', label: 'GST Number', type: 'text', placeholder: 'Enter GST number' },
    { key: 'pan_number', label: 'PAN Number', type: 'text', placeholder: 'Enter PAN number' },
    { key: 'vendor_type_id', label: 'Vendor Type', type: 'select' as const, placeholder: 'Select vendor type' },
    { key: 'payment_terms_id', label: 'Payment Terms', type: 'select' as const, placeholder: 'Select payment terms' },
    { key: 'credit_limit', label: 'Credit Limit', type: 'number' as const, placeholder: '0' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function VendorsPage() {
  return <GenericMasterPage config={vendorConfig} />
}
