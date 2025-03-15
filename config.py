import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///chat.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MISTRAL_MODEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "mistral-7b-instruct-v0.1.gguf")
    OLLAMA_API_BASE = "http://127.0.0.1:11434"
    OLLAMA_MODEL = "gemma3:1b"  # Alterado para Gemma 3B gemma3:1b

