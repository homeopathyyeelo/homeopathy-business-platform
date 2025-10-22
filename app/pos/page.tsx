"use client"

import { useState } from "react"
import { useProducts, useProductStats } from '@/lib/hooks/products'

interface Product {
  id: string
  name: string
  sku: string
  price?: number
  unit_price?: number
  stock?: number
  stock_qty?: number
  category: string
  potency?: string
  is_active?: boolean
}

interface CartItem extends Product {
  quantity: number
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash")
  const [discount, setDiscount] = useState(0)

  // Use React Query hook for products
  const { data: products = [], isLoading } = useProducts()
  const stats = useProductStats(products)

  const addToCart = (product: Product) => {
    const stock = product.stock ?? product.stock_qty ?? 0
    if (stock === 0) {
      alert("Product out of stock!")
      return
    }

    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity >= stock) {
        alert(`Only ${stock} units available!`)
        return
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    const stock = product?.stock ?? product?.stock_qty ?? 0
    if (product && quantity > stock) {
      alert(`Only ${stock} units available!`)
      return
    }

    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + ((item.price ?? item.unit_price ?? 0) * item.quantity), 0)
  const discountAmount = (subtotal * discount) / 100
  const taxableAmount = subtotal - discountAmount
  const gst = taxableAmount * 0.18
  const total = taxableAmount + gst

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!")
      return
    }

    if (!customerPhone && !customerName) {
      alert("Please enter customer details!")
      return
    }

    try {
      const orderData = {
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price ?? item.unit_price ?? 0,
          subtotal: (item.price ?? item.unit_price ?? 0) * item.quantity
        })),
        subtotal,
        discount: discountAmount,
        tax: gst,
        total,
        paymentMethod,
        status: "completed"
      }

      // Try to create order via API
      const response = await fetch('http://localhost:3004/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        setLastOrder({ ...orderData, orderId: order.id || `ORD-${Date.now()}`, timestamp: new Date() })
      } else {
        // Fallback if API fails
        setLastOrder({ ...orderData, orderId: `ORD-${Date.now()}`, timestamp: new Date() })
      }

      setShowReceipt(true)
    } catch (error) {
      console.error('Checkout failed:', error)
      // Still show receipt even if API fails
      const orderData = {
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: gst,
        total,
        paymentMethod,
        orderId: `ORD-${Date.now()}`,
        timestamp: new Date()
      }
      setLastOrder(orderData)
      setShowReceipt(true)
    }
  }

  const resetPOS = () => {
    setCart([])
    setCustomerPhone("")
    setCustomerName("")
    setSelectedCustomer(null)
    setDiscount(0)
    setShowReceipt(false)
    setPaymentMethod("cash")
  }

  const printReceipt = () => {
    window.print()
  }

  // Filter products based on search term (only when products are loaded)
  const filteredProducts = isLoading ? [] : products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.potency && product.potency.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (showReceipt && lastOrder) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
          {/* Receipt Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-blue-600"> Yeelo Homeopathy</h1>
            <p className="text-gray-600 mt-1">Complete Homeopathy Solutions</p>
            <p className="text-sm text-gray-500">Ph: +91 98765 43210 | Email: info@yeelo.com</p>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-bold">{lastOrder.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-bold">{new Date(lastOrder.timestamp).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-bold">{lastOrder.customerName}</p>
              {lastOrder.customerPhone && <p className="text-sm">{lastOrder.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-bold uppercase">{lastOrder.paymentMethod}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead className="bg-gray-100 border-y border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-center">Qty</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.items.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-4 py-2">
                    <div className="font-medium">{item.name || item.productName}</div>
                    <div className="text-xs text-gray-500">{item.sku}</div>
                  </td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">{(item.price ?? item.unit_price ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium">{((item.price ?? item.unit_price ?? 0) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{lastOrder.subtotal.toFixed(2)}</span>
            </div>
            {lastOrder.discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Discount:</span>
                <span className="font-medium">- {lastOrder.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">GST (18%):</span>
              <span className="font-medium">{lastOrder.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2 mt-2">
              <span>Total:</span>
              <span className="text-blue-600">{lastOrder.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">Thank you for your purchase!</p>
            <p className="text-xs text-gray-500 mt-2">For queries, contact: support@yeelo.com</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 print:hidden">
            <button
              onClick={printReceipt}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
               Print Receipt
            </button>
            <button
              onClick={resetPOS}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
               New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Left: Products & Inventory */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3"> Product Inventory</h2>
          
          <input
            type="text"
            placeholder="Search by name, SKU, or potency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 mt-3 text-sm">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
              Total: {products.length}
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded">
              In Stock: {products.filter(p => (p.stock ?? p.stock_qty ?? 0) > 0).length}
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded">
              Out: {products.filter(p => (p.stock ?? p.stock_qty ?? 0) === 0).length}
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No products found</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    product.stock === 0
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {product.sku} {product.potency && ` ${product.potency}`}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-blue-600">{(product.price ?? product.unit_price ?? 0).toFixed(2)}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      (product.stock ?? product.stock_qty ?? 0) === 0 ? 'bg-red-100 text-red-800' :
                      (product.stock ?? product.stock_qty ?? 0) < 10 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(product.stock ?? product.stock_qty ?? 0) === 0 ? 'Out' : `${product.stock ?? product.stock_qty ?? 0} left`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-96 bg-white rounded-lg shadow flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900"> Current Sale</h2>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4"></div>
              <div className="font-medium">Cart is empty</div>
              <div className="text-sm mt-1">Click products to add</div>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800 font-bold"
                    title="Remove"
                  >
                    
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{(item.price ?? item.unit_price ?? 0).toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-20 text-right font-bold text-gray-900">
                    {((item.price ?? item.unit_price ?? 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method & Discount */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-2">
              {['cash', 'card', 'upi'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method as any)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    paymentMethod === method
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {method.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({discount}%):</span>
              <span className="font-medium">- {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST (18%):</span>
            <span className="font-medium">{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span className="text-blue-600">{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
          >
             Complete Sale - {total.toFixed(2)}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setCart([])}
              className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear Cart
            </button>
            <button
              onClick={resetPOS}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
