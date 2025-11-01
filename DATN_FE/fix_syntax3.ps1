$filePath = "src\components\CardComponents\PostCardInfo\PostCardInfo.jsx"
$content = Get-Content $filePath
$content = $content | Where-Object { $_ -notmatch "src=\{getImageUrl\(images\[0\}" }
$content | Set-Content $filePath
Write-Host "Removed problematic comment lines in PostCardInfo.jsx"
