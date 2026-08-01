"""Knowledge ingestion"""
from pathlib import Path

DOCS_DIR = Path(__file__).parent / "macau_docs"

def split_into_chunks(text: str, chunk_size: int = 500) -> list[str]:
    chunks, current = [], ""
    for sentence in text.split("。"):
        if len(current) + len(sentence) > chunk_size:
            if current: chunks.append(current.strip())
            current = sentence
        else:
            current += sentence + "。"
    if current: chunks.append(current.strip())
    return chunks

def ingest_documents():
    from app.knowledge.chroma_client import get_collection
    collection = get_collection()
    if not DOCS_DIR.exists():
        print(f"Docs directory not found: {DOCS_DIR}")
        return
    for txt_file in DOCS_DIR.glob("*.txt"):
        print(f"Ingesting: {txt_file.name}")
        with open(txt_file, "r", encoding="utf-8") as f:
            text = f.read()
        chunks = split_into_chunks(text)
        for i, chunk in enumerate(chunks):
            collection.upsert(ids=[f"{txt_file.stem}_chunk_{i}"], documents=[chunk],
                              metadatas=[{"source": txt_file.name, "chunk": i}])
        print(f"  -> {len(chunks)} chunks")
    print(f"Total: {collection.count()}")

if __name__ == "__main__":
    ingest_documents()
