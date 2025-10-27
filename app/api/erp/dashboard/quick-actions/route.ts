import { NextResponse } from 'next/server'

export async function GET() {
  const quickActions = [
    {
      id: 'pos',
      title: 'New Sale',
      description: 'Create POS billing',
      icon: 'ShoppingCart',
      link: '/sales/pos',
      color: 'green'
    },
    {
      id: 'purchase',
      title: 'New Purchase',
      description: 'Add purchase order',
      icon: 'Truck',
      link: '/purchases/create',
      color: 'blue'
    },
    {
      id: 'product',
      title: 'Add Product',
      description: 'Add new product',
      icon: 'Package',
      link: '/products/add',
      color: 'purple'
    },
    {
      id: 'customer',
      title: 'New Customer',
      description: 'Register customer',
      icon: 'Users',
      link: '/customers/add',
      color: 'orange'
    }
  ]

  return NextResponse.json({
    success: true,
    data: quickActions
  })
}
