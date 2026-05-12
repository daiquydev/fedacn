# Khi gọi latexmk từ thư mục repo gốc (fedacn): đặt TEXMF_OUTPUT_DIRECTORY trước khi nạp BAOCAO_LATEX/.latexmkrc
use Cwd qw(abs_path);
use File::Spec;

my $_tex = abs_path('BAOCAO_LATEX');
if ( -f File::Spec->catfile( $_tex, 'main.tex' ) ) {
    $ENV{TEXMF_OUTPUT_DIRECTORY} = $_tex;
}

do './BAOCAO_LATEX/.latexmkrc' if -f './BAOCAO_LATEX/.latexmkrc';
