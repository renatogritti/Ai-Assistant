from flask import Blueprint, render_template, request, jsonify, current_app
from app.models import Conversation
from app import db
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re

main = Blueprint('main', __name__)

# Configuração de retry para requests
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
http = requests.Session()
http.mount("http://", adapter)
http.mount("https://", adapter)

def format_response(text):
    # Formata blocos de código
    text = re.sub(r'```(\w+)?\n(.*?)\n```', r'<pre><code class="language-\1">\2</code></pre>', text, flags=re.DOTALL)
    
    # Formata texto em negrito
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    
    # Formata texto em itálico
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    
    # Converte quebras de linha em <br>
    text = text.replace('\n', '<br>')
    
    return text

@main.route('/')
def index():
    return render_template('chat.html')

@main.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        
        system_prompt = """Instruções:
- Voce e Deeply, um assistente especializado em trabalho colaborativo, agilidade empresarial, social kudos e deep work.
Seu foco e ajudar equipes a trabalharem melhor juntas, reconhecer conquistas e manter a produtividade profunda.
- Responda sempre em português do Brasil
- Seja direto e objetivo
- Use frases curtas
- Evite introduções desnecessárias
- Use tópicos quando apropriado
- Forneça exemplos práticos quando solicitado
- Foque no essencial"""
        
        response = http.post(
            f"'OLLAMA_API_BASE'/api/generate",
            json={
                "model": 'OLLAMA_MODEL',
                "prompt": f"{system_prompt}\n\nPergunta: {message}",
                "stream": False,
                "temperature": 0.5,
                "top_k": 30,
                "top_p": 0.8,
                "repeat_penalty": 1.2
            },
            timeout=120
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if 'error' in response_data:
                return jsonify({'error': 'Erro no modelo: ' + response_data['error']}), 500
                
            bot_response = response_data.get('response', '').strip()
            if not bot_response:
                return jsonify({'error': 'Resposta vazia do modelo'}), 500
                
            formatted_response = format_response(bot_response)
            
            try:
                conversation = Conversation(user_message=message, bot_response=bot_response)
                db.session.add(conversation)
                db.session.commit()
            except Exception:
                db.session.rollback()
            
            return jsonify({'response': formatted_response})
        else:
            return jsonify({'error': f"Erro na API: {response.status_code}"}), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"Erro de conexão: {str(e)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Erro: {str(e)}"}), 500
