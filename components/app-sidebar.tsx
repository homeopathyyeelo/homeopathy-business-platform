"use client"

export function AppSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r bg-white">
      <div className="p-4 font-bold text-lg">Yeelo Homeopathy</div>
      <nav className="px-2 pb-4 space-y-1">
        <a href="/inventory" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
          Inventory
        </a>
        <a href="/products" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
          Products
        </a>
        <a href="/customers" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
          Customers
        </a>
      </nav>
    </aside>
  )
}
