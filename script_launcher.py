"""
Script Launcher - Tool per gestire e lanciare script Python
Interfaccia grafica con database SQLite
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import sqlite3
import subprocess
import os
from datetime import datetime

# Database setup
DB_FILE = "scripts_db.sqlite"

def init_db():
    """Inizializza il database SQLite"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            percorso TEXT NOT NULL,
            descrizione TEXT,
            data_aggiunta TEXT,
            ultimo_lancio TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_all_scripts():
    """Recupera tutti gli script dal database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id, nome, percorso, descrizione, data_aggiunta, ultimo_lancio FROM scripts ORDER BY nome')
    scripts = cursor.fetchall()
    conn.close()
    return scripts

def add_script(nome, percorso, descrizione=""):
    """Aggiunge uno script al database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO scripts (nome, percorso, descrizione, data_aggiunta)
        VALUES (?, ?, ?, ?)
    ''', (nome, percorso, descrizione, datetime.now().strftime("%Y-%m-%d %H:%M")))
    conn.commit()
    conn.close()

def delete_script(script_id):
    """Elimina uno script dal database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
    conn.commit()
    conn.close()

def update_ultimo_lancio(script_id):
    """Aggiorna la data dell'ultimo lancio"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE scripts SET ultimo_lancio = ? WHERE id = ?
    ''', (datetime.now().strftime("%Y-%m-%d %H:%M"), script_id))
    conn.commit()
    conn.close()

class ScriptLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🐍 Script Launcher")
        self.root.geometry("800x500")
        self.root.configure(bg="#1e1e1e")
        
        # Stile
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", 
                       background="#2d2d2d", 
                       foreground="white", 
                       fieldbackground="#2d2d2d",
                       rowheight=30)
        style.configure("Treeview.Heading", 
                       background="#3d3d3d", 
                       foreground="#F7AF40",
                       font=('Segoe UI', 10, 'bold'))
        style.map("Treeview", background=[("selected", "#F7AF40")])
        
        # Frame principale
        main_frame = tk.Frame(root, bg="#1e1e1e")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Titolo
        title = tk.Label(main_frame, text="🐍 Script Launcher", 
                        font=("Segoe UI", 18, "bold"), 
                        bg="#1e1e1e", fg="#F7AF40")
        title.pack(pady=(0, 10))
        
        # Frame pulsanti
        btn_frame = tk.Frame(main_frame, bg="#1e1e1e")
        btn_frame.pack(fill=tk.X, pady=(0, 10))
        
        btn_style = {"font": ("Segoe UI", 10), "width": 15, "cursor": "hand2"}
        
        self.btn_add = tk.Button(btn_frame, text="➕ Aggiungi Script", 
                                command=self.add_script_dialog,
                                bg="#4CAF50", fg="white", **btn_style)
        self.btn_add.pack(side=tk.LEFT, padx=5)
        
        self.btn_run = tk.Button(btn_frame, text="▶️ Esegui", 
                                command=self.run_selected,
                                bg="#2196F3", fg="white", **btn_style)
        self.btn_run.pack(side=tk.LEFT, padx=5)
        
        self.btn_delete = tk.Button(btn_frame, text="🗑️ Elimina", 
                                   command=self.delete_selected,
                                   bg="#f44336", fg="white", **btn_style)
        self.btn_delete.pack(side=tk.LEFT, padx=5)
        
        self.btn_refresh = tk.Button(btn_frame, text="🔄 Aggiorna", 
                                    command=self.refresh_list,
                                    bg="#FF9800", fg="white", **btn_style)
        self.btn_refresh.pack(side=tk.LEFT, padx=5)
        
        # Treeview per la lista script
        tree_frame = tk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        columns = ("id", "nome", "percorso", "descrizione", "aggiunto", "ultimo_lancio")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
        
        self.tree.heading("id", text="ID")
        self.tree.heading("nome", text="Nome")
        self.tree.heading("percorso", text="Percorso")
        self.tree.heading("descrizione", text="Descrizione")
        self.tree.heading("aggiunto", text="Aggiunto")
        self.tree.heading("ultimo_lancio", text="Ultimo Lancio")
        
        self.tree.column("id", width=40, anchor="center")
        self.tree.column("nome", width=120)
        self.tree.column("percorso", width=250)
        self.tree.column("descrizione", width=150)
        self.tree.column("aggiunto", width=100, anchor="center")
        self.tree.column("ultimo_lancio", width=100, anchor="center")
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Double click per eseguire
        self.tree.bind("<Double-1>", lambda e: self.run_selected())
        
        # Info bar
        self.info_label = tk.Label(main_frame, text="Doppio click su uno script per eseguirlo", 
                                  font=("Segoe UI", 9), bg="#1e1e1e", fg="#888")
        self.info_label.pack(pady=(10, 0))
        
        # Carica lista
        self.refresh_list()
    
    def refresh_list(self):
        """Aggiorna la lista degli script"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        scripts = get_all_scripts()
        for script in scripts:
            self.tree.insert("", tk.END, values=script)
        
        self.info_label.config(text=f"📊 {len(scripts)} script nel database")
    
    def add_script_dialog(self):
        """Dialogo per aggiungere un nuovo script"""
        # Apri file dialog
        file_path = filedialog.askopenfilename(
            title="Seleziona uno script Python",
            filetypes=[("Python files", "*.py"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        # Popup per nome e descrizione
        dialog = tk.Toplevel(self.root)
        dialog.title("Aggiungi Script")
        dialog.geometry("400x200")
        dialog.configure(bg="#2d2d2d")
        dialog.transient(self.root)
        dialog.grab_set()
        
        tk.Label(dialog, text="Nome:", bg="#2d2d2d", fg="white", 
                font=("Segoe UI", 10)).pack(pady=(20, 5))
        nome_entry = tk.Entry(dialog, width=40, font=("Segoe UI", 10))
        nome_entry.insert(0, os.path.basename(file_path).replace(".py", ""))
        nome_entry.pack()
        
        tk.Label(dialog, text="Descrizione (opzionale):", bg="#2d2d2d", fg="white",
                font=("Segoe UI", 10)).pack(pady=(15, 5))
        desc_entry = tk.Entry(dialog, width=40, font=("Segoe UI", 10))
        desc_entry.pack()
        
        def save():
            nome = nome_entry.get().strip()
            if not nome:
                messagebox.showwarning("Attenzione", "Inserisci un nome")
                return
            add_script(nome, file_path, desc_entry.get().strip())
            dialog.destroy()
            self.refresh_list()
            messagebox.showinfo("Successo", f"Script '{nome}' aggiunto!")
        
        tk.Button(dialog, text="💾 Salva", command=save,
                 bg="#4CAF50", fg="white", font=("Segoe UI", 10),
                 width=15, cursor="hand2").pack(pady=20)
    
    def run_selected(self):
        """Esegue lo script selezionato"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Attenzione", "Seleziona uno script da eseguire")
            return
        
        item = self.tree.item(selected[0])
        script_id = item["values"][0]
        script_path = item["values"][2]
        script_name = item["values"][1]
        
        if not os.path.exists(script_path):
            messagebox.showerror("Errore", f"File non trovato:\n{script_path}")
            return
        
        # Aggiorna ultimo lancio
        update_ultimo_lancio(script_id)
        self.refresh_list()
        
        # Esegui lo script
        try:
            # Apre una nuova finestra terminale per eseguire lo script
            if os.name == 'nt':  # Windows
                subprocess.Popen(f'start cmd /k python "{script_path}"', shell=True)
            else:  # Linux/Mac
                subprocess.Popen(f'gnome-terminal -- python3 "{script_path}"', shell=True)
            
            self.info_label.config(text=f"▶️ Lanciato: {script_name}")
        except Exception as e:
            messagebox.showerror("Errore", f"Errore nell'esecuzione:\n{str(e)}")
    
    def delete_selected(self):
        """Elimina lo script selezionato"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Attenzione", "Seleziona uno script da eliminare")
            return
        
        item = self.tree.item(selected[0])
        script_name = item["values"][1]
        
        if messagebox.askyesno("Conferma", f"Eliminare '{script_name}' dal database?"):
            delete_script(item["values"][0])
            self.refresh_list()
            messagebox.showinfo("Eliminato", f"Script '{script_name}' rimosso dal database")

def main():
    init_db()
    root = tk.Tk()
    app = ScriptLauncherApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
