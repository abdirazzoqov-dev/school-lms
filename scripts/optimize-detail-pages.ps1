# PowerShell script to optimize all detail pages ([id] pages)
# This script adds revalidate and dynamic configs to pages that don't have them

$detailPages = Get-ChildItem -Path "app\(dashboard)" -Recurse -Filter "page.tsx" | Where-Object { 
    $_.DirectoryName -match '\[id\]' 
}

foreach ($file in $detailPages) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Check if page already has revalidate/dynamic config
    $hasConfig = $content -match "export const (revalidate|dynamic)"
    
    if (-not $hasConfig) {
        # Find the first import statement or export statement
        # Add config after imports, before the component
        $lines = Get-Content $file.FullName
        $newLines = @()
        $inserted = $false
        
        foreach ($line in $lines) {
            $newLines += $line
            
            # Insert after the last import or after interface/type definitions
            if (-not $inserted -and 
                ($line -match "^import " -or $line -match "^interface " -or $line -match "^type ") -and
                ($lines[$lines.IndexOf($line) + 1] -notmatch "^import " -and 
                 $lines[$lines.IndexOf($line) + 1] -notmatch "^interface " -and
                 $lines[$lines.IndexOf($line) + 1] -notmatch "^type " -and
                 $lines[$lines.IndexOf($line) + 1] -notmatch "^export ")) {
                
                # Skip if next line is export const
                $nextLineIndex = $lines.IndexOf($line) + 1
                if ($nextLineIndex -lt $lines.Count -and $lines[$nextLineIndex] -notmatch "^export const (revalidate|dynamic)") {
                    $newLines += ""
                    $newLines += "// Optimized caching: Cache for 30 seconds for detail pages ⚡"
                    $newLines += "export const revalidate = 30"
                    $newLines += "export const dynamic = 'auto' // Allows Next.js to optimize route caching"
                    $inserted = $true
                }
            }
            
            # Insert before export default
            if (-not $inserted -and $line -match "^export default") {
                $newLines = $newLines[0..($newLines.Count-2)]
                $newLines += ""
                $newLines += "// Optimized caching: Cache for 30 seconds for detail pages ⚡"
                $newLines += "export const revalidate = 30"
                $newLines += "export const dynamic = 'auto' // Allows Next.js to optimize route caching"
                $newLines += ""
                $newLines += $line
                $inserted = $true
            }
        }
        
        if ($inserted) {
            $newContent = $newLines -join "`n"
            # Fix line endings
            $newContent = $newContent -replace "`r`n", "`n"
            $newContent = $newContent -replace "`n", "`r`n"
            
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "Optimized: $($file.Name)"
        }
    } else {
        Write-Host "Skipped (already has config): $($file.Name)"
    }
}

Write-Host "`nDone! Optimized detail pages."

