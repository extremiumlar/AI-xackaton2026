# Zakladchik Detection - 5GB Tezkor Starter Pack
# Maqsad: 30-45 daqiqada 5GB dataset yuklab, MVP boshlash
# Usage: .\scripts\download_5gb.ps1

$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"

$BASE = "D:\Project\narko-biznes\datasets"

$dirs = @("coco_val", "hmdb51", "cuhk_avenue", "ucsd_anomaly")
foreach ($d in $dirs) {
    $path = Join-Path $BASE $d
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "[+] Yaratildi: $path"
    }
}

function Download-File {
    param(
        [string]$Url,
        [string]$OutPath,
        [string]$Name,
        [string]$ExpectedSize
    )

    if (Test-Path $OutPath) {
        $size = (Get-Item $OutPath).Length / 1MB
        Write-Host "[=] $Name allaqachon mavjud ($([math]::Round($size,1)) MB)" -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "[>] $Name ($ExpectedSize)" -ForegroundColor Cyan
    Write-Host "    URL: $Url"

    $start = Get-Date
    try {
        Start-BitsTransfer -Source $Url -Destination $OutPath -DisplayName $Name -ErrorAction Stop
        $elapsed = (Get-Date) - $start
        $size = (Get-Item $OutPath).Length / 1MB
        Write-Host "[OK] $Name tayyor ($([math]::Round($size,1)) MB, $([math]::Round($elapsed.TotalSeconds,0))s)" -ForegroundColor Green
    }
    catch {
        Write-Host "[!] BITS xato - WebRequest bilan urinish" -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $Url -OutFile $OutPath -UseBasicParsing
            Write-Host "[OK] $Name tayyor" -ForegroundColor Green
        }
        catch {
            Write-Host "[X] $Name yuklanmadi: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  ZAKLADCHIK DETECTION - 5GB MVP STARTER" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

# 1. UCSD Anomaly (200 MB) - eng kichik, eng tez
Download-File `
    -Url "http://www.svcl.ucsd.edu/projects/anomaly/UCSD_Anomaly_Dataset.tar.gz" `
    -OutPath "$BASE\ucsd_anomaly\UCSD_Anomaly_Dataset.tar.gz" `
    -Name "UCSD Anomaly" `
    -ExpectedSize "200 MB"

# 2. COCO val2017 images (1 GB)
Download-File `
    -Url "http://images.cocodataset.org/zips/val2017.zip" `
    -OutPath "$BASE\coco_val\val2017.zip" `
    -Name "COCO val2017 images" `
    -ExpectedSize "1 GB"

# 3. COCO annotations (250 MB)
Download-File `
    -Url "http://images.cocodataset.org/annotations/annotations_trainval2017.zip" `
    -OutPath "$BASE\coco_val\annotations_trainval2017.zip" `
    -Name "COCO annotations" `
    -ExpectedSize "250 MB"

# 4. HMDB-51 (2 GB)
Download-File `
    -Url "http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/hmdb51_org.rar" `
    -OutPath "$BASE\hmdb51\hmdb51_org.rar" `
    -Name "HMDB-51 videos" `
    -ExpectedSize "2 GB"

Download-File `
    -Url "http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/test_train_splits.rar" `
    -OutPath "$BASE\hmdb51\test_train_splits.rar" `
    -Name "HMDB-51 splits" `
    -ExpectedSize "30 KB"

# 5. CUHK Avenue (1.5 GB)
Download-File `
    -Url "http://www.cse.cuhk.edu.hk/leojia/projects/detectabnormal/Avenue_Dataset.zip" `
    -OutPath "$BASE\cuhk_avenue\Avenue_Dataset.zip" `
    -Name "CUHK Avenue" `
    -ExpectedSize "1.5 GB"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  YAKUNIY HISOBOT" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$total = 0
if (Test-Path $BASE) {
    Get-ChildItem -Path $BASE -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $total += $_.Length
    }
}
$totalGB = [math]::Round($total / 1GB, 2)
Write-Host "Jami yuklangan: $totalGB GB" -ForegroundColor Green
Write-Host "Joy: $BASE" -ForegroundColor Green

Write-Host ""
Write-Host "KEYINGI QADAMLAR:" -ForegroundColor Magenta
Write-Host "  1. 7-Zip o'rnatish: https://www.7-zip.org/"
Write-Host "     (HMDB-51 RAR formatda)"
Write-Host "  2. Fayllarni ochish:"
Write-Host "     - val2017.zip      -> Expand-Archive bilan"
Write-Host "     - annotations.zip  -> Expand-Archive bilan"
Write-Host "     - *.tar.gz         -> 7-Zip bilan"
Write-Host "     - *.rar            -> 7-Zip bilan"
Write-Host "  3. YOLOv8 o'rnatish: pip install ultralytics"
Write-Host "  4. Birinchi sinov: yolo predict model=yolov8n.pt source=coco_val/val2017"
