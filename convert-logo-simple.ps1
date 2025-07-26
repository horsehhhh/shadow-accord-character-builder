# Simple logo conversion script
# Copy the JPEG to public directory and create a basic ICO

$sourceFile = "shadow accord logo.jpeg"
$publicDir = "public"

# Copy JPEG to public directory
Copy-Item $sourceFile "$publicDir\shadow-accord-logo.jpeg"

# Also copy as PNG for web usage
Copy-Item $sourceFile "$publicDir\shadow-accord-logo.png"

Write-Host "Copied logo files to public directory"
Write-Host "Please use an online converter like convertio.co to convert the JPEG to ICO format"
Write-Host "Then save it as: public\shadow-accord-logo.ico"
