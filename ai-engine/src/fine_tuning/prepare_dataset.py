"""
Prepare dataset for fine-tuning in Alpaca format
"""
import json
import os
from typing import List, Dict
from sqlalchemy import create_engine, text
from loguru import logger
from ..config.settings import settings

def load_documents_from_db() -> List[Dict]:
    """Load validated documents from PostgreSQL"""
    engine = create_engine(settings.postgres_url)
    
    query = text("""
        SELECT 
            id, title, authors, year, institution, discipline, 
            subdiscipline, processed_path, word_count
        FROM documents
        WHERE validated = true AND vectorized = true
        ORDER BY discipline, year DESC
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query)
        documents = [dict(row._mapping) for row in result]
    
    logger.info(f"Loaded {len(documents)} documents from database")
    return documents

def read_document_content(file_path: str) -> str:
    """Read processed document content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error reading {file_path}: {e}")
        return ""

def create_alpaca_entry(doc: Dict, content: str) -> Dict:
    """Create Alpaca format entry"""
    discipline_names = {
        "INGENIERIA": "ingeniería",
        "CIENCIAS_SOCIALES": "ciencias sociales",
        "EXACTAS_NATURALES": "ciencias exactas y naturales",
        "AGRARIAS": "ciencias agrarias"
    }
    
    discipline = discipline_names.get(doc['discipline'], doc['discipline'])
    
    instruction = f"Escribe un texto académico en estilo dominicano sobre {discipline}, específicamente sobre {doc['subdiscipline']}."
    
    input_text = f"Contexto: Documento de {doc['institution']}, año {doc['year']}. Tema: {doc['title']}."
    
    # Use first 2000 words as output (for training efficiency)
    words = content.split()[:2000]
    output = ' '.join(words)
    
    return {
        "instruction": instruction,
        "input": input_text,
        "output": output
    }

def balance_dataset(entries: List[Dict]) -> List[Dict]:
    """Balance dataset across disciplines"""
    from collections import defaultdict
    import random
    
    by_discipline = defaultdict(list)
    for entry in entries:
        # Extract discipline from instruction
        if "ingeniería" in entry['instruction']:
            by_discipline['INGENIERIA'].append(entry)
        elif "sociales" in entry['instruction']:
            by_discipline['CIENCIAS_SOCIALES'].append(entry)
        elif "exactas" in entry['instruction']:
            by_discipline['EXACTAS_NATURALES'].append(entry)
        elif "agrarias" in entry['instruction']:
            by_discipline['AGRARIAS'].append(entry)
    
    # Find minimum count
    min_count = min(len(docs) for docs in by_discipline.values())
    
    # Balance by sampling
    balanced = []
    for discipline, docs in by_discipline.items():
        sampled = random.sample(docs, min_count) if len(docs) > min_count else docs
        balanced.extend(sampled)
    
    random.shuffle(balanced)
    logger.info(f"Balanced dataset: {len(balanced)} entries")
    
    return balanced

def prepare_dataset():
    """Main function to prepare dataset"""
    logger.info("Starting dataset preparation...")
    
    # Load documents
    documents = load_documents_from_db()
    
    if len(documents) < 50:
        logger.warning(f"Only {len(documents)} documents available. Recommend at least 50.")
    
    # Create Alpaca entries
    entries = []
    for doc in documents:
        content = read_document_content(doc['processed_path'])
        if content and len(content.split()) >= 500:
            entry = create_alpaca_entry(doc, content)
            entries.append(entry)
    
    logger.info(f"Created {len(entries)} training entries")
    
    # Balance dataset
    balanced_entries = balance_dataset(entries)
    
    # Save to JSONL
    output_path = "data/finetune_dataset.jsonl"
    os.makedirs("data", exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for entry in balanced_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    logger.info(f"Dataset saved to {output_path}")
    logger.info(f"Total entries: {len(balanced_entries)}")
    
    # Print statistics
    print("\n" + "="*50)
    print("DATASET STATISTICS")
    print("="*50)
    print(f"Total documents: {len(documents)}")
    print(f"Training entries: {len(balanced_entries)}")
    print(f"Output file: {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
    print("="*50)
    
    return output_path

if __name__ == "__main__":
    prepare_dataset()
