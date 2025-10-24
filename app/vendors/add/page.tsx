'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { useVendorMutations, useVendorTypes } from '@/lib/hooks/vendors'

interface VendorForm {
  name: string
  email: string
  phone: string
  vendor_type: string
  gst_number?: string
  address?: string
  notes?: string
}

export default function AddVendorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { create } = useVendorMutations()
  const { data: vendorTypes = [] } = useVendorTypes()

  const [form, setForm] = useState<VendorForm>({
    name: '',
    email: '',
    phone: '',
    vendor_type: vendorTypes[0]?.id || 'manufacturer',
    gst_number: '',
    address: '',
    notes: ''
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast({ title: 'Missing name', description: 'Vendor name is required', variant: 'destructive' })
      return
    }
    try {
      await create.mutateAsync(form)
      toast({ title: 'Vendor created' })
      router.push('/vendors')
    } catch (err: any) {
      toast({ title: 'Error creating vendor', description: err?.message || 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Add Vendor</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="Vendor name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="e.g., 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.vendor_type} onValueChange={(v) => setForm(prev => ({ ...prev, vendor_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {vendorTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input id="gst_number" name="gst_number" value={form.gst_number} onChange={onChange} placeholder="e.g., 27AAAAA0000A1Z5" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={3} value={form.address} onChange={onChange} placeholder="Address" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} value={form.notes} onChange={onChange} placeholder="Extra notes" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit"><Save className="w-4 h-4 mr-2"/> Save Vendor</Button>
        </div>
      </form>
    </div>
  )
}
