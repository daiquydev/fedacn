$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'Che do watch: luu file .tex (Ctrl+S) de cap nhat PDF, Ctrl+C de dung.' -ForegroundColor Cyan
Write-Host 'Khuyen nghi: mo main.pdf bang SumatraPDF/VS Code PDF de tu dong reload khi file thay doi.' -ForegroundColor Yellow
Write-Host 'Neu doi cau truc lon (muc luc/reference), can 1-2 lan build them de on dinh lien ket.' -ForegroundColor DarkYellow

# -f: tiep tuc watch ngay ca khi co loi tam thoi trong .tex
# Khong dung -g de tranh full rebuild moi lan.
latexmk -xelatex -pvc -f -interaction=nonstopmode main.tex
