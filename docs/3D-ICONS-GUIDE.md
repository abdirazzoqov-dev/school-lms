# 3D Icons Integration Guide

This project uses 3D icons from [3dicons.co](https://3dicons.co/) for a modern, professional look.

## 📦 Installation

1. Visit [3dicons.co](https://3dicons.co/)
2. Search for the icons you need
3. Download them as PNG files (recommended: 512x512px)
4. Place them in `public/icons/3d/`

## 🎨 Icons Needed for Teacher Panel

Download these icons and save them with the following names:

### Core Navigation Icons
- `dashboard.png` - Dashboard (Layout Grid)
- `calendar.png` - Dars Jadvali (Calendar)
- `users.png` - Mening Sinflarim (Users/Group)
- `clipboard-check.png` - Davomat (Clipboard with Check)
- `award.png` - Baholar (Award/Trophy)
- `dollar.png` - Maoshim (Dollar Sign/Money)
- `file-text.png` - Shartnomalar (Document/File)
- `book.png` - Dars Materiallari (Open Book)
- `message.png` - Xabarlar (Message/Chat)

## 💻 Usage in Code

```tsx
import { Icon3D } from '@/components/icon-3d'

// Basic usage
<Icon3D name="dashboard" size={48} />

// With custom styling
<Icon3D 
  name="calendar" 
  size={56} 
  className="opacity-80 hover:opacity-100" 
/>
```

## 🎯 Icon Search Terms on 3dicons.co

Use these search terms to find the best matching icons:

- Dashboard → "grid", "layout", "dashboard"
- Calendar → "calendar", "date", "schedule"
- Users → "users", "people", "group", "team"
- Attendance → "clipboard", "check", "checklist"
- Grades → "award", "trophy", "star", "medal"
- Salary → "dollar", "money", "payment", "coin"
- Contracts → "document", "file", "paper", "contract"
- Materials → "book", "education", "learn", "study"
- Messages → "message", "chat", "mail", "notification"

## 📁 File Structure

```
public/
  icons/
    3d/
      dashboard.png
      calendar.png
      users.png
      clipboard-check.png
      award.png
      dollar.png
      file-text.png
      book.png
      message.png
```

## 🎨 Recommended Settings

When downloading from 3dicons.co:

- **Format**: PNG (transparent background)
- **Size**: 512x512px (high quality)
- **Style**: Choose a consistent style across all icons
- **Color**: Can choose colored or monochrome (we can tint in CSS)

## 🚀 Implementation Steps

1. Download icons from 3dicons.co
2. Rename them according to the list above
3. Place in `public/icons/3d/`
4. The `Icon3D` component will automatically load them
5. Update teacher layout to use 3D icons

## 🎨 Color Customization

You can customize icon colors using CSS filters or by downloading different colored versions from 3dicons.co.

## 📝 Notes

- Icons are lazy-loaded for performance
- Hover effects are built-in (scale animation)
- Icons have drop shadows for depth
- All icons maintain aspect ratio
- Optimized for both light and dark themes

