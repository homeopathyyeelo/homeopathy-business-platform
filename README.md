# 🏥 Yeelo Homeopathy ERP Platform

Complete ERP solution for Homeopathy businesses with AI-powered features.

## 🚀 Quick Start

```bash
# Start the application
./start.sh

# Stop the application
./stop.sh
```

The application will be available at: **http://localhost:3000**

## ✨ Features

- **Multi-Layout System**: Choose from 6 different layouts including the new Hybrid Mega Menu
- **Master Data Management**: Branches, Categories, Brands, Products, Customers, Vendors
- **Sales & Purchase**: Complete billing, invoicing, and order management
- **Inventory**: Real-time stock tracking, batch management, expiry alerts
- **CRM**: Customer relationship management with AI insights
- **Marketing**: Campaign management, WhatsApp/SMS integration
- **AI Features**: Chat assistant, demand forecasting, price optimization
- **Analytics**: Comprehensive dashboards and reports

## 📁 Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (fallback when microservices unavailable)
│   ├── masters/           # Master data pages (branches, categories, brands, etc.)
│   └── ...                # Other feature pages
├── components/            # React components
│   ├── layout/           # Layout components (HybridMegaThreeLayout, etc.)
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── api.ts            # API client with fallback support
│   ├── hooks/            # React Query hooks
│   └── services/         # Service integrations
├── services/             # Backend microservices (optional)
│   ├── api-golang/       # Golang API (high-performance)
│   ├── api-nestjs/       # NestJS API (enterprise features)
│   ├── api-fastify/      # Fastify API (marketing)
│   └── api-express/      # Express API (legacy support)
├── start.sh              # Production startup script
└── stop.sh               # Stop all services
```

## 🎨 Layout System

The platform supports multiple layouts. Access layout preferences at `/user/layout-preferences`:

1. **Hybrid: Mega + 3-Side** (NEW) - Top hover megamenu + left sidebar + right quick access
2. **E-Commerce Mega Menu** - Full e-commerce style navigation
3. **Three Panel Layout** - Traditional 3-panel design
4. **Mega Menu Only** - Top megamenu with dropdowns
5. **Classic Sidebar** - Left sidebar navigation
6. **Minimal Top Bar** - Clean minimal design

## 🔧 Configuration

### Environment Variables

Create a `.env` file (automatically created by start.sh):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homeopathy_erp"

# API URLs (optional - uses Next.js API routes as fallback)
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:3004
NEXT_PUBLIC_NESTJS_API_URL=http://localhost:3001
NEXT_PUBLIC_FASTIFY_API_URL=http://localhost:3002

# JWT
JWT_SECRET=your-super-secret-jwt-key

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key
```

### Layout Preferences

Change layout via localStorage:

```javascript
localStorage.setItem('layout-preferences', JSON.stringify({
  layoutType: 'hybrid-mega-three',
  showLeftSidebar: true,
  showRightSidebar: true,
  showTopMegaMenu: true,
  compactMode: false,
  theme: 'light'
}));
// Refresh page
```

## 📦 API Integration

The platform uses a **fallback architecture**:

1. **Next.js API Routes** (Primary) - Always available, in-memory data
2. **Microservices** (Optional) - High-performance backend services

### Master Data APIs

All master data endpoints support full CRUD:

- `/api/branches` - Branch management
- `/api/categories` - Product categories
- `/api/brands` - Brand management
- `/api/products` - Product catalog
- `/api/customers` - Customer management
- `/api/vendors` - Vendor management

### Usage Example

```typescript
import api from '@/lib/api';

// Create a branch
const branch = await api.branches.create({
  name: 'New Branch',
  code: 'BR002',
  address: '123 Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  phone: '9876543210',
  email: 'branch@yeelo.com'
});

// Get all branches
const branches = await api.branches.getAll();

// Update a branch
await api.branches.update('1', { name: 'Updated Name' });

// Delete a branch
await api.branches.delete('1');
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev:app

# Build for production
npm run build:app

# Start production server
npm run start:app
```

## 📊 Monitoring

Logs are stored in the `logs/` directory:

```bash
# View frontend logs
tail -f logs/frontend.log

# View all service logs
tail -f logs/*.log

# Check running services
cat logs/services.json
```

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- CORS protection
- Input validation with Zod

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

Proprietary - Yeelo Technologies

## 🆘 Support

For support, email: support@yeelo.com

---

**Built with ❤️ using Next.js 15, React 19, TypeScript, and Tailwind CSS**
