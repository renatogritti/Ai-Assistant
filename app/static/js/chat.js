document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Configure marked.js for markdown parsing
    if (typeof marked !== 'undefined') {
        marked.use({
            breaks: true,        // Enable line breaks
            gfm: true,           // Enable GitHub Flavored Markdown
            pedantic: false,
            sanitize: false,     // We'll use DOMPurify instead
            smartLists: true,
            smartypants: true,
            headerIds: false     // Disable header IDs to prevent conflicts
        });
    }
    
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if empty
        if (this.value === '') {
            this.style.height = '';
        }
    });
    
    // Display welcome message if available
    if (typeof welcomeMessageData !== 'undefined') {
        const botMessageWrapper = document.createElement('div');
        botMessageWrapper.className = 'message bot-message';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        const markdownContainer = document.createElement('div');
        markdownContainer.className = 'markdown-body';
        markdownContainer.style.display = 'none';
        
        botMessageWrapper.appendChild(typingIndicator);
        botMessageWrapper.appendChild(markdownContainer);
        chatMessages.appendChild(botMessageWrapper);

        // Simular streaming de resposta
        const text = welcomeMessageData.response;
        let index = 0;
        let fullText = '';
        
        setTimeout(() => {
            typingIndicator.remove();
            markdownContainer.style.display = 'block';
            
            const streamInterval = setInterval(() => {
                if (index < text.length) {
                    fullText += text[index];
                    renderMarkdown(markdownContainer, fullText);
                    scrollToBottom();
                    index++;
                } else {
                    clearInterval(streamInterval);
                }
            }, 20); // Ajuste este valor para controlar a velocidade do streaming
        }, 1000);
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', sendMessage);
    
    // Handle Enter key (send message) and Shift+Enter (new line)
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Function to send message
    function sendMessage(e) {
        if (e) e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Disable input and button while processing
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // Add user message to chat
        displayUserMessage(message);
        
        // Clear input
        userInput.value = '';
        userInput.style.height = '';
        
        // Create bot message container with typing indicator
        const botMessageWrapper = document.createElement('div');
        botMessageWrapper.className = 'message bot-message';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        botMessageWrapper.appendChild(typingIndicator);
        chatMessages.appendChild(botMessageWrapper);
        scrollToBottom();
        
        // Create markdown container (hidden initially)
        const markdownContainer = document.createElement('div');
        markdownContainer.className = 'markdown-body';
        markdownContainer.style.display = 'none';
        botMessageWrapper.appendChild(markdownContainer);
        
        // Start streaming response
        const eventSource = new EventSource(`/chat?message=${encodeURIComponent(message)}`);
        let fullText = '';
        let isFirstChunk = true;
        
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                if (data.response) {
                    // Remove typing indicator on first chunk
                    if (isFirstChunk) {
                        typingIndicator.remove();
                        markdownContainer.style.display = 'block';
                        isFirstChunk = false;
                    }
                    
                    // Add new text
                    fullText += data.response;
                    
                    // Render markdown
                    renderMarkdown(markdownContainer, fullText);
                    
                    scrollToBottom();
                }
                
                if (data.done) {
                    eventSource.close();
                    
                    // Final render to ensure everything is properly formatted
                    renderMarkdown(markdownContainer, fullText);
                    
                    // Re-enable input and button
                    userInput.disabled = false;
                    sendButton.disabled = false;
                    userInput.focus();
                    
                    // Save chat
                    fetch('/save_chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message, response: fullText })
                    }).catch(error => console.error('Erro ao salvar:', error));
                }
            } catch (error) {
                console.error('Erro:', error);
                eventSource.close();
                handleError(botMessageWrapper, fullText);
            }
        };
        
        eventSource.onerror = function() {
            eventSource.close();
            handleError(botMessageWrapper, fullText);
        };
    }
    
    // Simplificar função renderMarkdown já que o texto virá formatado em HTML
    function renderMarkdown(container, text) {
        // O texto já vem em HTML, apenas sanitizar
        container.innerHTML = DOMPurify.sanitize(text, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'li', 'a'],
            ALLOWED_ATTR: ['href', 'target']
        });
    }
    
    // Function to display user message
    function displayUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Function to display bot message
    function displayBotMessage(markdown) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const markdownContainer = document.createElement('div');
        markdownContainer.className = 'markdown-body';
        
        messageDiv.appendChild(markdownContainer);
        chatMessages.appendChild(messageDiv);
        
        // Render markdown
        renderMarkdown(markdownContainer, markdown);
        
        scrollToBottom();
    }
    
    // Function to handle errors
    function handleError(container, currentText) {
        // Remove typing indicator if it exists
        const typingIndicator = container.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Get or create markdown container
        let markdownContainer = container.querySelector('.markdown-body');
        if (!markdownContainer) {
            markdownContainer = document.createElement('div');
            markdownContainer.className = 'markdown-body';
            container.appendChild(markdownContainer);
        }
        
        // Display current text + error message
        const errorText = currentText + '\n\n❌ **Erro na conexão**. Por favor, tente novamente.';
        renderMarkdown(markdownContainer, errorText);
        markdownContainer.style.display = 'block';
        
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
        
        scrollToBottom();
    }
    
    // Function to scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
