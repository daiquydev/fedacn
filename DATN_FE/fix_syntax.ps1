$filePath = "src\components\CardComponents\PostCardInfo\PostCardInfo.jsx"
$content = Get-Content $filePath
$content = $content -replace "getImageUrl\(images\[0\}", "getImageUrl(images[0])"
$content | Set-Content $filePath
Write-Host "Fixed syntax errors in PostCardInfo.jsx"
