param (
    [string]$TesseractPath,
    [string]$ImagePath,
    [string]$OutBase
)

# Native PowerShell call to Tesseract
# We use & to call the executable and pass arguments normally
try {
    & $TesseractPath $ImagePath $OutBase -l eng
    exit 0
} catch {
    exit 1
}
