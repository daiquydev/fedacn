# Luôn dùng XeLaTeX: main.tex có \usepackage{fontspec}.
$pdf_mode = 5;
$xelatex = 'xelatex -shell-escape -interaction=nonstopmode -file-line-error -synctex=1 %O %S';

# Tối ưu vòng lặp compile cho lúc viết báo cáo.
$max_repeat = 5;
$recorder = 1;
$silent = 1;
