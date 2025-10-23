# 🎯 HomeoERP Development Guidelines
**Always Align with Business Vision**

---

## 🚨 GOLDEN RULES

### 1. **Homeopathy-First Thinking**
Every feature must be designed specifically for homeopathy businesses, not generic pharmacy.

**Examples:**
- ✅ Potency dropdown (30C, 200C, 1M, etc.)
- ✅ Form types (Mother Tincture, Biochemic, Dilution)
- ✅ Brand-specific pricing (SBL vs Reckeweg)
- ❌ Generic "medicine" without potency
- ❌ Allopathic medicine features

### 2. **Eliminate Manual Work**
Every feature should reduce manual effort, not just digitize it.

**Examples:**
- ✅ Auto stock update after billing
- ✅ Auto-generate purchase orders
- ✅ WhatsApp automated follow-ups
- ❌ Manual stock entry after sale
- ❌ Manual customer follow-ups

### 3. **Prevent Profit Leaks**
Focus on features that directly prevent losses.

**Examples:**
- ✅ Expiry alerts 30/60/90 days before
- ✅ Low stock alerts
- ✅ Credit limit enforcement
- ✅ Batch-wise profit tracking
- ❌ Features that don't impact profitability

### 4. **Target User: 1-2 Person Operations**
Design for small teams handling everything.

**Examples:**
- ✅ Fast POS billing (serve customers quickly)
- ✅ One-click reports (no complex queries)
- ✅ Mobile-friendly (check stock on phone)
- ✅ WhatsApp notifications (no need to check dashboard)
- ❌ Complex multi-step workflows
- ❌ Features requiring dedicated staff

### 5. **AI Should Save Time, Not Add Complexity**
AI features must be practical and immediately useful.

**Examples:**
- ✅ "You should reorder Arnica 30C" (actionable)
- ✅ "Daily sales: ₹45,000, Profit: ₹12,000" (clear)
- ✅ Auto-generate PO with vendor suggestions
- ❌ Complex ML models requiring training
- ❌ AI features that need configuration

---

## 🎯 TARGET USER PERSONAS

### Persona 1: Rajesh - Retail Shop Owner
- **Business:** Small homeopathy pharmacy
- **Staff:** Just him and one helper
- **Pain Points:** 
  - Handles billing, purchase, and accounts alone
  - Forgets to reorder stock
  - Loses money on expired medicines
  - No time for customer follow-ups
- **What He Needs:**
  - Fast billing
  - Auto reorder alerts
  - Expiry alerts
  - Automated WhatsApp follow-ups
  - Daily profit summary on phone

### Persona 2: Priya - Wholesale Distributor
- **Business:** Distributes to 50+ retailers
- **Staff:** 5 people (sales, accounts, warehouse)
- **Pain Points:**
  - Multiple price lists (retail, wholesale, dealer)
  - Credit management chaos
  - Stock across 2 warehouses
  - Vendor price comparison takes hours
- **What She Needs:**
  - Customer-wise pricing
  - Credit limit enforcement
  - Multi-warehouse stock visibility
  - Vendor price comparison reports
  - Outstanding tracking

### Persona 3: Dr. Sharma - Homeopathy Doctor
- **Business:** Clinic with dispensary
- **Staff:** Just him and receptionist
- **Pain Points:**
  - Prescription management
  - Patient history tracking
  - Stock for dispensary
  - Billing after consultation
- **What He Needs:**
  - Digital prescriptions
  - Patient history
  - Quick dispensary billing
  - Remedy suggestions
  - Appointment scheduling

---

## 🏗️ FEATURE DEVELOPMENT CHECKLIST

Before implementing any feature, ask:

### Business Value
- [ ] Does it solve a real problem for homeopathy businesses?
- [ ] Will it save time or prevent losses?
- [ ] Is it specific to homeopathy or generic?
- [ ] Will users pay for this feature?

### User Experience
- [ ] Can a non-technical person use it?
- [ ] Does it work on mobile?
- [ ] Is it fast (< 2 seconds)?
- [ ] Does it require training?

### Technical Quality
- [ ] Is it type-safe (TypeScript/Go)?
- [ ] Does it have error handling?
- [ ] Does it have loading states?
- [ ] Is it tested?

### Integration
- [ ] Does it integrate with existing modules?
- [ ] Does it update related data automatically?
- [ ] Does it generate events for audit?
- [ ] Does it work with multi-branch?

---

## 📋 MODULE PRIORITIES

### P0 - Must Have (Core Business Operations)
1. **Billing** - Fast POS + Credit billing
2. **Inventory** - Batch tracking + Expiry alerts
3. **Purchase** - PO + GRN + Auto stock update
4. **Customers** - Database + Outstanding tracking
5. **Finance** - Payment tracking + GST reports

### P1 - Should Have (Competitive Advantage)
6. **AI Reorder** - Predictive stock suggestions
7. **WhatsApp** - Automated follow-ups
8. **Reports** - Daily sales + Profit analytics
9. **Loyalty** - Points program
10. **Multi-Branch** - Stock transfers + Comparison

### P2 - Nice to Have (Advanced Features)
11. **Prescription** - Doctor module
12. **Marketing** - Social media automation
13. **E-commerce** - Online ordering
14. **Analytics** - Advanced BI
15. **Mobile App** - Native iOS/Android

---

## 🎨 UI/UX GUIDELINES

### Design Principles
1. **Fast First** - Speed over fancy animations
2. **Mobile-Friendly** - Works on phone screens
3. **Minimal Clicks** - 3 clicks max to any action
4. **Clear Labels** - No technical jargon
5. **Instant Feedback** - Loading states everywhere

### Color Coding
- 🟢 Green: Profit, Success, Active
- 🔴 Red: Loss, Error, Expiring Soon
- 🟡 Yellow: Warning, Pending, Low Stock
- 🔵 Blue: Information, Links
- ⚫ Gray: Inactive, Disabled

### Typography
- **Headings:** Bold, clear hierarchy
- **Numbers:** Large, easy to read (₹45,000)
- **Labels:** Short, descriptive
- **Buttons:** Action-oriented ("Create Invoice" not "Submit")

### Responsive Design
- **Desktop:** Full dashboard with charts
- **Tablet:** Simplified layout
- **Mobile:** Essential actions only (billing, stock check)

---

## 🔧 TECHNICAL STANDARDS

### Backend (Go)
```go
// Always use this pattern
type Handler struct {
    service Service
}

func (h *Handler) CreateInvoice(c *gin.Context) {
    // 1. Validate input
    // 2. Call service
    // 3. Return response
    // 4. Handle errors
}
```

### Frontend (Next.js)
```typescript
// Always use SWR for data fetching
const { data, error, mutate } = useSWR('/api/products', fetcher);

// Always show loading state
if (!data) return <LoadingSkeleton />;

// Always handle errors
if (error) return <ErrorMessage />;

// Always use TypeScript types
interface Product {
  id: string;
  name: string;
  // ...
}
```

### Database
```sql
-- Always include these columns
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ
created_by UUID
updated_by UUID
is_active BOOLEAN DEFAULT true

-- Always add indexes for foreign keys
CREATE INDEX idx_products_category ON products(category_id);

-- Always use UUID for IDs
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## 🧪 TESTING REQUIREMENTS

### Every Feature Must Have
1. **Unit Tests** - Business logic
2. **Integration Tests** - API endpoints
3. **Manual Testing** - Real user workflow
4. **Performance Test** - < 2 seconds response
5. **Mobile Test** - Works on phone

### Test Scenarios
- ✅ Happy path (normal usage)
- ✅ Error cases (invalid input)
- ✅ Edge cases (empty data, large data)
- ✅ Concurrent usage (multiple users)
- ✅ Offline scenario (network issues)

---

## 📊 SUCCESS METRICS

### For Every Feature, Measure
1. **Time Saved** - How many minutes/hours per week?
2. **Error Reduction** - % decrease in mistakes
3. **User Adoption** - % of users using it
4. **Business Impact** - Profit increase or loss prevention
5. **User Satisfaction** - Feedback score

### Example Metrics
- **Fast POS:** Reduced billing time from 3 min to 1 min (66% faster)
- **Expiry Alerts:** Prevented ₹50,000 losses per month
- **Auto Reorder:** Reduced stockouts from 20% to 5%
- **WhatsApp Follow-ups:** Improved collection by 30%

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying any feature:

### Code Quality
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design tested
- [ ] Code reviewed

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done
- [ ] Mobile tested
- [ ] Performance verified

### Documentation
- [ ] API documented
- [ ] User guide written
- [ ] Code commented
- [ ] Migration script ready
- [ ] Rollback plan exists

### Business
- [ ] Solves real problem
- [ ] Aligns with vision
- [ ] User feedback collected
- [ ] Metrics defined
- [ ] Success criteria clear

---

## 🎯 REMEMBER

**Every line of code should:**
1. Solve a real problem for homeopathy businesses
2. Save time or prevent losses
3. Be easy to use (no training required)
4. Work on mobile
5. Be fast (< 2 seconds)

**Ask yourself:**
- Would Rajesh (1-person shop owner) find this useful?
- Does this eliminate manual work?
- Will this prevent profit leaks?
- Is this specific to homeopathy?
- Can I explain this feature in 1 sentence?

**If answer is NO to any question, reconsider the feature.**

---

## 📞 WHEN IN DOUBT

**Ask:**
1. Does this help a homeopathy business make more money?
2. Does this save time for a 1-2 person operation?
3. Is this specific to homeopathy or generic?
4. Would users pay for this?
5. Can it be simpler?

**Remember:**
- **Target:** Homeopathy retailers, wholesalers, distributors, doctors
- **Goal:** Eliminate manual work, prevent profit leaks
- **Approach:** AI-powered automation, not just digitization
- **Success:** User saves 10+ hours/week and increases profit by 15-25%

---

🎯 **HomeoERP - Built for Homeopathy Businesses, By Understanding Their Real Problems**
