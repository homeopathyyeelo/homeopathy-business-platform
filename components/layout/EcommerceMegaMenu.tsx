'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search, ShoppingCart, User, Heart, Menu, X } from 'lucide-react';

interface EcommerceMegaMenuProps {
  children: React.ReactNode;
}

// E-commerce Style Mega Menu Structure
const megaMenuCategories = [
  {
    id: 'medicines',
    title: 'Medicines',
    icon: '💊',
    columns: [
      {
        title: 'By Brand',
        items: [
          { name: 'SBL', path: '/products/brand/sbl' },
          { name: 'Dr. Reckeweg (Germany)', path: '/products/brand/reckeweg' },
          { name: 'Willmar Schwabe', path: '/products/brand/schwabe' },
          { name: 'BJain', path: '/products/brand/bjain' },
          { name: 'Adel Pekana', path: '/products/brand/adel' },
          { name: 'View All Brands', path: '/products/brands', featured: true },
        ]
      },
      {
        title: 'By Potency',
        items: [
          { name: '3X, 6X Dilutions', path: '/products/potency/3x-6x' },
          { name: '6 CH, 12 CH', path: '/products/potency/6ch-12ch' },
          { name: '30 CH', path: '/products/potency/30ch' },
          { name: '200 CH', path: '/products/potency/200ch' },
          { name: '1000 CH (1M)', path: '/products/potency/1m' },
          { name: 'CM CH, 10M CH', path: '/products/potency/cm-10m' },
        ]
      },
      {
        title: 'Mother Tinctures',
        items: [
          { name: 'Single Remedies', path: '/products/mother-tinctures/single' },
          { name: 'Combination', path: '/products/mother-tinctures/combination' },
          { name: 'Herbal Extracts', path: '/products/mother-tinctures/herbal' },
        ]
      },
      {
        title: 'Biochemic',
        items: [
          { name: 'Single Salts', path: '/products/biochemic/single' },
          { name: 'Combination Salts', path: '/products/biochemic/combination' },
          { name: 'Bio Combination', path: '/products/biochemic/bio-combination' },
        ]
      },
    ]
  },
  {
    id: 'cosmetics',
    title: 'Cosmetics',
    icon: '💄',
    columns: [
      {
        title: 'Hair Care',
        items: [
          { name: 'Hair Oils', path: '/cosmetics/hair/oils' },
          { name: 'Shampoos', path: '/cosmetics/hair/shampoos' },
          { name: 'Hair Serums', path: '/cosmetics/hair/serums' },
        ]
      },
      {
        title: 'Skin Care',
        items: [
          { name: 'Face Creams', path: '/cosmetics/skin/creams' },
          { name: 'Face Wash', path: '/cosmetics/skin/facewash' },
          { name: 'Moisturizers', path: '/cosmetics/skin/moisturizers' },
        ]
      },
      {
        title: 'Oral Care',
        items: [
          { name: 'Toothpaste', path: '/cosmetics/oral/toothpaste' },
          { name: 'Mouthwash', path: '/cosmetics/oral/mouthwash' },
        ]
      },
    ]
  },
  {
    id: 'bach-flower',
    title: 'Bach Flower',
    icon: '🌸',
    columns: [
      {
        title: 'Remedies',
        items: [
          { name: 'Bach Flower Remedies', path: '/bach-flower/remedies' },
          { name: 'Bach Flower Kits', path: '/bach-flower/kits' },
        ]
      },
      {
        title: 'Millesimal LM Potency',
        items: [
          { name: 'LM Potencies', path: '/bach-flower/lm-potency' },
          { name: 'SBL LM', path: '/bach-flower/sbl-lm' },
          { name: 'BJain LM', path: '/bach-flower/bjain-lm' },
        ]
      },
    ]
  },
  {
    id: 'kits',
    title: 'Homeopathy Kits',
    icon: '🎁',
    columns: [
      {
        title: 'Complete Kits',
        items: [
          { name: 'Family Kits', path: '/kits/family' },
          { name: 'Travel Kits', path: '/kits/travel' },
          { name: 'First Aid Kits', path: '/kits/first-aid' },
          { name: 'Doctor Kits', path: '/kits/doctor' },
        ]
      },
    ]
  },
  {
    id: 'triturations',
    title: 'Triturations',
    icon: '⚗️',
    columns: [
      {
        title: 'By Brand',
        items: [
          { name: 'SBL Triturations', path: '/triturations/sbl' },
          { name: 'Dr. Reckeweg', path: '/triturations/reckeweg' },
          { name: 'Willmar Schwabe India', path: '/triturations/schwabe' },
          { name: 'BJain', path: '/triturations/bjain' },
        ]
      },
    ]
  },
];

// Top Categories for Quick Access
const topCategories = [
  { name: 'Disease', path: '/disease' },
  { name: 'Homeopathy', path: '/homeopathy' },
  { name: 'Ayurveda', path: '/ayurveda' },
  { name: 'Nutrition', path: '/nutrition' },
  { name: 'Personal Care', path: '/personal-care' },
  { name: 'Baby Care', path: '/baby-care' },
  { name: 'Sexual Wellness', path: '/sexual-wellness' },
  { name: 'Fitness', path: '/fitness' },
  { name: 'Consultation', path: '/consultation' },
  { name: 'Unani', path: '/unani' },
  { name: 'Allopathy', path: '/allopathy' },
];

export default function EcommerceMegaMenu({ children }: EcommerceMegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCategoryEnter = (categoryId: string) => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
    setActiveCategory(categoryId);
  };

  const handleCategoryLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 200);
  };

  const handleMenuClick = () => {
    setActiveCategory(null);
  };

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, []);

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  const activeCategoryData = megaMenuCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Like E-commerce Sites */}
      <div className="bg-gray-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>📞 +91 9876543210</span>
            <span>✉️ support@yeelo.com</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/track-order" className="hover:text-blue-400">Track Order</Link>
            <Link href="/help" className="hover:text-blue-400">Help</Link>
            <Link href="/user/profile" className="hover:text-blue-400">My Account</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        {/* Logo + Search + Actions */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
                <div className="text-3xl">🏥</div>
                <div>
                  <h1 className="text-xl font-bold text-blue-600">Yeelo</h1>
                  <p className="text-xs text-gray-500">Homeopathy ERP</p>
                </div>
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for medicines, brands, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/wishlist" className="flex flex-col items-center gap-1 hover:text-blue-600">
                  <Heart className="w-6 h-6" />
                  <span className="text-xs">Wishlist</span>
                </Link>
                <Link href="/cart" className="flex flex-col items-center gap-1 hover:text-blue-600 relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="text-xs">Cart</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
                </Link>
                <Link href="/user/profile" className="flex flex-col items-center gap-1 hover:text-blue-600">
                  <User className="w-6 h-6" />
                  <span className="text-xs">Account</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories Bar */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {topCategories.map((cat) => (
                <Link
                  key={cat.path}
                  href={cat.path}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white rounded whitespace-nowrap transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mega Menu Navigation */}
        <nav 
          className="bg-white border-b"
          onMouseLeave={handleCategoryLeave}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 py-2">
              {megaMenuCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleCategoryEnter(category.id)}
                >
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    {category.title}
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      activeCategory === category.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mega Menu Dropdown */}
          {activeCategory && activeCategoryData && (
            <div
              className="absolute left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl"
              style={{ top: '100%' }}
              onMouseEnter={() => {
                if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
              }}
              onMouseLeave={handleCategoryLeave}
            >
              <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Category Header */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-4xl">{activeCategoryData.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{activeCategoryData.title}</h3>
                    <p className="text-sm text-gray-500">Browse all products in this category</p>
                  </div>
                </div>

                {/* Columns */}
                <div className={`grid grid-cols-${activeCategoryData.columns.length} gap-8`}>
                  {activeCategoryData.columns.map((column, idx) => (
                    <div key={idx}>
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        {column.title}
                      </h4>
                      <ul className="space-y-2">
                        {column.items.map((item) => (
                          <li key={item.path}>
                            <Link
                              href={item.path}
                              onClick={handleMenuClick}
                              className={`text-sm hover:text-blue-600 hover:translate-x-1 transition-all block ${
                                item.featured 
                                  ? 'text-blue-600 font-semibold' 
                                  : 'text-gray-600'
                              }`}
                            >
                              {item.name}
                              {item.featured && <span className="ml-2">→</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2024 Yeelo Homeopathy ERP - All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}
