# LMS Pagination Guide

Bu hujjatda sahifalash (pagination) funksiyasi, uning ishlash prinsipi va implementation details haqida to'liq ma'lumot.

## 📁 Yaratilgan Fayllar

### Reusable Components
```
components/
  ├── pagination.tsx           # Main pagination controls
  └── page-size-selector.tsx   # Items per page selector
```

### Updated List Pages (with pagination)
```
app/(dashboard)/admin/
  ├── students/page.tsx        # 25 items per page
  ├── teachers/page.tsx        # 25 items per page
  └── payments/page.tsx        # 25 items per page
```

---

## 🎯 Key Features

### 1. **URL-based Pagination**
```
?page=1              # Current page
?pageSize=25         # Items per page
?page=2&pageSize=50  # Page 2 with 50 items
```

### 2. **Server-side Pagination**
```typescript
// Prisma query
skip: (page - 1) * pageSize,
take: pageSize,

// No client-side processing
// Fast for large datasets
```

### 3. **Smart Page Numbers**
```
Page 1:     [1] 2 3 4 5 ... 10
Page 5:     1 ... 4 [5] 6 ... 10
Page 10:    1 ... 6 7 8 9 [10]
```

### 4. **Navigation Controls**
- ⏮️ First page button
- ◀️ Previous page button
- Page numbers (smart display)
- ▶️ Next page button
- ⏭️ Last page button

### 5. **Page Size Selector**
- 10, 25, 50, 100 items per page
- Resets to page 1 when changed
- Remembers selection in URL

### 6. **Results Counter**
```
"1 dan 25 gacha, jami 147 ta natija"
"Jami: 147 ta o'quvchi"
```

---

## 📊 Pagination Component

### Usage

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={pageSize}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| currentPage | number | Current page (1-based) |
| totalPages | number | Total number of pages |
| totalItems | number | Total number of items |
| itemsPerPage | number | Items per page |

### Features

- ✅ First/Last page buttons
- ✅ Previous/Next buttons
- ✅ Smart page numbers display
- ✅ Disabled states when at limits
- ✅ Results counter
- ✅ Responsive design
- ✅ URL-based navigation

### Page Numbers Logic

```typescript
const getPageNumbers = () => {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible + 2) {
    // Show all pages: [1] 2 3 4 5 6
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Smart display with ellipsis
    pages.push(1)
    
    if (currentPage > 3) pages.push('...')
    
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 2) pages.push('...')
    
    pages.push(totalPages)
  }
  
  return pages
}
```

---

## 🎛️ Page Size Selector

### Usage

```tsx
<PageSizeSelector 
  currentPageSize={pageSize} 
  options={[10, 25, 50, 100]}  // Optional
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentPageSize | number | - | Current page size |
| options | number[] | [10, 25, 50, 100] | Available page sizes |

### Features

- ✅ Dropdown select
- ✅ Updates URL (?pageSize=value)
- ✅ Resets to page 1 when changed
- ✅ Compact design (80px width)
- ✅ Label: "Sahifada:"

### Implementation

```typescript
const handleChange = (value: string) => {
  const params = new URLSearchParams(searchParams.toString())
  params.set('pageSize', value)
  params.delete('page')  // ← Reset to page 1
  router.push(`${pathname}?${params.toString()}`)
}
```

---

## 💻 Implementation Example

### Server Component (Page)

```tsx
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    status?: string
    page?: string
    pageSize?: string
  }
}) {
  const tenantId = session.user.tenantId!

  // Pagination params
  const currentPage = parseInt(searchParams.page || '1')
  const pageSize = parseInt(searchParams.pageSize || '25')
  const skip = (currentPage - 1) * pageSize

  // Where clause (search + filters)
  const whereClause: any = { tenantId }
  if (searchParams.search) {
    whereClause.OR = [/* search fields */]
  }

  // Get total count
  const totalStudents = await db.student.count({ where: whereClause })
  const totalPages = Math.ceil(totalStudents / pageSize)

  // Fetch paginated data
  const students = await db.student.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip,      // ← Skip records
    take: pageSize,  // ← Limit records
    include: {/* ... */}
  })

  return (
    <>
      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search + Filters */}
            <div className="flex flex-col gap-4 md:flex-row">
              <SearchBar />
              <FilterSelect />
              <ClearFilters />
            </div>
            
            {/* Page size + Counter */}
            <div className="flex justify-between items-center">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-sm text-muted-foreground">
                Jami: <span className="font-medium">{totalStudents}</span> ta
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>{/* ... */}</Card>

      {/* Pagination */}
      {students.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStudents}
          itemsPerPage={pageSize}
        />
      )}
    </>
  )
}
```

---

## 🔢 Pagination Math

### Calculations

```typescript
// Current page (default 1)
const currentPage = parseInt(searchParams.page || '1')

// Items per page (default 25)
const pageSize = parseInt(searchParams.pageSize || '25')

// Skip records (for database query)
const skip = (currentPage - 1) * pageSize

// Total pages
const totalPages = Math.ceil(totalItems / pageSize)

// Start item number (for display)
const startItem = (currentPage - 1) * pageSize + 1

// End item number (for display)
const endItem = Math.min(currentPage * pageSize, totalItems)
```

### Examples

```
Page 1, PageSize 25, Total 147:
  skip = 0
  take = 25
  startItem = 1
  endItem = 25
  totalPages = 6

Page 2, PageSize 25, Total 147:
  skip = 25
  take = 25
  startItem = 26
  endItem = 50

Page 6, PageSize 25, Total 147:
  skip = 125
  take = 25
  startItem = 126
  endItem = 147
```

---

## 🎨 UI Layout

### Desktop View
```
┌─────────────────────────────────────────────────────────┐
│  Search...   [Status ▼]  [Class ▼]  [Clear]            │
│  Sahifada: [25 ▼]                    Jami: 147 ta       │
└─────────────────────────────────────────────────────────┘

         [Table with 25 rows]

┌─────────────────────────────────────────────────────────┐
│  1 dan 25 gacha, jami 147 ta   [⏮] [◀] 1 [2] 3 [▶] [⏭]│
└─────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────┐
│  Search...           │
│  [Status ▼]          │
│  [Class ▼]           │
│  [Clear]             │
│  Sahifada: [25 ▼]    │
│  Jami: 147 ta        │
└──────────────────────┘

   [Table scrollable]

┌──────────────────────┐
│  1-25 / 147          │
│  [⏮][◀] 1 [▶][⏭]    │
└──────────────────────┘
```

---

## 🚀 Performance Benefits

### Database Level
```sql
-- Without pagination: Fetch ALL
SELECT * FROM students WHERE tenant_id = '...'
-- Returns 10,000 rows ❌

-- With pagination: Fetch NEEDED
SELECT * FROM students WHERE tenant_id = '...'
LIMIT 25 OFFSET 0
-- Returns 25 rows ✅
```

### Network
- Smaller response size
- Faster load times
- Less memory usage

### User Experience
- Quick page loads
- Smooth navigation
- No lag with large datasets

---

## 📊 Default Settings

| Page | Default PageSize | Options |
|------|-----------------|---------|
| Students | 25 | 10, 25, 50, 100 |
| Teachers | 25 | 10, 25, 50, 100 |
| Payments | 25 | 10, 25, 50, 100 |
| Classes | No pagination | (Grid view, typically < 50) |

---

## 🔗 URL State Management

### Combined with Search & Filters

```
Base URL:
/admin/students

With search:
/admin/students?search=ali

With pagination:
/admin/students?page=2&pageSize=50

All combined:
/admin/students?search=ali&status=ACTIVE&classId=123&page=2&pageSize=50

Clear all:
/admin/students
```

### State Preservation

```typescript
// Always preserve other params
const params = new URLSearchParams(searchParams.toString())

// Add/update pagination
params.set('page', '2')
params.set('pageSize', '50')

// Search and filters are preserved
router.push(`${pathname}?${params.toString()}`)
```

### Reset Page on Filter Change

```typescript
// When search/filter changes, reset to page 1
const handleFilterChange = () => {
  params.set('status', newStatus)
  params.delete('page')  // ← Reset to page 1
  router.push(...)
}
```

---

## 🧪 Testing Scenarios

### Test Cases:

#### 1. Basic Pagination
```
- Go to page 2
- Check URL: ?page=2
- Check correct items shown (26-50)
- Go to page 1
- Check items 1-25
```

#### 2. Page Size Change
```
- Change pageSize to 50
- Check URL: ?pageSize=50 (no page param)
- Check 50 items shown
- Check page reset to 1
```

#### 3. Last Page
```
- Go to last page (e.g., page 6 of 6)
- Check correct items shown (126-147)
- Check "Next" button disabled
- Check "Last" button disabled
```

#### 4. Pagination with Search
```
- Search "ali"
- Check pagination updated (new totalPages)
- Go to page 2
- Check URL: ?search=ali&page=2
- Clear search
- Check pagination reset
```

#### 5. Edge Cases
```
- Only 1 page: Pagination hidden
- 0 results: No pagination shown
- Exactly pageSize items: Shows 1 page
- pageSize + 1 items: Shows 2 pages
```

---

## 🎯 Best Practices

### 1. Always Count First
```typescript
// Get total count before fetching data
const totalItems = await db.entity.count({ where: whereClause })
const totalPages = Math.ceil(totalItems / pageSize)

// Then fetch paginated data
const items = await db.entity.findMany({
  where: whereClause,
  skip,
  take: pageSize,
})
```

### 2. Validate Page Number
```typescript
// Prevent invalid page numbers
const currentPage = Math.max(1, parseInt(searchParams.page || '1'))

// Or redirect if page > totalPages
if (currentPage > totalPages && totalPages > 0) {
  redirect(`${pathname}?page=${totalPages}`)
}
```

### 3. Hide When Not Needed
```typescript
// Don't show pagination if only 1 page
if (totalPages <= 1) return null

// Don't show if no results
{items.length > 0 && <Pagination {...props} />}
```

### 4. Reset Page on Changes
```typescript
// When filters change, reset to page 1
params.delete('page')
```

### 5. Use Consistent Defaults
```typescript
// Same defaults everywhere
const DEFAULT_PAGE_SIZE = 25
const pageSize = parseInt(searchParams.pageSize || DEFAULT_PAGE_SIZE.toString())
```

---

## 📈 Scalability

### Small Dataset (< 100 items)
```
Pagination: Optional
UI: Can show all at once
Performance: Minimal impact
```

### Medium Dataset (100 - 1,000 items)
```
Pagination: Recommended
PageSize: 25-50
Performance: Noticeable improvement
```

### Large Dataset (> 1,000 items)
```
Pagination: Required
PageSize: 25
Performance: Critical for speed
Additional: Consider virtual scrolling (future)
```

---

## 🎨 UI Components

### Pagination Component

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  {/* Results info */}
  <div className="text-sm text-muted-foreground">
    <span className="font-medium">1</span> dan{' '}
    <span className="font-medium">25</span> gacha,{' '}
    jami <span className="font-medium">147</span> ta natija
  </div>

  {/* Controls */}
  <div className="flex items-center gap-2">
    <Button>⏮️</Button>  {/* First */}
    <Button>◀️</Button>  {/* Previous */}
    <Button>1</Button>   {/* Page numbers */}
    <Button>2</Button>
    <Button>...</Button>
    <Button>▶️</Button>  {/* Next */}
    <Button>⏭️</Button>  {/* Last */}
  </div>
</div>
```

### Page Size Selector

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">Sahifada:</span>
  <Select value="25">
    <SelectTrigger className="w-[80px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="10">10</SelectItem>
      <SelectItem value="25">25</SelectItem>
      <SelectItem value="50">50</SelectItem>
      <SelectItem value="100">100</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 🔧 Implementation Details

### Students Page

```typescript
// searchParams type
searchParams: { 
  search?: string
  status?: string
  classId?: string
  page?: string        // ← Added
  pageSize?: string    // ← Added
}

// Pagination logic
const currentPage = parseInt(searchParams.page || '1')
const pageSize = parseInt(searchParams.pageSize || '25')
const skip = (currentPage - 1) * pageSize

// Count total
const totalStudents = await db.student.count({ where: whereClause })
const totalPages = Math.ceil(totalStudents / pageSize)

// Fetch paginated
const students = await db.student.findMany({
  where: whereClause,
  skip,
  take: pageSize,
  // ...
})
```

### Teachers Page

```typescript
// Same pattern
const currentPage = parseInt(searchParams.page || '1')
const pageSize = parseInt(searchParams.pageSize || '25')
const skip = (currentPage - 1) * pageSize

const totalTeachers = await db.teacher.count({ where: whereClause })
const totalPages = Math.ceil(totalTeachers / pageSize)

const teachers = await db.teacher.findMany({
  skip,
  take: pageSize,
})
```

### Payments Page

```typescript
// Same pattern
const currentPage = parseInt(searchParams.page || '1')
const pageSize = parseInt(searchParams.pageSize || '25')
const skip = (currentPage - 1) * pageSize

const totalPayments = await db.payment.count({ where: whereClause })
const totalPages = Math.ceil(totalPayments / pageSize)

const payments = await db.payment.findMany({
  skip,
  take: pageSize,
})
```

---

## 🎯 User Flow

### Scenario 1: Basic Navigation
```
1. User lands on /admin/students (page 1, 25 items)
2. Sees students 1-25 of 147
3. Clicks page 2
4. URL updates to ?page=2
5. Sees students 26-50 of 147
```

### Scenario 2: Change Page Size
```
1. User on page 2 with 25 items
   URL: ?page=2&pageSize=25
2. Changes page size to 50
   URL: ?pageSize=50 (page removed)
3. Back to page 1 with 50 items
4. Now sees students 1-50 of 147
```

### Scenario 3: Pagination + Filters
```
1. User searches "Ali"
   URL: ?search=ali
2. 23 results found
3. Pagination hidden (only 1 page)
4. User clears search
5. 147 results, pagination shows again
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Infinite scroll option
- [ ] Jump to page input
- [ ] Show page range selector (1-10, 11-20, etc)
- [ ] Keyboard navigation (arrows)
- [ ] Remember pageSize per user

### Phase 3
- [ ] Virtual scrolling (react-window)
- [ ] Lazy loading
- [ ] Prefetch next page
- [ ] Progressive loading
- [ ] Scroll position restoration

### Phase 4
- [ ] Server-side cursor pagination
- [ ] Real-time updates (WebSocket)
- [ ] Optimistic UI updates
- [ ] Cached pagination data
- [ ] Analytics (which pages viewed most)

---

## ✅ Summary

### Created:
- ✅ Pagination component (smart page numbers)
- ✅ PageSizeSelector component
- ✅ 3 Updated list pages with pagination
- ✅ URL-based state management
- ✅ Server-side pagination (skip/take)
- ✅ Results counter
- ✅ Responsive design

### Key Features:
- **URL-based** - Sharable, bookmarkable
- **Server-side** - Fast queries, scalable
- **Smart Display** - Ellipsis for many pages
- **Page Size** - Customizable (10/25/50/100)
- **Results Counter** - "X dan Y gacha, jami Z"
- **Auto-hide** - When only 1 page
- **Responsive** - Mobile-friendly

### Performance:
| Dataset Size | Without Pagination | With Pagination | Improvement |
|-------------|-------------------|-----------------|-------------|
| 100 items | 100 rows | 25 rows | 4x faster |
| 1,000 items | 1,000 rows | 25 rows | 40x faster |
| 10,000 items | 10,000 rows | 25 rows | 400x faster |

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Pagination Complete

