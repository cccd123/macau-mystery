"""ChromaDB client"""
import chromadb

_client = None
_collection = None

def get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
    return _client

def get_collection():
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(name="macau_history", metadata={"description": "澳门历史知识库"})
    return _collection
