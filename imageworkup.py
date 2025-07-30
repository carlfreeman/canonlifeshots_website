import os
import json
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image
import threading
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

class ImageConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Tools")
        self.root.geometry("800x600")
        
        # Проверка наличия avifenc
        self.avifenc_path = self.find_avifenc()
        if not self.avifenc_path:
            messagebox.showwarning(
                "AVIF Support",
                "AVIF conversion requires avifenc/cavif.\n\n"
                "Please install libavif (https://github.com/AOMediaCodec/libavif)"
            )
        
        # Categories data
        self.categories = {
            'best': 'Лучшее',
            'street': 'Стрит',
            'concept': 'Концепт',
            'mono': 'Моно-ЧБ',
            'experiments': 'Эксперименты',
            'philosophy': 'Философия'
        }
        
        # Ограничение потоков
        self.max_threads = 4
        
        self.create_main_menu()
    
    def find_avifenc(self):
        """Поиск avifenc в системе"""
        try:
            # Проверяем доступность avifenc в PATH
            subprocess.run(["avifenc", "--version"], 
                         check=True, 
                         stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE)
            return "avifenc"
        except:
            # Проверяем альтернативные пути
            paths = [
                "/usr/bin/avifenc",
                "/usr/local/bin/avifenc",
                "C:\\Program Files\\libavif\\bin\\avifenc.exe"
            ]
            for path in paths:
                if os.path.exists(path):
                    return path
            return None
    
    def create_main_menu(self):
        """Главное меню"""
        self.clear_window()
        
        title_label = ttk.Label(self.root, text="Image Tools", font=("Helvetica", 16))
        title_label.pack(pady=20)
        
        convert_btn = ttk.Button(
            self.root, 
            text="Batch Convert Images", 
            command=self.create_converter_ui
        )
        convert_btn.pack(pady=10, ipadx=20, ipady=10)
        
        json_btn = ttk.Button(
            self.root, 
            text="Add Images to JSON", 
            command=self.create_json_ui
        )
        json_btn.pack(pady=10, ipadx=20, ipady=10)
    
    def create_converter_ui(self):
        """Интерфейс конвертера"""
        self.clear_window()
        
        # Back button
        back_btn = ttk.Button(self.root, text="← Back", command=self.create_main_menu)
        back_btn.pack(anchor="nw", padx=10, pady=10)
        
        title_label = ttk.Label(self.root, text="Image Converter", font=("Helvetica", 14))
        title_label.pack(pady=10)
        
        # Input folder
        ttk.Label(self.root, text="Input Folder:").pack(pady=(10, 0))
        self.input_folder = tk.StringVar(value=os.path.abspath("./images/todo"))
        input_frame = ttk.Frame(self.root)
        input_frame.pack()
        ttk.Entry(input_frame, textvariable=self.input_folder, width=50).pack(side="left")
        ttk.Button(input_frame, text="Browse", command=self.browse_input_folder).pack(side="left", padx=5)
        
        # AVIF settings
        ttk.Label(self.root, text="AVIF Settings", font=("Helvetica", 12)).pack(pady=(20, 5))
        
        if not self.avifenc_path:
            ttk.Label(self.root, text="AVIF conversion not available (avifenc not found)", 
                     foreground="red").pack()
        
        ttk.Label(self.root, text="Output Folder:").pack()
        self.avif_folder = tk.StringVar(value=os.path.abspath("./images/todo/optimized"))
        avif_frame = ttk.Frame(self.root)
        avif_frame.pack()
        ttk.Entry(avif_frame, textvariable=self.avif_folder, width=50).pack(side="left")
        ttk.Button(avif_frame, text="Browse", command=lambda: self.browse_output_folder(self.avif_folder)).pack(side="left", padx=5)
        
        ttk.Label(self.root, text="Quality (1-100):").pack()
        self.avif_quality = tk.IntVar(value=80)
        ttk.Scale(self.root, from_=1, to=100, variable=self.avif_quality, orient="horizontal").pack()
        
        ttk.Label(self.root, text="Speed (0-10, slower is better):").pack()
        self.avif_speed = tk.IntVar(value=5)
        ttk.Scale(self.root, from_=0, to=10, variable=self.avif_speed, orient="horizontal").pack()
        
        # WEBP settings
        ttk.Label(self.root, text="WEBP Settings", font=("Helvetica", 12)).pack(pady=(20, 5))
        
        ttk.Label(self.root, text="Output Folder:").pack()
        self.webp_folder = tk.StringVar(value=os.path.abspath("./images/todo/original"))
        webp_frame = ttk.Frame(self.root)
        webp_frame.pack()
        ttk.Entry(webp_frame, textvariable=self.webp_folder, width=50).pack(side="left")
        ttk.Button(webp_frame, text="Browse", command=lambda: self.browse_output_folder(self.webp_folder)).pack(side="left", padx=5)
        
        ttk.Label(self.root, text="Quality (1-100):").pack()
        self.webp_quality = tk.IntVar(value=85)
        ttk.Scale(self.root, from_=1, to=100, variable=self.webp_quality, orient="horizontal").pack()
        
        # Log window
        ttk.Label(self.root, text="Conversion Log", font=("Helvetica", 10)).pack(pady=(20, 5))
        self.log_text = tk.Text(self.root, height=8, state="disabled")
        self.log_text.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # Convert button
        ttk.Button(
            self.root, 
            text="Convert Images", 
            command=self.start_conversion_thread
        ).pack(pady=10, ipadx=20, ipady=5)

    def create_json_ui(self):
        """Create the JSON metadata UI"""
        self.clear_window()
        
        # Back button
        back_btn = ttk.Button(self.root, text="← Back", command=self.create_main_menu)
        back_btn.pack(anchor="nw", padx=10, pady=10)
        
        title_label = ttk.Label(self.root, text="Add Images to JSON", font=("Helvetica", 14))
        title_label.pack(pady=10)
        
        # Input folder
        ttk.Label(self.root, text="Image Folder:").pack(pady=(10, 0))
        self.json_input_folder = tk.StringVar(value="./images/todo")
        input_frame = ttk.Frame(self.root)
        input_frame.pack()
        ttk.Entry(input_frame, textvariable=self.json_input_folder, width=50).pack(side="left")
        ttk.Button(input_frame, text="Browse", command=self.browse_json_input_folder).pack(side="left", padx=5)
        
        # Image selection
        ttk.Label(self.root, text="Select Image:").pack(pady=(20, 5))
        self.image_listbox = tk.Listbox(self.root, height=10)
        self.image_listbox.pack(fill="both", expand=True, padx=10, pady=5)
        self.image_listbox.bind("<<ListboxSelect>>", self.load_image_info)
        
        # Metadata fields
        ttk.Label(self.root, text="Title:").pack(pady=(10, 0))
        self.title_var = tk.StringVar()
        ttk.Entry(self.root, textvariable=self.title_var).pack(fill="x", padx=10)
        
        ttk.Label(self.root, text="Year:").pack(pady=(10, 0))
        self.year_var = tk.StringVar()
        ttk.Entry(self.root, textvariable=self.year_var).pack(fill="x", padx=10)
        
        ttk.Label(self.root, text="Categories (comma-separated indices):").pack(pady=(10, 0))
        self.categories_frame = ttk.Frame(self.root)
        self.categories_frame.pack(fill="x", padx=10)
        
        # Display available categories with indices
        for i, (key, value) in enumerate(self.categories.items()):
            ttk.Label(self.categories_frame, text=f"{i}: {value}").grid(row=i//3, column=i%3, sticky="w", padx=5)
        
        self.categories_indices_var = tk.StringVar()
        ttk.Entry(self.root, textvariable=self.categories_indices_var).pack(fill="x", padx=10)
        
        ttk.Label(self.root, text="Description:").pack(pady=(10, 0))
        self.description_text = tk.Text(self.root, height=5)
        self.description_text.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Save button
        ttk.Button(self.root, text="Save to JSON", command=self.save_to_json).pack(pady=10, ipadx=20, ipady=5)
        
        # Load images in folder
        self.load_images_in_folder()
    
    def browse_input_folder(self):
        folder = filedialog.askdirectory(initialdir=self.input_folder.get())
        if folder:
            self.input_folder.set(folder)
    
    def browse_output_folder(self, folder_var):
        folder = filedialog.askdirectory(initialdir=folder_var.get())
        if folder:
            folder_var.set(folder)
    
    def browse_json_input_folder(self):
        folder = filedialog.askdirectory(initialdir=self.json_input_folder.get())
        if folder:
            self.json_input_folder.set(folder)
            self.load_images_in_folder()
    
    def load_images_in_folder(self):
        """Load all images from the selected folder into the listbox"""
        self.image_listbox.delete(0, tk.END)
        folder = self.json_input_folder.get()
        if os.path.isdir(folder):
            for file in os.listdir(folder):
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif')):
                    self.image_listbox.insert(tk.END, file)
    
    def load_image_info(self, event):
        """Load metadata from existing JSON if available"""
        selection = self.image_listbox.curselection()
        if not selection:
            return
        
        filename = self.image_listbox.get(selection[0])
        file_id = os.path.splitext(filename)[0]
        
        # Clear fields
        self.title_var.set("")
        self.year_var.set("")
        self.categories_indices_var.set("")
        self.description_text.delete("1.0", tk.END)
        
        # Try to load existing data
        json_path = os.path.join(self.json_input_folder.get(), "output.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    for item in data:
                        if item["id"] == file_id:
                            self.title_var.set(item.get("title", ""))
                            self.year_var.set(str(item.get("year", "")))
                            
                            # Convert categories to indices
                            cat_indices = []
                            for cat in item.get("categories", []):
                                for i, key in enumerate(self.categories.keys()):
                                    if key == cat:
                                        cat_indices.append(str(i))
                            self.categories_indices_var.set(",".join(cat_indices))
                            
                            self.description_text.insert("1.0", item.get("description", ""))
                            break
                except json.JSONDecodeError:
                    pass
    
    def save_to_json(self):
        """Save the current image metadata to JSON"""
        selection = self.image_listbox.curselection()
        if not selection:
            messagebox.showerror("Error", "Please select an image first")
            return
        
        filename = self.image_listbox.get(selection[0])
        file_id = os.path.splitext(filename)[0]
        title = self.title_var.get()
        year = self.year_var.get()
        
        if not title or not year:
            messagebox.showerror("Error", "Title and Year are required")
            return
        
        try:
            year = int(year)
        except ValueError:
            messagebox.showerror("Error", "Year must be a number")
            return
        
        # Process categories
        categories = []
        indices_str = self.categories_indices_var.get()
        if indices_str:
            try:
                indices = [int(i.strip()) for i in indices_str.split(",")]
                category_keys = list(self.categories.keys())
                for i in indices:
                    if 0 <= i < len(category_keys):
                        categories.append(category_keys[i])
            except ValueError:
                messagebox.showerror("Error", "Invalid category indices")
                return
        
        description = self.description_text.get("1.0", tk.END).strip()
        
        # Create new entry
        new_entry = {
            "id": file_id,
            "year": year,
            "title": title,
            "categories": categories,
            "description": description
        }
        
        # Save to output.json in the working folder
        output_path = os.path.join(self.json_input_folder.get(), "output.json")
        existing_data = []
        
        if os.path.exists(output_path):
            with open(output_path, "r", encoding="utf-8") as f:
                try:
                    existing_data = json.load(f)
                    # Remove existing entry if it exists
                    existing_data = [item for item in existing_data if item["id"] != file_id]
                except json.JSONDecodeError:
                    existing_data = []
        
        # Add new entry to beginning
        existing_data.insert(0, new_entry)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        # Also add to portfolio.json
        portfolio_path = "./data/portfolio.json"
        portfolio_data = []
        
        if os.path.exists(portfolio_path):
            with open(portfolio_path, "r", encoding="utf-8") as f:
                try:
                    portfolio_data = json.load(f)
                    # Remove existing entry if it exists
                    portfolio_data = [item for item in portfolio_data if item["id"] != file_id]
                except json.JSONDecodeError:
                    portfolio_data = []
        
        # Add new entry to beginning
        portfolio_data.insert(0, new_entry)
        
        os.makedirs(os.path.dirname(portfolio_path), exist_ok=True)
        with open(portfolio_path, "w", encoding="utf-8") as f:
            json.dump(portfolio_data, f, ensure_ascii=False, indent=2)
        
        messagebox.showinfo("Success", "Metadata saved successfully")
    
    def start_conversion_thread(self):
        """Запускает конвертацию в отдельном потоке"""
        thread = threading.Thread(target=self.convert_images)
        thread.daemon = True
        thread.start()
    
    def convert_to_avif(self, input_path, output_dir):
        """Конвертирует изображение в AVIF с помощью avifenc"""
        filename = os.path.basename(input_path)
        name_without_ext = os.path.splitext(filename)[0]
        output_path = os.path.join(output_dir, f"{name_without_ext}.avif")
        
        cmd = [
            self.avifenc_path,
            "-q", str(self.avif_quality.get()),
            "-s", str(self.avif_speed.get()),
            "--yuv", "420",
            input_path,
            output_path
        ]
        
        try:
            result = subprocess.run(
                cmd, 
                check=True, 
                capture_output=True, 
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            self.log(f"AVIF успешно: {filename}")
            return True
        except subprocess.CalledProcessError as e:
            self.log(f"Ошибка AVIF {filename}: {e.stderr}")
            return False
        except Exception as e:
            self.log(f"Неожиданная ошибка AVIF {filename}: {str(e)}")
            return False
    
    def convert_to_webp(self, input_path, output_dir):
        """Конвертирует изображение в WEBP с помощью Pillow"""
        filename = os.path.basename(input_path)
        name_without_ext = os.path.splitext(filename)[0]
        output_path = os.path.join(output_dir, f"{name_without_ext}.webp")
        
        try:
            with Image.open(input_path) as img:
                img.save(
                    output_path,
                    format="WEBP",
                    quality=self.webp_quality.get()
                )
            self.log(f"WEBP успешно: {filename}")
            return True
        except Exception as e:
            self.log(f"Ошибка WEBP {filename}: {str(e)}")
            return False
    
    def process_image(self, filename):
        """Обрабатывает одно изображение"""
        input_path = os.path.join(self.input_folder.get(), filename)
        base_name = os.path.splitext(filename)[0]
        
        # Конвертация в WEBP
        webp_success = self.convert_to_webp(input_path, self.webp_folder.get())
        
        # Конвертация в AVIF если доступна
        avif_success = True
        if self.avifenc_path:
            avif_success = self.convert_to_avif(input_path, self.avif_folder.get())
        
        return webp_success and avif_success
    
    def convert_images(self):
        """Основная функция конвертации"""
        input_folder = self.input_folder.get()
        avif_folder = self.avif_folder.get()
        webp_folder = self.webp_folder.get()
        
        if not os.path.isdir(input_folder):
            self.log("Ошибка: Папка с исходными изображениями не существует")
            return
        
        os.makedirs(avif_folder, exist_ok=True)
        os.makedirs(webp_folder, exist_ok=True)
        
        self.log("Начало конвертации...")
        self.log(f"Используется потоков: {self.max_threads}")
        
        # Получаем список изображений
        image_files = [
            f for f in os.listdir(input_folder) 
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]
        
        if not image_files:
            self.log("Не найдено изображений для конвертации")
            return
        
        # Многопоточная обработка с ограничением потоков
        with ThreadPoolExecutor(max_workers=self.max_threads) as executor:
            results = list(executor.map(self.process_image, image_files))
        
        success_count = sum(results)
        self.log(f"Конвертация завершена! Успешно: {success_count}/{len(image_files)}")
        messagebox.showinfo("Готово", f"Конвертация завершена!\nУспешно: {success_count}/{len(image_files)}")
    
    def log(self, message):
        """Логирование в текстовое поле"""
        self.log_text.config(state="normal")
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state="disabled")
        self.root.update_idletasks()
    
    def clear_window(self):
        """Очистка окна"""
        for widget in self.root.winfo_children():
            widget.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageConverterApp(root)
    root.mainloop()