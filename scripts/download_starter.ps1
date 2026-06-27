# Zakladchik Detection - 20GB Starter Pack Download Script
# Usage: .\scripts\download_starter.ps1

$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"

$BASE = "D:\Project\narko-biznes\datasets"

$dirs = @("ucf101", "hmdb51", "ucsd_anomaly", "coco_val",
         "cuhk_avenue", "shanghaitech", "visdrone", "crowdhuman", "kinetics_mini")

foreach ($d in $dirs) {
    $path = Join-Path $BASE $d
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "[+] Created: $path"
    }
}

function Download-File {
    param(
        [string]$Url,
        [string]$OutPath,
        [string]$Name
    )

    if (Test-Path $OutPath) {
        $size = (Get-Item $OutPath).Length / 1MB
        Write-Host "[=] $Name allaqachon mavjud ($([math]::Round($size,1)) MB) - o'tkazib yuborildi" -ForegroundColor Yellow
        return
    }

    Write-Host "[>] Yuklanmoqda: $Name" -ForegroundColor Cyan
    Write-Host "    URL: $Url"
    Write-Host "    Saqlash: $OutPath"

    try {
        Start-BitsTransfer -Source $Url -Destination $OutPath -DisplayName $Name -ErrorAction Stop
        $size = (Get-Item $OutPath).Length / 1MB
        Write-Host "[OK] $Name tayyor ($([math]::Round($size,1)) MB)" -ForegroundColor Green
    }
    catch {
        Write-Host "[!] BITS xato - Invoke-WebRequest bilan urinish" -ForegroundColor Yellow
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
Write-Host "  ZAKLADCHIK DETECTION - STARTER PACK DOWNLOAD" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

# 1. UCSD Anomaly (200 MB)
Download-File `
    -Url "http://www.svcl.ucsd.edu/projects/anomaly/UCSD_Anomaly_Dataset.tar.gz" `
    -OutPath "$BASE\ucsd_anomaly\UCSD_Anomaly_Dataset.tar.gz" `
    -Name "UCSD Anomaly"

# 2. COCO val2017 images (1 GB)
Download-File `
    -Url "http://images.cocodataset.org/zips/val2017.zip" `
    -OutPath "$BASE\coco_val\val2017.zip" `
    -Name "COCO val2017 images"

# 3. COCO annotations (250 MB)
Download-File `
    -Url "http://images.cocodataset.org/annotations/annotations_trainval2017.zip" `
    -OutPath "$BASE\coco_val\annotations_trainval2017.zip" `
    -Name "COCO annotations"

# 4. HMDB-51 videos (2 GB)
Download-File `
    -Url "http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/hmdb51_org.rar" `
    -OutPath "$BASE\hmdb51\hmdb51_org.rar" `
    -Name "HMDB-51 videos"

Download-File `
    -Url "http://serre-lab.clps.brown.edu/wp-content/uploads/2013/10/test_train_splits.rar" `
    -OutPath "$BASE\hmdb51\test_train_splits.rar" `
    -Name "HMDB-51 splits"

# 5. UCF101 (6.5 GB)
$ucfDir = Join-Path $BASE "ucf101"
Download-File `
    -Url "https://www.crcv.ucf.edu/data/UCF101/UCF101.rar" `
    -OutPath (Join-Path $ucfDir "UCF101.rar") `
    -Name "UCF101 videos"

Download-File `
    -Url "https://www.crcv.ucf.edu/data/UCF101/UCF101TrainTestSplits-RecognitionTask.zip" `
    -OutPath (Join-Path $ucfDir "UCF101TrainTestSplits.zip") `
    -Name "UCF101 splits"

# 6. CUHK Avenue (1.5 GB)
Download-File `
    -Url "http://www.cse.cuhk.edu.hk/leojia/projects/detectabnormal/Avenue_Dataset.zip" `
    -OutPath "$BASE\cuhk_avenue\Avenue_Dataset.zip" `
    -Name "CUHK Avenue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  ASOSIY DATASETLAR YAKUNLANDI" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "QO'LDA YUKLAB OLISH KERAK BO'LGANLAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ShanghaiTech Campus (~3 GB):" -ForegroundColor Cyan
Write-Host "    https://github.com/desenzhou/ShanghaiTechDataset"
Write-Host ""
Write-Host "  CrowdHuman (~1.2 GB):" -ForegroundColor Cyan
Write-Host "    https://www.crowdhuman.org/download.html"
Write-Host "    (email orqali bepul registratsiya)"
Write-Host ""
Write-Host "  VisDrone (~2 GB):" -ForegroundColor Cyan
Write-Host "    https://github.com/VisDrone/VisDrone-Dataset"
Write-Host ""
Write-Host "  Kinetics-400 mini:" -ForegroundColor Cyan
Write-Host "    git clone https://github.com/cvdfoundation/kinetics-dataset"
Write-Host "    cd kinetics-dataset; bash k400_downloader.sh"
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
Write-Host "Saqlash joyi: $BASE" -ForegroundColor Green

Write-Host ""
Write-Host "KEYINGI QADAM:" -ForegroundColor Magenta
Write-Host "  1. 7zip o'rnatish: https://www.7-zip.org/"
Write-Host "  2. RAR/ZIP fayllarni ochish"
Write-Host "  3. YOLOv8 + UCF101 da pilot model sinash"
