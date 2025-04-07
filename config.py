import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///chat.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações do Ollama
    OLLAMA_API_BASE = "http://localhost:11434/api/generate"
    OLLAMA_MODEL = "gemma3:4b"  # Alterado para o nome correto do modelo

