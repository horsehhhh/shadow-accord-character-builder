# PowerShell script to convert JPEG logo to required formats for Electron app
# Run this script from the project root directory

Write-Host "Converting Shadow Accord logo to required formats..." -ForegroundColor Green

# Check if the source JPEG exists
if (-not (Test-Path "shadow accord logo.jpeg")) {
    Write-Host "Error: 'shadow accord logo.jpeg' not found in current directory!" -ForegroundColor Red
    exit 1
}

# Copy the JPEG to public directory with a cleaner name
Copy-Item "shadow accord logo.jpeg" "public/shadow-accord-logo.jpg"
Write-Host "Copied logo to public/shadow-accord-logo.jpg" -ForegroundColor Green

# For Windows ICO conversion, we'll use PowerShell's built-in image handling
try {
    Add-Type -AssemblyName System.Drawing
    
    # Load the original image
    $image = [System.Drawing.Image]::FromFile((Resolve-Path "shadow accord logo.jpeg").Path)
    
    # Create a 256x256 version for ICO (Windows standard)
    $iconBitmap = New-Object System.Drawing.Bitmap(256, 256)
    $graphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($image, 0, 0, 256, 256)
    
    # Save as PNG first (easier conversion path)
    $iconBitmap.Save("public/shadow-accord-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created public/shadow-accord-logo.png (256x256)" -ForegroundColor Green
    
    # Clean up
    $graphics.Dispose()
    $iconBitmap.Dispose()
    $image.Dispose()
    
    Write-Host "Logo conversion completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Convert public/shadow-accord-logo.png to .ico format using an online converter"
    Write-Host "   Recommended: https://convertio.co/png-ico/ or https://icoconvert.com/"
    Write-Host "2. Save the ICO file as public/shadow-accord-logo.ico"
    Write-Host "3. For Mac builds, convert to .icns format and save as public/shadow-accord-logo.icns"
    Write-Host "4. Run 'npm run dist' to build with your new logo"
    
} catch {
    Write-Host "Error during image conversion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual conversion steps:" -ForegroundColor Yellow
    Write-Host "1. Open shadow accord logo.jpeg in an image editor"
    Write-Host "2. Resize to 256x256 pixels (keeping aspect ratio)"
    Write-Host "3. Save as public/shadow-accord-logo.png"
    Write-Host "4. Convert PNG to ICO using online converter"
    Write-Host "5. Save ICO as public/shadow-accord-logo.ico"
}
}
