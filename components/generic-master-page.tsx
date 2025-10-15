'use client'

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Edit, Trash2, Search, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { golangAPI } from "@/lib/api"
import { useMasterMutations } from "@/lib/hooks/masters"

interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'boolean' | 'currency'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  validation?: (value: any) => string | null
}

interface MasterConfig {
  endpoint: string
  title: string
  description: string
  icon?: React.ReactNode
  tableColumns: {
    key: string
    label: string
    render?: (value: any, item: any) => React.ReactNode
    sortable?: boolean
  }[]
  formFields: FieldConfig[]
  searchFields?: string[]
  defaultSort?: { field: string; direction: 'asc' | 'desc' }
  actions?: {
    canEdit?: boolean
    canDelete?: boolean
    canView?: boolean
    customActions?: { label: string; action: (item: any) => void }[]
  }
}

interface GenericMasterPageProps {
  config: MasterConfig
  breadcrumbs?: { label: string; href?: string }[]
}

export default function GenericMasterPage({ config, breadcrumbs = [] }: GenericMasterPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { create, update, delete: deleteMaster } = useMasterMutations()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState(config.defaultSort?.field || config.tableColumns[0]?.key || 'id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(config.defaultSort?.direction || 'asc')

  // Fetch data using dynamic query
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['masters', config.endpoint],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/masters/${config.endpoint}`)
      return res.data
    },
    staleTime: 300_000,
  })

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Reset form
  const resetForm = () => {
    const initialData: Record<string, any> = {}
    config.formFields.forEach(field => {
      if (field.type === 'boolean') {
        initialData[field.key] = false
      } else if (field.type === 'number') {
        initialData[field.key] = 0
      } else {
        initialData[field.key] = ''
      }
    })
    setFormData(initialData)
    setEditingItem(null)
  }

  // Handle input changes
  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }))
  }

  // Filter and sort data
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    // Apply search filter
    if (searchTerm && config.searchFields) {
      filtered = items.filter(item =>
        config.searchFields!.some(field =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [items, searchTerm, sortField, sortDirection, config.searchFields])

  // Handle add
  const handleAdd = async () => {
    try {
      await create.mutateAsync({
        endpoint: config.endpoint,
        data: formData
      })
      toast({
        title: "Success",
        description: `${config.title} added successfully`,
      })
      setIsAddDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add ${config.title}`,
        variant: "destructive"
      })
    }
  }

  // Handle edit
  const handleEdit = (item: any) => {
    setFormData(item)
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  // Handle update
  const handleUpdate = async () => {
    if (!editingItem) return

    try {
      await update.mutateAsync({
        endpoint: config.endpoint,
        id: editingItem.id,
        data: formData
      })
      toast({
        title: "Success",
        description: `${config.title} updated successfully`,
      })
      setIsEditDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${config.title}`,
        variant: "destructive"
      })
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this ${config.title}?`)) {
      try {
        await deleteMaster.mutateAsync({ endpoint: config.endpoint, id })
        toast({
          title: "Success",
          description: `${config.title} deleted successfully`,
        })
        refetch()
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete ${config.title}`,
          variant: "destructive"
        })
      }
    }
  }

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <button
                  onClick={() => router.push(crumb.href!)}
                  className="hover:text-gray-900"
                >
                  {crumb.label}
                </button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/masters')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Masters
          </Button>
          <div className="flex items-center space-x-3">
            {config.icon}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{config.title}</h2>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add {config.title}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${config.title}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {filteredAndSortedItems.length} of {items.length} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {config.tableColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`text-left p-4 ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable !== false && sortField === column.key && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    {config.tableColumns.map((column) => (
                      <td key={column.key} className="p-4">
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {config.actions?.customActions?.map((action, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => action.action(item)}
                          >
                            {action.label}
                          </Button>
                        ))}
                        {config.actions?.canView !== false && (
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {config.actions?.canEdit !== false && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {config.actions?.canDelete !== false && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {config.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">No {config.title} Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No items match your search criteria.' : `Get started by adding your first ${config.title.toLowerCase()}.`}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add {config.title}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {config.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {config.formFields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select
                    value={formData[field.key] || ''}
                    onValueChange={(value) => handleInputChange(field.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={formData[field.key] || false}
                      onChange={(e) => handleInputChange(field.key, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={field.key} className="text-sm">
                      {field.placeholder || 'Enable'}
                    </Label>
                  </div>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={field.key}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              Add {config.title}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {config.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {config.formFields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label htmlFor={`edit_${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select
                    value={formData[field.key] || ''}
                    onValueChange={(value) => handleInputChange(field.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit_${field.key}`}
                      checked={formData[field.key] || false}
                      onChange={(e) => handleInputChange(field.key, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`edit_${field.key}`} className="text-sm">
                      {field.placeholder || 'Enable'}
                    </Label>
                  </div>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={`edit_${field.key}`}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={`edit_${field.key}`}
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update {config.title}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
