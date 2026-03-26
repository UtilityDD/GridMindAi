$baseDir = "D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind"
$outputDir = Join-Path $baseDir "OCRs_PENDING"
$auditLog = "d:\Dipankar\MyCodes\AI Projects\GridMindAi\scripts\ocr_full_audit.txt"
$tesseract = "tesseract"

if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir }

Write-Host "🚀 Starting Native PowerShell OCR Batch..."

$missingFiles = Get-Content $auditLog | Where-Object { $_ -like "*MISSING*" } | ForEach-Object { $_.Split("|")[0].Trim() }

foreach ($relPath in $missingFiles) {
    $fullPath = Join-Path $baseDir $relPath
    $outName = ($relPath -replace '[^a-zA-Z0-9]', '_') + ".md"
    $outPath = Join-Path $outputDir $outName

    Write-Host "Processing: $relPath"
    
    # 1. Use Python to dump pages to PNGs (Isolated)
    $tmpImgBase = Join-Path $outputDir "tmp_page"
    python -c "import fitz; doc=fitz.open(r'$fullPath'); [p.get_pixmap(matrix=fitz.Matrix(2,2)).save(fr'$tmpImgBase`_$i.png') for i,p in enumerate(doc)]; doc.close()"
    
    # 2. OCR each PNG
    $mdContent = ""
    $images = Get-ChildItem -Path $outputDir -Filter "tmp_page_*.png" | Sort-Object Name
    foreach ($img in $images) {
        $imgOutBase = $img.FullName.Replace(".png", "_out")
        $imgOutFile = $imgOutBase + ".txt"
        
        # Native call
        & $tesseract $img.FullName $imgOutBase -l eng
        
        if (Test-Path $imgOutFile) {
            $txt = Get-Content $imgOutFile -Raw
            $pageNum = ($img.Name -replace 'tmp_page_', '' -replace '\.png', '') + 1
            $mdContent += "## Page $pageNum`n`n$txt`n"
            Remove-Item $imgOutFile
        }
        Remove-Item $img.FullName
    }
    
    if ($mdContent) {
        $mdContent | Out-File -FilePath $outPath -Encoding utf8
        Write-Host "✅ Reconstructed: $outName"
    }
}
Write-Host "Batch Complete! 🏁"
