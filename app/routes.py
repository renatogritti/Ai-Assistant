from flask import Blueprint, render_template, request, jsonify, current_app
from app.models import Conversation
from app import db
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re
import json
import html

main = Blueprint('main', __name__)

# Configure retry strategy for requests
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
    """
    Escape double quotes and backslashes for JSON
    """
    return text.replace('\\', '\\\\').replace('"', '\\"')

@main.route('/')
def index():
    welcome_message = {
        "response": """👋 **Olá! Sou seu assistente AI!**

*Estou aqui para ajudar com suas perguntas e tarefas.* Posso auxiliar com:

- **Programação**: Explicações, debugging e exemplos de código
- **Pesquisa**: Encontrar informações e resumir conteúdos
- **Criatividade**: Gerar ideias e conteúdo criativo
- **Produtividade**: Dicas e estratégias para otimizar seu trabalho

*Como posso ajudar você hoje?*"""
    }
    return render_template('chat.html', welcome_message=json.dumps(welcome_message))

@main.route('/chat')
def chat():
    try:
        message = request.args.get('message')
        if not message:
            return jsonify({'error': 'Mensagem não fornecida'}), 400
        
        # System prompt with formatting instructions
        system_prompt = """Instruções de formato e estilo:
IMPORTANTE - Formatação HTML obrigatória:
- Use <p> para parágrafos
- Use <br> para quebras de linha
- Use <ul> e <li> para listas
- Use <strong> para negrito
- Use <em> para itálico
- Use <a href="url">texto</a> para links

Exemplo de formatação esperada:
<p>Olá! Aqui está a resposta:</p>
<p>Este é um parágrafo com <strong>texto em negrito</strong> e <em>itálico</em>.</p>
<ul>
<li>Primeiro item da lista</li>
<li>Segundo item da lista</li>
</ul>

Instruções gerais:
- Você é um assistente AI amigável e prestativo
- Responda sempre em português do Brasil
- Use frases curtas e diretas
- Seja preciso, informativo e útil
"""

        url = "http://localhost:11434/api/generate"
        
        payload = {
            "model": "gemma3:4b",
            "prompt": f"{system_prompt}\n\nPergunta: {message}\n\n",
            "stream": True,
            "temperature": 0.7,
            "top_k": 40,
            "top_p": 0.9,
            "repeat_penalty": 1.1
        }

        def generate():
            full_response = ""
            response = http.post(url, json=payload, stream=True)
            
            for line in response.iter_lines():
                if line:
                    try:
                        json_response = json.loads(line)
                        chunk = json_response.get('response', '')
                        if chunk.strip():
                            full_response += chunk
                            formatted_chunk = format_response(chunk)
                            yield f'data: {{"response": "{formatted_chunk}"}}\n\n'
                    except json.JSONDecodeError:
                        continue

            yield f'data: {{"done": true}}\n\n'

        return current_app.response_class(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive'
            }
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/save_chat', methods=['POST'])
def save_chat():
    try:
        data = request.json
        message = data.get('message')
        response = data.get('response')
        
        if message and response:
            conversation = Conversation(
                user_message=message,
                bot_response=response
            )
            db.session.add(conversation)
            db.session.commit()
            return jsonify({'success': True})
        
        return jsonify({'error': 'Dados inválidos'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
