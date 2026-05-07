# Tab Audio Switcher - Build Script
# Packages the extension into release.zip for Chrome Web Store upload.

$OutputFile = "release.zip"
$FilesToInclude = @(
    "manifest.json",
    "popup.html",
    "popup.js",
    "content.js",
    "icons\icon16.png",
    "icons\icon32.png",
    "icons\icon48.png",
    "icons\icon128.png"
)

# Remove old zip if it exists
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile -Force
    Write-Host "Removed old $OutputFile"
}

# Create zip using .NET
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = (Join-Path (Resolve-Path ".").Path $OutputFile)
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

foreach ($file in $FilesToInclude) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $file, 'Optimal') | Out-Null
        Write-Host "  Added: $file"
    } else {
        Write-Warning "  Not found: $file"
    }
}

$zip.Dispose()
$size = [math]::Round((Get-Item $OutputFile).Length / 1KB, 1)
Write-Host ""
Write-Host "SUCCESS: Built $OutputFile ($size KB) - ready to upload to Chrome Web Store!" -ForegroundColor Green
