$SourceDir = "D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf"
$TargetDir = "D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md"
$KeyIdx = 0

Get-ChildItem -Path $SourceDir -Filter *.pdf | ForEach-Object {
    $PdfName = $_.Name
    $MdName = [io.path]::ChangeExtension($PdfName, ".md")
    $TargetPath = Join-Path $TargetDir $MdName
    
    $Process = $true
    if (Test-Path $TargetPath) {
        $Size = (Get-Item $TargetPath).Length
        if ($Size -ge 1500) {
            try {
                $Content = Get-Content $TargetPath -Raw -ErrorAction SilentlyContinue
                if ($Content -and (-not $Content.Contains("[OCR ERROR:"))) {
                    $Process = $false
                }
            } catch {
                $Process = $true
            }
        }
    }
    
    if ($Process) {
        Write-Output "📄 Starting: $PdfName (Key $KeyIdx)"
        $Start = Start-Process -FilePath "python" -ArgumentList "ocr_engine.py `"$($_.FullName)`" `"$TargetPath`" $KeyIdx" -PassThru -NoNewWindow
        
        # Hard Timeout: 15 minutes (900 seconds)
        $HasExited = $Start.WaitForExit(900000)
        
        if (-not $HasExited) {
            Write-Output "⏰ Timeout on $PdfName. Forcefully Terminating..."
            Stop-Process -Id $Start.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 10
        } else {
            if ($Start.ExitCode -eq 0) {
                Write-Output "✅ Success: $PdfName"
                $KeyIdx++
            } else {
                Write-Output "❌ Error Exit Code $($Start.ExitCode) for $PdfName"
            }
        }
        
        Write-Output "⏸️ Cooling down for 120s..."
        Start-Sleep -Seconds 120
    } else {
        Write-Output "⏩ Already Valid: $PdfName"
    }
}

Write-Output "🏁 Resilient Watchdog Recovery Complete."
