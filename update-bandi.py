#!/usr/bin/env python3
"""
Script per aggiornare il file bandi.json per bustobattle.it
Esegui questo script per aggiornare i bandi prima di fare push.

Uso: python update-bandi.py
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Aggiungi il path del monitor
BANDO_PATH = Path(__file__).parent.parent / 'Bando'
sys.path.insert(0, str(BANDO_PATH))

try:
    from web_dashboard import fetch_all_bandi
except ImportError:
    print("ERRORE: Impossibile importare web_dashboard.")
    print(f"Assicurati che esista: {BANDO_PATH / 'web_dashboard.py'}")
    sys.exit(1)

def main():
    print("=" * 50)
    print("🏆 Aggiornamento Bandi Sport per Busto Battle")
    print("=" * 50)
    print()
    
    # Recupera i bandi
    print("📡 Recupero bandi dalle fonti...")
    bandi = fetch_all_bandi()
    
    # Prepara i dati
    data = {
        'bandi': bandi,
        'last_update': datetime.now().isoformat(),
        'count': len(bandi)
    }
    
    # Salva il file
    output_path = Path(__file__).parent / 'public' / 'data' / 'bandi.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print()
    print("=" * 50)
    print(f"✅ Salvati {len(bandi)} bandi in:")
    print(f"   {output_path}")
    print()
    print("📤 Ora puoi fare commit e push per aggiornare il sito!")
    print("=" * 50)

if __name__ == '__main__':
    main()
