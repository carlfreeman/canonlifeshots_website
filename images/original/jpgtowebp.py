from PIL import Image
import os
import argparse

def convert_jpg_to_webp(input_path, output_path=None, quality=80):
    """
    Convert a JPEG image to WebP format.
    
    Args:
        input_path (str): Path to the input JPEG file.
        output_path (str, optional): Path to save the WebP file. If None, replaces extension.
        quality (int, optional): Quality of the output WebP (1-100). Defaults to 80.
    """
    try:
        # Open the image file
        with Image.open(input_path) as img:
            # If output path not specified, create one by replacing the extension
            if output_path is None:
                output_path = os.path.splitext(input_path)[0] + '.webp'
            
            # Save as WebP
            img.save(output_path, 'WEBP', quality=quality)
            
            print(f"Successfully converted {input_path} to {output_path}")
            return True
    
    except Exception as e:
        print(f"Error converting {input_path}: {str(e)}")
        return False

def batch_convert(input_dir, output_dir=None, quality=80):
    """
    Convert all JPEG files in a directory to WebP format.
    
    Args:
        input_dir (str): Directory containing JPEG files.
        output_dir (str, optional): Directory to save WebP files. If None, uses input_dir.
        quality (int, optional): Quality of the output WebP (1-100). Defaults to 80.
    """
    if output_dir is None:
        output_dir = input_dir
    elif not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    converted_count = 0
    
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.jpg', '.jpeg')):
            input_path = os.path.join(input_dir, filename)
            output_filename = os.path.splitext(filename)[0] + '.webp'
            output_path = os.path.join(output_dir, output_filename)
            
            if convert_jpg_to_webp(input_path, output_path, quality):
                converted_count += 1
    
    print(f"\nConversion complete. Converted {converted_count} files.")

def main():
    parser = argparse.ArgumentParser(description='Convert JPEG images to WebP format.')
    parser.add_argument('input', help='Input JPEG file or directory')
    parser.add_argument('-o', '--output', help='Output file or directory (optional)')
    parser.add_argument('-q', '--quality', type=int, default=80, 
                        help='Quality of WebP output (1-100, default: 80)')
    
    args = parser.parse_args()
    
    if os.path.isfile(args.input):
        convert_jpg_to_webp(args.input, args.output, args.quality)
    elif os.path.isdir(args.input):
        batch_convert(args.input, args.output, args.quality)
    else:
        print(f"Error: {args.input} is not a valid file or directory.")

if __name__ == '__main__':
    main()