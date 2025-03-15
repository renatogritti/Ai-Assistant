# Deeply AI Chat

Interface web para interação com o assistente Deeply usando Flask e Ollama. Especializado em trabalho colaborativo, produtividade e deep work.

## Requisitos

- Python 3.8+
- Ollama instalado e configurado
- Modelo Gemma 3B instalado

## Características

- Interface web similar ao ChatGPT
- Especializado em:
  - Trabalho profundo (Deep Work)
  - Práticas ágeis
  - Reconhecimento social (Kudos)
  - Produtividade em equipe
- Respostas em português
- Histórico de conversas em SQLite
- Design responsivo com Bootstrap
- Suporte a formatação Markdown

## Instalação

1. Clone o repositório
2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Instale o Ollama e o modelo:
```bash
# Instale o Ollama conforme documentação oficial
# Em seguida, instale o modelo
ollama pull gemma3:1b
```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Executando

```bash
python run.py
```
Acesse http://localhost:5000

## Estrutura do Projeto

```
├── app/
│   ├── static/         # Arquivos estáticos
│   ├── templates/      # Templates HTML
│   ├── __init__.py    # Inicialização do Flask
│   ├── models.py      # Modelos do banco
│   └── routes.py      # Rotas da aplicação
├── instance/
│   └── chat.db        # Banco SQLite
├── config.py          # Configurações
├── requirements.txt   # Dependências
└── run.py            # Script de execução
```

## Configuração

O arquivo `config.py` contém as configurações principais:
- Modelo: gemma3:1b
- Endpoint Ollama: http://127.0.0.1:11434
- Banco de dados: SQLite

## Desenvolvimento

Requisitos para desenvolvimento:
- Visual Studio Code ou similar
- Python 3.8+
- Git
