#!/usr/bin/env node

/**
 * Download 3D icons from 3dicons.co
 * 
 * This script helps download icons we need for the teacher panel
 */

const icons = [
  { name: 'dashboard', url: 'https://cdn.3dicons.io/v1/icons/layout-dashboard/1c1c1c/optimized.png' },
  { name: 'calendar', url: 'https://cdn.3dicons.io/v1/icons/calendar/1c1c1c/optimized.png' },
  { name: 'users', url: 'https://cdn.3dicons.io/v1/icons/users/1c1c1c/optimized.png' },
  { name: 'clipboard-check', url: 'https://cdn.3dicons.io/v1/icons/clipboard-check/1c1c1c/optimized.png' },
  { name: 'award', url: 'https://cdn.3dicons.io/v1/icons/award/1c1c1c/optimized.png' },
  { name: 'dollar', url: 'https://cdn.3dicons.io/v1/icons/dollar-sign/1c1c1c/optimized.png' },
  { name: 'file-text', url: 'https://cdn.3dicons.io/v1/icons/file-text/1c1c1c/optimized.png' },
  { name: 'book', url: 'https://cdn.3dicons.io/v1/icons/book-open/1c1c1c/optimized.png' },
  { name: 'message', url: 'https://cdn.3dicons.io/v1/icons/message-square/1c1c1c/optimized.png' },
]

console.log('📦 3D Icons to download:')
console.log('========================')
icons.forEach((icon, i) => {
  console.log(`${i + 1}. ${icon.name}`)
  console.log(`   URL: ${icon.url}`)
})

console.log('\n✅ Download these icons manually from 3dicons.co:')
console.log('   https://3dicons.co/')
console.log('\n📁 Save them to: public/icons/3d/')
console.log('\nIcon names needed:')
icons.forEach(icon => {
  console.log(`   - ${icon.name}.png`)
})

console.log('\n💡 Tip: Search for icons on 3dicons.co and download as PNG')
console.log('   Recommended size: 256x256px or 512x512px')

