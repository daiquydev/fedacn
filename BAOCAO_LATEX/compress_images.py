import os
import sys
from PIL import Image

# Set output encoding to UTF-8 for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def compress_images(directory, max_width=1200, quality=80):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(root, file)
                try:
                    original_size = os.path.getsize(file_path)
                    
                    # Only process if file is larger than 500KB
                    if original_size < 500 * 1024:
                        continue

                    with Image.open(file_path) as img:
                        # Convert RGBA to RGB for JPEG compatibility if needed
                        if img.mode in ("RGBA", "P"):
                            # For PNG, we can't easily do lossy compression without external tools
                            # but we can resize and optimize
                            pass
                        
                        # Resize if too large
                        if img.width > max_width:
                            w_percent = (max_width / float(img.width))
                            h_size = int((float(img.height) * float(w_percent)))
                            img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
                        
                        # Save back
                        if file.lower().endswith('.png'):
                            # Use optimize=True and bits=8 if possible, or just optimize
                            img.save(file_path, "PNG", optimize=True)
                        else:
                            img.save(file_path, "JPEG", quality=quality, optimize=True)
                        
                    new_size = os.path.getsize(file_path)
                    # Use a safe print
                    try:
                        print(f"Compressed: {file} | {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                    except:
                        print(f"Compressed a file | {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                except Exception as e:
                    pass

if __name__ == "__main__":
    target_dir = r"c:\DATN\fedacn\BAOCAO_LATEX\Images"
    compress_images(target_dir)
