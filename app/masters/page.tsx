'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Building2, Users, Package, Truck, Calculator, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import master hooks
import {
  useCompanyProfile,
  useBranches,
  useDepartments,
  useRoles,
  useUsers,
  useCurrencies,
  useTaxSlabs,
  useUOMs,
  usePaymentMethods,
  useCategories,
  useBrands,
  useVendors,
  useCustomers,
  useEmployees,
  useLedgerAccounts,
  useSalesTypes,
  useInvoiceSeries,
  usePriceLevels,
  useSalespeople,
  usePaymentTerms,
  useVendorTypes,
  useCustomerGroups,
  useBanks,
  useCostCenters,
  useExpenseCategories,
  useMasterMutations,
  CompanyProfile,
  Branch,
  Department,
  Role,
  User,
  Currency,
  TaxSlab,
  UOM,
  PaymentMethod,
  Category,
  Brand,
  Vendor,
  Customer,
  Employee,
  LedgerAccount,
  SalesType,
  InvoiceSeries,
  PriceLevel,
  Salesperson,
  PaymentTerm,
  VendorType,
  CustomerGroup,
  Bank,
  CostCenter,
  ExpenseCategory,
} from "@/lib/hooks/masters"

export default function MastersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState("system")
  const { delete: deleteMaster } = useMasterMutations()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDelete = async (masterType: string, id: string) => {
    if (confirm(`Are you sure you want to delete this ${masterType}?`)) {
      try {
        await deleteMaster.mutateAsync({ endpoint: masterType, id })
        toast({
          title: "Success",
          description: `${masterType} deleted successfully`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete ${masterType}`,
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Master Data Management</h2>
          <p className="text-gray-600">Manage all master data for your ERP system</p>
        </div>
      </div>

      {/* Master Data Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        {/* System Masters */}
        <TabsContent value="system" className="space-y-6">
          {/* Company Profile */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Profile
                </CardTitle>
                <Button onClick={() => router.push('/masters/company')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CompanyProfileCard />
            </CardContent>
          </Card>

          {/* Branches */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Branches / Stores</CardTitle>
                <Button onClick={() => router.push('/masters/branches')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BranchesTable />
            </CardContent>
          </Card>

          {/* Users & Roles */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Users & Staff
                  </CardTitle>
                  <Button onClick={() => router.push('/masters/system/users')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <UsersTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Roles & Permissions</CardTitle>
                  <Button onClick={() => router.push('/masters/system/roles')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RolesTable />
              </CardContent>
            </Card>
          </div>

          {/* Departments & Other System Masters */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Departments</CardTitle>
                  <Button onClick={() => router.push('/masters/system/departments')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DepartmentsTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Currencies</CardTitle>
                  <Button onClick={() => router.push('/masters/system/currencies')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CurrenciesTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Masters */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Categories
                  </CardTitle>
                  <Button onClick={() => router.push('/masters/categories')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CategoriesTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brands / Manufacturers</CardTitle>
              </CardHeader>
              <CardContent>
                <BrandsTable />
              </CardContent>
            </Card>
          </div>

          {/* UOM and Payment Methods */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Units of Measure (UOM)</CardTitle>
              </CardHeader>
              <CardContent>
                <UOMTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodsTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Masters */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Types</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesTypesTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Series</CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceSeriesTable />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceLevelsTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salespeople / Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <SalespeopleTable />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTermsTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Masters */}
        <TabsContent value="purchases" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorsTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Types</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorTypesTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Masters */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomersTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerGroupsTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Masters */}
        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Chart of Accounts (Ledger)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LedgerAccountsTable />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Banks</CardTitle>
              </CardHeader>
              <CardContent>
                <BanksTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Centers</CardTitle>
              </CardHeader>
              <CardContent>
                <CostCentersTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseCategoriesTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

function CompanyProfileCard() {
  const { data: company } = useCompanyProfile()

  if (!company) {
    return <div className="text-center py-4">Loading company profile...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">{company.name}</h3>
          <p className="text-sm text-gray-600">{company.legal_name}</p>
          <p className="text-sm">{company.address}, {company.city}, {company.state} - {company.pincode}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">Phone: {company.phone}</p>
          <p className="text-sm">Email: {company.email}</p>
          <p className="text-sm">GST: {company.gst_number}</p>
          <p className="text-sm">PAN: {company.pan_number}</p>
        </div>
      </div>
    </div>
  )
}

function BranchesTable() {
  const { data: branches = [] } = useBranches()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">City</th>
            <th className="text-left p-4">Manager</th>
            <th className="text-left p-4">Status</th>
            <th className="text-right p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch.id} className="border-b">
              <td className="p-4 font-medium">{branch.name}</td>
              <td className="p-4">{branch.code}</td>
              <td className="p-4">{branch.city}</td>
              <td className="p-4">{branch.manager_name || 'Not assigned'}</td>
              <td className="p-4">
                <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="p-4 text-right">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsersTable() {
  const { data: users = [] } = useUsers()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Email</th>
            <th className="text-left p-4">Role</th>
            <th className="text-left p-4">Department</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 5).map((user) => (
            <tr key={user.id} className="border-b">
              <td className="p-4 font-medium">{user.first_name} {user.last_name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">{user.role_name || 'No role'}</td>
              <td className="p-4">{user.department_name || 'No department'}</td>
              <td className="p-4">
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RolesTable() {
  const { data: roles = [] } = useRoles()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Permissions</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {roles.slice(0, 5).map((role) => (
            <tr key={role.id} className="border-b">
              <td className="p-4 font-medium">{role.name}</td>
              <td className="p-4">{role.description || '-'}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 2).map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {perm.module}
                    </Badge>
                  ))}
                  {role.permissions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 2}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-4">
                <Badge variant={role.is_active ? 'default' : 'secondary'}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoriesTable() {
  const { data: categories = [] } = useCategories()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Parent</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.slice(0, 5).map((category) => (
            <tr key={category.id} className="border-b">
              <td className="p-4 font-medium">{category.name}</td>
              <td className="p-4">{category.code}</td>
              <td className="p-4">{category.parent_name || 'Root'}</td>
              <td className="p-4">
                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BrandsTable() {
  const { data: brands = [] } = useBrands()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Country</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {brands.slice(0, 5).map((brand) => (
            <tr key={brand.id} className="border-b">
              <td className="p-4 font-medium">{brand.name}</td>
              <td className="p-4">{brand.code}</td>
              <td className="p-4">{brand.country || '-'}</td>
              <td className="p-4">
                <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                  {brand.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UOMTable() {
  const { data: uoms = [] } = useUOMs()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Category</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {uoms.slice(0, 5).map((uom) => (
            <tr key={uom.id} className="border-b">
              <td className="p-4 font-medium">{uom.name}</td>
              <td className="p-4">{uom.code}</td>
              <td className="p-4">{uom.category}</td>
              <td className="p-4">
                <Badge variant={uom.is_active ? 'default' : 'secondary'}>
                  {uom.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentMethodsTable() {
  const { data: paymentMethods = [] } = usePaymentMethods()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Type</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {paymentMethods.slice(0, 5).map((method) => (
            <tr key={method.id} className="border-b">
              <td className="p-4 font-medium">{method.name}</td>
              <td className="p-4">{method.code}</td>
              <td className="p-4">{method.type}</td>
              <td className="p-4">
                <Badge variant={method.is_active ? 'default' : 'secondary'}>
                  {method.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VendorsTable() {
  const { data: vendors = [] } = useVendors()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Contact Person</th>
            <th className="text-left p-4">Phone</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {vendors.slice(0, 5).map((vendor) => (
            <tr key={vendor.id} className="border-b">
              <td className="p-4 font-medium">{vendor.name}</td>
              <td className="p-4">{vendor.code}</td>
              <td className="p-4">{vendor.contact_person}</td>
              <td className="p-4">{vendor.phone}</td>
              <td className="p-4">
                <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CustomersTable() {
  const { data: customers = [] } = useCustomers()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Phone</th>
            <th className="text-left p-4">Group</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.slice(0, 5).map((customer) => (
            <tr key={customer.id} className="border-b">
              <td className="p-4 font-medium">{customer.name}</td>
              <td className="p-4">{customer.code}</td>
              <td className="p-4">{customer.phone}</td>
              <td className="p-4">{customer.customer_group_name || 'No group'}</td>
              <td className="p-4">
                <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LedgerAccountsTable() {
  const { data: accounts = [] } = useLedgerAccounts()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Account Code</th>
            <th className="text-left p-4">Account Name</th>
            <th className="text-left p-4">Type</th>
            <th className="text-right p-4">Balance</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.slice(0, 5).map((account) => (
            <tr key={account.id} className="border-b">
              <td className="p-4 font-medium">{account.account_code}</td>
              <td className="p-4">{account.account_name}</td>
              <td className="p-4">
                <Badge variant="outline">{account.account_type}</Badge>
              </td>
              <td className="p-4 text-right">{formatCurrency(account.current_balance)}</td>
              <td className="p-4">
                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentTermsTable() {
  const { data: paymentTerms = [] } = usePaymentTerms()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Days</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Default</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {paymentTerms.slice(0, 5).map((term) => (
            <tr key={term.id} className="border-b">
              <td className="p-4 font-medium">{term.name}</td>
              <td className="p-4">{term.code}</td>
              <td className="p-4">{term.days} days</td>
              <td className="p-4">{term.description || '-'}</td>
              <td className="p-4">
                <Badge variant={term.is_default ? 'default' : 'secondary'}>
                  {term.is_default ? 'Default' : 'Custom'}
                </Badge>
              </td>
              <td className="p-4">
                <Badge variant={term.is_active ? 'default' : 'secondary'}>
                  {term.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VendorTypesTable() {
  const { data: vendorTypes = [] } = useVendorTypes()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Types</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {vendorTypes.slice(0, 5).map((type) => (
            <tr key={type.id} className="border-b">
              <td className="p-4 font-medium">{type.name}</td>
              <td className="p-4">{type.code}</td>
              <td className="p-4">{type.description || '-'}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {type.is_manufacturer && <Badge variant="outline" className="text-xs">Manufacturer</Badge>}
                  {type.is_distributor && <Badge variant="outline" className="text-xs">Distributor</Badge>}
                  {type.is_importer && <Badge variant="outline" className="text-xs">Importer</Badge>}
                </div>
              </td>
              <td className="p-4">
                <Badge variant={type.is_active ? 'default' : 'secondary'}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvoiceSeriesTable() {
  const { data: series = [] } = useInvoiceSeries()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Prefix</th>
            <th className="text-left p-4">Range</th>
            <th className="text-left p-4">Current</th>
            <th className="text-left p-4">Branch</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {series.slice(0, 5).map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-4 font-medium">{item.name}</td>
              <td className="p-4">{item.prefix}</td>
              <td className="p-4">{item.start_number} - {item.end_number}</td>
              <td className="p-4">{item.current_number}</td>
              <td className="p-4">{item.branch_id || 'All Branches'}</td>
              <td className="p-4">
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PriceLevelsTable() {
  const { data: priceLevels = [] } = usePriceLevels()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Discount</th>
            <th className="text-left p-4">Markup</th>
            <th className="text-left p-4">Default</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {priceLevels.slice(0, 5).map((level) => (
            <tr key={level.id} className="border-b">
              <td className="p-4 font-medium">{level.name}</td>
              <td className="p-4">{level.code}</td>
              <td className="p-4">{level.discount_percentage ? `${level.discount_percentage}%` : '-'}</td>
              <td className="p-4">{level.markup_percentage ? `${level.markup_percentage}%` : '-'}</td>
              <td className="p-4">
                <Badge variant={level.is_default ? 'default' : 'secondary'}>
                  {level.is_default ? 'Default' : 'Custom'}
                </Badge>
              </td>
              <td className="p-4">
                <Badge variant={level.is_active ? 'default' : 'secondary'}>
                  {level.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SalespeopleTable() {
  const { data: salespeople = [] } = useSalespeople()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Phone</th>
            <th className="text-left p-4">Email</th>
            <th className="text-left p-4">Commission</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {salespeople.slice(0, 5).map((person) => (
            <tr key={person.id} className="border-b">
              <td className="p-4 font-medium">{person.name}</td>
              <td className="p-4">{person.code}</td>
              <td className="p-4">{person.phone}</td>
              <td className="p-4">{person.email || '-'}</td>
              <td className="p-4">{person.commission_percentage ? `${person.commission_percentage}%` : '-'}</td>
              <td className="p-4">
                <Badge variant={person.is_active ? 'default' : 'secondary'}>
                  {person.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BanksTable() {
  const { data: banks = [] } = useBanks()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Account Number</th>
            <th className="text-left p-4">IFSC Code</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {banks.slice(0, 5).map((bank) => (
            <tr key={bank.id} className="border-b">
              <td className="p-4 font-medium">{bank.name}</td>
              <td className="p-4">{bank.code}</td>
              <td className="p-4">{bank.account_number}</td>
              <td className="p-4">{bank.ifsc_code}</td>
              <td className="p-4">
                <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                  {bank.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CostCentersTable() {
  const { data: costCenters = [] } = useCostCenters()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Branch</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {costCenters.slice(0, 5).map((center) => (
            <tr key={center.id} className="border-b">
              <td className="p-4 font-medium">{center.name}</td>
              <td className="p-4">{center.code}</td>
              <td className="p-4">{center.description || '-'}</td>
              <td className="p-4">{center.branch_name || 'All Branches'}</td>
              <td className="p-4">
                <Badge variant={center.is_active ? 'default' : 'secondary'}>
                  {center.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DepartmentsTable() {
  const { data: departments = [] } = useDepartments()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Head</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {departments.slice(0, 5).map((dept) => (
            <tr key={dept.id} className="border-b">
              <td className="p-4 font-medium">{dept.name}</td>
              <td className="p-4">{dept.code}</td>
              <td className="p-4">{dept.head_name || 'Not assigned'}</td>
              <td className="p-4">
                <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                  {dept.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SalesTypesTable() {
  const { data: salesTypes = [] } = useSalesTypes()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Types</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {salesTypes.slice(0, 5).map((type) => (
            <tr key={type.id} className="border-b">
              <td className="p-4 font-medium">{type.name}</td>
              <td className="p-4">{type.code}</td>
              <td className="p-4">{type.description || '-'}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {type.is_retail && <Badge variant="outline" className="text-xs">Retail</Badge>}
                  {type.is_wholesale && <Badge variant="outline" className="text-xs">Wholesale</Badge>}
                  {type.is_b2b && <Badge variant="outline" className="text-xs">B2B</Badge>}
                </div>
              </td>
              <td className="p-4">
                <Badge variant={type.is_active ? 'default' : 'secondary'}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExpenseCategoriesTable() {
  const { data: expenseCategories = [] } = useExpenseCategories()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Parent</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {expenseCategories.slice(0, 5).map((category) => (
            <tr key={category.id} className="border-b">
              <td className="p-4 font-medium">{category.name}</td>
              <td className="p-4">{category.code}</td>
              <td className="p-4">{category.description || '-'}</td>
              <td className="p-4">{category.parent_name || 'Root'}</td>
              <td className="p-4">
                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CustomerGroupsTable() {
  const { data: customerGroups = [] } = useCustomerGroups()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Code</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Discount</th>
            <th className="text-left p-4">Credit Limit</th>
            <th className="text-left p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {customerGroups.slice(0, 5).map((group) => (
            <tr key={group.id} className="border-b">
              <td className="p-4 font-medium">{group.name}</td>
              <td className="p-4">{group.code}</td>
              <td className="p-4">{group.description || '-'}</td>
              <td className="p-4">{group.discount_percentage ? `${group.discount_percentage}%` : '-'}</td>
              <td className="p-4">{group.credit_limit ? formatCurrency(group.credit_limit) : 'No limit'}</td>
              <td className="p-4">
                <Badge variant={group.is_active ? 'default' : 'secondary'}>
                  {group.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Currency formatting utility
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}
