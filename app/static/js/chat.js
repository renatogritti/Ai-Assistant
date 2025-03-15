document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addMessage(message, 'user-message');
    input.value = '';
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Adicionar resposta do bot
        addMessage(data.response, 'bot-message');
    } catch (error) {
        console.error('Erro:', error);
        addMessage(`Erro: ${error.message}`, 'bot-message error');
    }
});

// Adicionar mensagem de boas-vindas quando o documento carrega
document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = `Olá! Sou Deeply, seu assistente especializado em trabalho colaborativo e produtividade. 
    Posso ajudar com:
    • Métodos de trabalho profundo (Deep Work)
    • Práticas ágeis e colaborativas
    • Reconhecimento social (Kudos)
    • Produtividade em equipe
    
    Como posso ajudar você hoje?`;
    
    addMessage(welcomeMessage, 'bot-message');
});

function addMessage(text, className) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = text;  // Alterado de textContent para innerHTML
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Realça blocos de código novos
    messageDiv.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
}
