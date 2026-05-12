# Luôn dùng XeLaTeX: main.tex có \usepackage{fontspec}.
# .latexmkrc là Perl: dòng bắt đầu bằng # là comment.

use Cwd qw(abs_path);

# Minted v3 / latexminted (MiKTeX): thư mục đầu ra TeX. Ưu tiên biến môi trường (IDE / .latexmkrc gốc repo).
# Không dùng __FILE__ — latexmk eval rc khiến __FILE__ không ổn định.
$ENV{TEXMF_OUTPUT_DIRECTORY} //= abs_path('.');

# MiKTeX trả exit code 1 khi còn ref/cite — với -pvc phải có -f mới chạy đủ vòng lặp.
BEGIN {
    if ( (grep { $_ eq '-pvc' || $_ eq '-pv' } @ARGV) && !grep { $_ eq '-f' } @ARGV ) {
        push @ARGV, '-f';
    }
}

$pdf_mode = 5;

# Windows: ép TEXMF_OUTPUT_DIRECTORY vào cmd (đồng bộ với latexminted).
# -synctex=0: tránh lỗi "Can't rename main.synctex(busy)" khi trình đọc PDF đang mở file.
my $_tmf = $ENV{TEXMF_OUTPUT_DIRECTORY};
if ( $^O eq 'MSWin32' ) {
    $_tmf =~ s/"/\\"/g;
    $xelatex = qq{cmd /c "set \"TEXMF_OUTPUT_DIRECTORY=$_tmf\" && xelatex -shell-escape -interaction=nonstopmode -file-line-error -synctex=0 %O %S"};
} else {
    $xelatex = 'xelatex -shell-escape -interaction=nonstopmode -file-line-error -synctex=0 %O %S';
}

$max_repeat = 10;
$recorder = 1;
$silent = 1;

# Tiếp tục build dù lần trước báo cảnh báo (tương đương -f).
$force_mode = 1;
