// AI Chat Manager
class AIChatManager {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Focus on input when section is shown
        this.chatInput.focus();
    }

    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage(message = null) {
        const messageText = message || this.chatInput.value.trim();
        
        if (!messageText || this.isTyping) return;

        // Add user message to chat
        this.addMessage(messageText, 'user');
        
        // Clear input
        if (!message) {
            this.chatInput.value = '';
            this.autoResizeTextarea();
        }

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send message to server
            const response = await fetch('http://localhost:5000/api/ai-chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message: messageText })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessage(data.message, 'ai');

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }

    sendSuggestion(suggestion) {
        this.sendMessage(suggestion);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = sender === 'ai' ? 'lni lni-consulting' : 'lni lni-user';
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.innerHTML = this.formatMessage(text);
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        content.appendChild(messageText);
        content.appendChild(messageTime);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Store message
        this.messages.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(text) {
        // Convert line breaks to <br> tags
        return text.replace(/\n/g, '<br>');
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.sendButton.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const icon = document.createElement('i');
        icon.className = 'lni lni-consulting';
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.sendButton.disabled = false;
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    clearChat() {
        // Keep only the welcome message
        const welcomeMessage = this.chatMessages.querySelector('.message.ai-message');
        this.chatMessages.innerHTML = '';
        
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
        
        this.messages = [];
        this.hideTypingIndicator();
    }

    // Load chat history (for future implementation)
    async loadChatHistory() {
        try {
            const response = await fetch('http://localhost:5000/api/ai-chat/history', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Future implementation for loading chat history
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
}

// Initialize AI Chat Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChatManager = new AIChatManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatManager;
}
