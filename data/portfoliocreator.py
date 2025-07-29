import os
import json
import tkinter as tk
from tkinter import ttk, filedialog
from PIL import Image, ImageTk

# Категории
categories = {
    'street': 'Стрит',
    'concept': 'Концепт',
    'mono': 'Моно-ЧБ',
    'experiments': 'Эксперименты',
    'philosophy': 'Философия'
}

class ImageMetadataEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Редактор метаданных изображений")
        
        # Список файлов для обработки
        self.files = []
        self.current_file_index = 0
        self.data = []
        
        # Создаем основной интерфейс
        self.create_widgets()
        
        # Загружаем список файлов
        self.load_files()
        
    def create_widgets(self):
        # Основные фреймы
        self.image_frame = ttk.LabelFrame(self.root, text="Изображение", padding=10)
        self.image_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        
        self.form_frame = ttk.LabelFrame(self.root, text="Метаданные", padding=10)
        self.form_frame.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        
        # Виджеты для изображения
        self.image_label = ttk.Label(self.image_frame)
        self.image_label.pack()
        
        # Виджеты для формы
        ttk.Label(self.form_frame, text="ID файла:").grid(row=0, column=0, sticky="w")
        self.file_id_label = ttk.Label(self.form_frame, text="")
        self.file_id_label.grid(row=0, column=1, sticky="w")
        
        ttk.Label(self.form_frame, text="Заголовок:").grid(row=1, column=0, sticky="w")
        self.title_entry = ttk.Entry(self.form_frame, width=40)
        self.title_entry.grid(row=1, column=1, pady=5)
        
        ttk.Label(self.form_frame, text="Категории:").grid(row=2, column=0, sticky="nw")
        self.category_vars = []
        self.category_checks = []
        
        for i, (key, value) in enumerate(categories.items()):
            var = tk.BooleanVar()
            cb = ttk.Checkbutton(self.form_frame, text=f"{value} ({key})", variable=var)
            cb.grid(row=2+i, column=1, sticky="w")
            self.category_vars.append(var)
            self.category_checks.append(cb)
        
        ttk.Label(self.form_frame, text="Описание:").grid(row=2+len(categories), column=0, sticky="nw")
        self.description_text = tk.Text(self.form_frame, width=40, height=5)
        self.description_text.grid(row=2+len(categories), column=1, pady=5)
        
        # Кнопки навигации
        self.nav_frame = ttk.Frame(self.root)
        self.nav_frame.grid(row=1, column=0, columnspan=2, pady=10)
        
        self.prev_btn = ttk.Button(self.nav_frame, text="Назад", command=self.prev_file)
        self.prev_btn.pack(side="left", padx=5)
        
        self.next_btn = ttk.Button(self.nav_frame, text="Вперед", command=self.next_file)
        self.next_btn.pack(side="left", padx=5)
        
        self.save_btn = ttk.Button(self.nav_frame, text="Сохранить JSON", command=self.save_json)
        self.save_btn.pack(side="right", padx=5)
        
        # Настройка растягивания
        self.root.columnconfigure(0, weight=1)
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(0, weight=1)
    
    def load_files(self):
        # Получаем список файлов в текущей директории (исключая скрипт)
        self.files = [f for f in os.listdir() if os.path.isfile(f) and f != os.path.basename(__file__)]
        
        if self.files:
            self.current_file_index = 0
            self.load_current_file()
        else:
            self.file_id_label.config(text="Нет файлов для обработки")
    
    def load_current_file(self):
        if not self.files:
            return
            
        file = self.files[self.current_file_index]
        file_id = os.path.splitext(file)[0]
        
        # Обновляем информацию о файле
        self.file_id_label.config(text=file_id)
        self.title_entry.delete(0, tk.END)
        self.description_text.delete("1.0", tk.END)
        
        # Сбрасываем чекбоксы
        for var in self.category_vars:
            var.set(False)
        
        # Загружаем изображение
        try:
            image = Image.open(file)
            # Масштабируем изображение для отображения
            max_size = (400, 400)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(image)
            
            self.image_label.config(image=photo)
            self.image_label.image = photo  # Сохраняем ссылку
        except Exception as e:
            self.image_label.config(text=f"Не удалось загрузить изображение: {e}")
    
    def get_current_data(self):
        file = self.files[self.current_file_index]
        file_id = os.path.splitext(file)[0]
        title = self.title_entry.get()
        
        selected_categories = []
        for i, var in enumerate(self.category_vars):
            if var.get():
                selected_categories.append(list(categories.keys())[i])
        
        description = self.description_text.get("1.0", tk.END).strip()
        
        return {
            "id": file_id,
            "title": title,
            "categories": selected_categories,
            "description": description
        }
    
    def prev_file(self):
        if self.current_file_index > 0:
            # Сохраняем текущие данные
            if self.current_file_index < len(self.data):
                self.data[self.current_file_index] = self.get_current_data()
            else:
                self.data.append(self.get_current_data())
            
            self.current_file_index -= 1
            self.load_current_file()
    
    def next_file(self):
        if self.current_file_index < len(self.files) - 1:
            # Сохраняем текущие данные
            if self.current_file_index < len(self.data):
                self.data[self.current_file_index] = self.get_current_data()
            else:
                self.data.append(self.get_current_data())
            
            self.current_file_index += 1
            self.load_current_file()
    
    def save_json(self):
        # Сохраняем данные текущего файла
        if self.current_file_index < len(self.data):
            self.data[self.current_file_index] = self.get_current_data()
        else:
            self.data.append(self.get_current_data())
        
        # Запрашиваем место сохранения
        output_file = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            initialfile="output.json"
        )
        
        if output_file:
            try:
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(self.data, f, ensure_ascii=False, indent=4)
                tk.messagebox.showinfo("Успех", f"Данные сохранены в {output_file}")
            except Exception as e:
                tk.messagebox.showerror("Ошибка", f"Не удалось сохранить файл: {e}")

def main():
    root = tk.Tk()
    app = ImageMetadataEditor(root)
    root.mainloop()

if __name__ == "__main__":
    main()