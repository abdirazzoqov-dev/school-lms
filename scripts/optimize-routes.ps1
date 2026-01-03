# PowerShell script to optimize all route pages
# This script replaces 'force-dynamic' with 'auto' and optimizes revalidate times

$files = Get-ChildItem -Path "app\(dashboard)" -Recurse -Filter "page.tsx" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "force-dynamic"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace force-dynamic with auto
    $content = $content -replace "export const dynamic = 'force-dynamic'", "export const dynamic = 'auto' // Optimized for better caching"
    
    # Optimize revalidate = 0 to revalidate = 30
    $content = $content -replace "export const revalidate = 0", "export const revalidate = 30 // Optimized for faster loads"
    
    # Only write if changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Optimized: $($file.FullName)"
    }
}

Write-Host "`nDone! Optimized $($files.Count) files."

