// Layout Configuration with User Preferences

export type LayoutType = 
  | 'erp-layout'            // New ERP layout (Simple or Full 4-side)
  | 'three-panel'           // Left sidebar + Top bar + Right sidebar
  | 'mega-menu'             // Top mega menu only
  | 'classic-sidebar'       // Left sidebar only
  | 'minimal-top'           // Minimal top bar
  | 'ecommerce-mega'        // Full e-commerce style mega menu
  | 'hybrid-mega-three';    // Top mega + left sidebar + right quick access

export interface LayoutPreferences {
  layoutType: LayoutType;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showTopMegaMenu: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark';
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  layoutType: 'erp-layout',
  showLeftSidebar: true,
  showRightSidebar: true,
  showTopMegaMenu: true,
  compactMode: false,
  theme: 'light',
};

export const LAYOUT_OPTIONS = [
  {
    id: 'erp-layout',
    name: 'ERP Layout',
    description: 'Professional ERP layout with customizable panels (Simple or Full 4-side)',
    icon: '',
    preview: '/images/layouts/erp-layout.png',
  },
  {
    id: 'ecommerce-mega',
    name: 'E-Commerce Mega Menu',
    description: 'Full mega menu with categories like e-commerce sites',
    icon: '',
    preview: '/images/layouts/ecommerce-mega.png',
  },
  {
    id: 'three-panel',
    name: 'Three Panel Layout',
    description: 'Left sidebar + Top bar + Right quick access',
    icon: '',
    preview: '/images/layouts/three-panel.png',
  },
  {
    id: 'mega-menu',
    name: 'Mega Menu Only',
    description: 'Top mega menu with dropdown categories',
    icon: '',
    preview: '/images/layouts/mega-menu.png',
  },
  {
    id: 'classic-sidebar',
    name: 'Classic Sidebar',
    description: 'Traditional left sidebar navigation',
    icon: '',
    preview: '/images/layouts/classic-sidebar.png',
  },
  {
    id: 'minimal-top',
    name: 'Minimal Top Bar',
    description: 'Clean minimal top navigation',
    icon: '',
    preview: '/images/layouts/minimal-top.png',
  },
  {
    id: 'hybrid-mega-three',
    name: 'Hybrid: Mega + 3-Side',
    description: 'Top hover mega menu + left collapsible sidebar + right quick access',
    icon: '',
    preview: '/images/layouts/hybrid-mega-three.png',
  },
];
