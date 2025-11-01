$filePath = "src\components\CardComponents\PostCardInfo\PostCardInfo.jsx"
$content = Get-Content $filePath
$content = $content -replace "src=\{getImageUrl\(images\[0\}", "src={getImageUrl(images[0])}"
$content | Set-Content $filePath
Write-Host "Fixed remaining syntax errors in PostCardInfo.jsx"
