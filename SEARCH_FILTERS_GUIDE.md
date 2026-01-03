# LMS Search & Filters Guide

Bu hujjatda barcha qidiruv va filtrlash funksiyalari, ularning ishlash prinsipi va best practices haqida to'liq ma'lumot.

## 📁 Yaratilgan Fayllar

### Reusable Components
```
components/
  ├── search-bar.tsx         # Debounced search input
  ├── filter-select.tsx      # URL-based filter dropdown
  └── clear-filters.tsx      # Clear all filters button
```

### Updated List Pages (with search & filters)
```
app/(dashboard)/admin/
  ├── students/page.tsx      # Search + Status + Class filters
  ├── teachers/page.tsx      # Search only
  ├── classes/page.tsx       # Search + Grade level filter
  └── payments/page.tsx      # Search + Status + Type filters
```

---

## 🎯 Key Features

### 1. **Debounced Search** (300ms delay)
- Real-time search as you type
- Prevents excessive API calls
- Smooth UX

### 2. **URL-based State** (Query Params)
- Sharable URLs
- Browser back/forward support
- Bookmarkable results

### 3. **Server-side Filtering**
- Fast database queries
- No client-side processing
- Scalable for large datasets

### 4. **Multiple Filters**
- Combine search + filters
- Independent filter controls
- Clear all filters option

### 5. **Empty State Handling**
- Different messages for filtered vs empty
- Clear filters button when no results
- Call-to-action when truly empty

---

## 🔍 Search Component

### SearchBar Component

```tsx
<SearchBar 
  placeholder="Qidirish..." 
  className="flex-1"
/>
```

#### Features:
- ✅ Debounced input (300ms)
- ✅ URL query param (`?search=value`)
- ✅ Clear button (X icon)
- ✅ Search icon indicator
- ✅ Preserves other filters

#### Implementation:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Debounced search with URL params
useEffect(() => {
  const timer = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, 300)
  
  return () => clearTimeout(timer)
}, [searchValue])
```

---

## 🎛️ Filter Component

### FilterSelect Component

```tsx
<FilterSelect
  paramName="status"
  options={[
    { label: 'Faol', value: 'ACTIVE' },
    { label: 'Bitirgan', value: 'GRADUATED' },
  ]}
  placeholder="Barcha statuslar"
  className="w-[200px]"
/>
```

#### Features:
- ✅ URL query param (`?paramName=value`)
- ✅ Select dropdown (Radix UI)
- ✅ "All" option to clear filter
- ✅ Preserves other filters
- ✅ Current value from URL

#### Usage:
```tsx
// Status filter
<FilterSelect
  paramName="status"
  options={statusOptions}
  placeholder="Barcha statuslar"
/>

// Class filter
<FilterSelect
  paramName="classId"
  options={classOptions}
  placeholder="Barcha sinflar"
/>

// Grade level filter
<FilterSelect
  paramName="gradeLevel"
  options={gradeOptions}
  placeholder="Barcha darajalar"
/>
```

---

## 🧹 Clear Filters

### ClearFilters Component

```tsx
<ClearFilters />
```

#### Features:
- ✅ Auto-hide if no filters
- ✅ Clears all query params
- ✅ Returns to base URL
- ✅ "X" icon + text

#### Implementation:
```tsx
const hasFilters = searchParams.toString().length > 0

if (!hasFilters) return null

const handleClear = () => {
  router.push(pathname) // Remove all query params
}
```

---

## 📊 Implementation Examples

### 1. Students Page

#### Filters:
- **Search**: studentCode, fullName
- **Status**: ACTIVE, GRADUATED, EXPELLED
- **Class**: All classes (dynamic from DB)

#### Server-side Query:
```typescript
const whereClause: any = { tenantId }

// Search
if (searchParams.search) {
  whereClause.OR = [
    { studentCode: { contains: searchParams.search, mode: 'insensitive' } },
    { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } },
  ]
}

// Status filter
if (searchParams.status) {
  whereClause.status = searchParams.status
}

// Class filter
if (searchParams.classId) {
  whereClause.classId = searchParams.classId
}

const students = await db.student.findMany({ where: whereClause })
```

#### UI Layout:
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex flex-col gap-4 md:flex-row">
      <SearchBar placeholder="..." className="flex-1" />
      <FilterSelect paramName="status" options={...} />
      <FilterSelect paramName="classId" options={...} />
      <ClearFilters />
    </div>
  </CardContent>
</Card>
```

---

### 2. Teachers Page

#### Filters:
- **Search**: teacherCode, fullName, email, specialization

#### Server-side Query:
```typescript
if (searchParams.search) {
  whereClause.OR = [
    { teacherCode: { contains: searchParams.search, mode: 'insensitive' } },
    { specialization: { contains: searchParams.search, mode: 'insensitive' } },
    { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } },
    { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
  ]
}
```

---

### 3. Classes Page

#### Filters:
- **Search**: name, roomNumber
- **Grade Level**: 1-11

#### Server-side Query:
```typescript
if (searchParams.search) {
  whereClause.OR = [
    { name: { contains: searchParams.search, mode: 'insensitive' } },
    { roomNumber: { contains: searchParams.search, mode: 'insensitive' } },
  ]
}

if (searchParams.gradeLevel) {
  whereClause.gradeLevel = parseInt(searchParams.gradeLevel)
}
```

---

### 4. Payments Page

#### Filters:
- **Search**: invoiceNumber, receiptNumber, studentCode, studentName
- **Status**: COMPLETED, PENDING, FAILED, REFUNDED
- **Type**: TUITION, BOOKS, UNIFORM, OTHER

#### Server-side Query:
```typescript
if (searchParams.search) {
  whereClause.OR = [
    { invoiceNumber: { contains: searchParams.search, mode: 'insensitive' } },
    { receiptNumber: { contains: searchParams.search, mode: 'insensitive' } },
    { student: { studentCode: { contains: searchParams.search, mode: 'insensitive' } } },
    { student: { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } } },
  ]
}

if (searchParams.status) {
  whereClause.status = searchParams.status
}

if (searchParams.paymentType) {
  whereClause.paymentType = searchParams.paymentType
}
```

---

## 🎨 UI Patterns

### Responsive Layout
```tsx
<div className="flex flex-col gap-4 md:flex-row">
  <SearchBar className="flex-1" />           {/* Full width on mobile, flex-1 on desktop */}
  <FilterSelect className="w-full md:w-[200px]" />  {/* Full width on mobile, fixed on desktop */}
  <ClearFilters />
</div>
```

### Empty States
```tsx
{items.length === 0 && (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-medium text-muted-foreground mb-2">
        {hasFilters
          ? 'Hech narsa topilmadi'       // With filters
          : 'Hozircha ... yo\'q'}         // Truly empty
      </p>
      {hasFilters && <ClearFilters />}
      {!hasFilters && <Button>Add New</Button>}
    </CardContent>
  </Card>
)}
```

### Statistics Update
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">{items.length}</div>
    <p className="text-sm text-muted-foreground">
      {hasFilters ? 'Topilgan natijalar' : 'Jami ...'}
    </p>
  </CardContent>
</Card>
```

---

## 🔧 Technical Details

### URL Query Parameters

```
Base URL: /admin/students

With search:
/admin/students?search=ali

With filters:
/admin/students?status=ACTIVE

Combined:
/admin/students?search=ali&status=ACTIVE&classId=123

Clear all:
/admin/students
```

### Prisma Query Patterns

#### Case-insensitive Search
```typescript
{ contains: searchValue, mode: 'insensitive' }
```

#### Multiple OR Conditions
```typescript
whereClause.OR = [
  { field1: { contains: search } },
  { field2: { contains: search } },
  { relation: { field: { contains: search } } },
]
```

#### Exact Match Filter
```typescript
whereClause.status = filterValue
```

#### Numeric Filter
```typescript
whereClause.gradeLevel = parseInt(filterValue)
```

---

## 🚀 Performance

### Optimization Strategies:

1. **Debouncing** (300ms)
   - Reduces API calls
   - Smooth typing experience
   - Cancels previous timer

2. **Server-side Filtering**
   - Fast database queries
   - Indexed columns
   - Only fetch needed data

3. **Limit Results** (optional)
   ```typescript
   take: 100  // Payments page
   ```

4. **Selective Includes**
   ```typescript
   include: {
     user: { select: { fullName: true } }  // Only needed fields
   }
   ```

---

## 📋 Search Fields Summary

| Page | Search Fields |
|------|--------------|
| **Students** | studentCode, fullName (user) |
| **Teachers** | teacherCode, specialization, fullName (user), email (user) |
| **Classes** | name, roomNumber |
| **Payments** | invoiceNumber, receiptNumber, studentCode, student fullName |

## 🎛️ Filters Summary

| Page | Filters |
|------|---------|
| **Students** | Status (ACTIVE/GRADUATED/EXPELLED), Class (dynamic) |
| **Teachers** | - |
| **Classes** | Grade Level (1-11) |
| **Payments** | Status (COMPLETED/PENDING/FAILED/REFUNDED), Type (TUITION/BOOKS/UNIFORM/OTHER) |

---

## 🧪 Testing Scenarios

### Test Cases:

#### 1. Search Functionality
```
- Type in search box
- Wait 300ms
- Check URL updated (?search=value)
- Check results filtered
- Clear search
- Check URL cleared
- Check all results shown
```

#### 2. Filter Functionality
```
- Select filter option
- Check URL updated (?filter=value)
- Check results filtered
- Select "All"
- Check filter cleared from URL
- Check all results shown
```

#### 3. Combined Search + Filter
```
- Search for "Ali"
- Filter by "ACTIVE"
- Check URL: ?search=ali&status=ACTIVE
- Check results match both criteria
- Clear filters
- Check all cleared
```

#### 4. Empty Results
```
- Search for non-existent value
- Check "Hech narsa topilmadi" message
- Check "Clear filters" button shown
- Click clear
- Check back to all results
```

#### 5. Browser Navigation
```
- Apply filters
- Click browser back
- Check filters removed
- Click browser forward
- Check filters restored
```

---

## 🎯 Best Practices

### 1. Always Preserve Other Params
```typescript
const params = new URLSearchParams(searchParams.toString())
// Don't create new URLSearchParams(), use existing
```

### 2. Use mode: 'insensitive'
```typescript
{ contains: value, mode: 'insensitive' }
// Case-insensitive search
```

### 3. Debounce Search Input
```typescript
const timer = setTimeout(() => {
  // Update URL
}, 300)

return () => clearTimeout(timer)
```

### 4. Handle Empty States
- Different messages for filtered vs empty
- Show clear filters when filtered
- Show "Add new" when truly empty

### 5. Responsive Design
- Stack on mobile (flex-col)
- Row on desktop (md:flex-row)
- Full width inputs on mobile

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Date range filters (from/to)
- [ ] Advanced search (multiple fields selector)
- [ ] Save filter presets
- [ ] Export filtered results
- [ ] Pagination (limit + offset)

### Phase 3
- [ ] Sort by column (asc/desc)
- [ ] Column visibility toggle
- [ ] Bulk actions on filtered results
- [ ] Filter by related entities (e.g., student's parent name)
- [ ] Search suggestions/autocomplete

### Phase 4
- [ ] Full-text search (PostgreSQL tsvector)
- [ ] Fuzzy search (Levenshtein distance)
- [ ] Search highlighting in results
- [ ] Search analytics (popular searches)
- [ ] Saved searches per user

---

## ✅ Summary

### Created:
- ✅ 3 Reusable components (SearchBar, FilterSelect, ClearFilters)
- ✅ 4 Updated list pages with search & filters
- ✅ URL-based state management
- ✅ Debounced search (300ms)
- ✅ Server-side filtering
- ✅ Empty state handling
- ✅ Responsive design
- ✅ Clear all filters

### Key Features:
- **Debounced Search** - Smooth UX, fewer API calls
- **URL Query Params** - Sharable, bookmarkable
- **Server-side** - Fast, scalable
- **Multiple Filters** - Combine search + filters
- **Empty States** - Clear messaging
- **Responsive** - Mobile-friendly
- **Reusable** - DRY components

### Search Capabilities:
| Entity | Searchable Fields | Filters |
|--------|------------------|---------|
| Students | Code, Name | Status, Class |
| Teachers | Code, Name, Email, Specialization | - |
| Classes | Name, Room | Grade Level |
| Payments | Invoice, Receipt, Student | Status, Type |

---

**Yozilgan sana**: 2024-11-26  
**Versiya**: 1.0  
**Holat**: ✅ Search & Filters Complete

