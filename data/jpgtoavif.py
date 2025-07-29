import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

# Конфигурация
AVIFENC_PATH = "avifenc"  # или полный путь к avifenc/cavif
QUALITY = 50  # Качество (1-100)
SPEED = 5  # Скорость кодирования (0-10, где 0 - самое медленное и лучшее качество)
THREADS = os.cpu_count()  # Количество потоков для обработки

def convert_to_avif(input_path, output_dir=None):
    """Конвертирует JPG в AVIF"""
    try:
        # Формируем выходной путь
        filename = os.path.basename(input_path)
        name_without_ext = os.path.splitext(filename)[0]
        output_path = os.path.join(output_dir or os.path.dirname(input_path), 
                                 f"{name_without_ext}.avif")
        
        # Команда конвертации
        cmd = [
            AVIFENC_PATH,
            "-q", str(QUALITY),
            "-s", str(SPEED),
            "-j", str(THREADS),
            "--yuv", "420",  # Формат цветности
            input_path,
            output_path
        ]
        
        # Выполняем конвертацию
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"Успешно: {filename} -> {name_without_ext}.avif")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Ошибка при конвертации {filename}: {e.stderr}")
        return False
    except Exception as e:
        print(f"Неожиданная ошибка с {filename}: {str(e)}")
        return False

def batch_convert(input_path):
    """Пакетная конвертация"""
    if os.path.isfile(input_path) and input_path.lower().endswith(('.jpg', '.jpeg')):
        convert_to_avif(input_path)
    elif os.path.isdir(input_path):
        jpg_files = [
            os.path.join(input_path, f) 
            for f in os.listdir(input_path) 
            if f.lower().endswith(('.jpg', '.jpeg'))
        ]
        
        print(f"Найдено {len(jpg_files)} JPG файлов для конвертации...")
        
        # Многопоточная обработка
        with ThreadPoolExecutor(max_workers=THREADS) as executor:
            executor.map(convert_to_avif, jpg_files)
    else:
        print("Указан неверный путь или файл не JPG")

if __name__ == "__main__":
    print("=== JPG to AVIF Converter ===")
    print(f"Качество: {QUALITY}, Скорость: {SPEED}, Потоков: {THREADS}")
    
    path = input("Введите путь к файлу или папке с JPG: ").strip('"')
    batch_convert(path)
    
    print("Конвертация завершена!")
    input("Нажмите Enter для выхода...")