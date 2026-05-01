// API Handler Utility
const APIHandler = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ في الطلب');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    async chat(message, apiKey, model = 'gpt-3.5-turbo') {
        return this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message, apiKey, model })
        });
    },
    
    async generateText(prompt, apiKey, task = 'write') {
        return this.request('/generate-text', {
            method: 'POST',
            body: JSON.stringify({ prompt, apiKey, task })
        });
    },
    
    async generateImage(prompt, apiKey, size = '1024x1024') {
        return this.request('/generate-image', {
            method: 'POST',
            body: JSON.stringify({ prompt, apiKey, size })
        });
    },
    
    async textToSpeech(text, apiKey, voice = 'alloy') {
        return this.request('/text-to-speech', {
            method: 'POST',
            body: JSON.stringify({ text, apiKey, voice })
        });
    },
    
    async speechToText(audioBase64, apiKey) {
        return this.request('/speech-to-text', {
            method: 'POST',
            body: JSON.stringify({ audioBase64, apiKey })
        });
    },
    
    async codeAssistant(prompt, language, apiKey) {
        return this.request('/code-assistant', {
            method: 'POST',
            body: JSON.stringify({ prompt, language, apiKey })
        });
    },
    
    async deepseek(message, apiKey) {
        return this.request('/deepseek', {
            method: 'POST',
            body: JSON.stringify({ message, apiKey })
        });
    },
    
    async generateVideo(prompt, apiKey) {
        return this.request('/generate-video', {
            method: 'POST',
            body: JSON.stringify({ prompt, apiKey })
        });
    },
    
    async healthCheck() {
        return this.request('/health');
    }
};

// Storage utilities
const Storage = {
    saveApiKeys(keys) {
        localStorage.setItem('apiKeys', JSON.stringify(keys));
    },
    
    getApiKeys() {
        return JSON.parse(localStorage.getItem('apiKeys') || '{}');
    },
    
    saveChatHistory(history) {
        let chats = this.getChatHistory();
        chats.push(history);
        if(chats.length > 50) chats = chats.slice(-50);
        localStorage.setItem('chatHistory', JSON.stringify(chats));
    },
    
    getChatHistory() {
        return JSON.parse(localStorage.getItem('chatHistory') || '[]');
    },
    
    saveImageHistory(image) {
        let images = this.getImageHistory();
        images.push(image);
        if(images.length > 20) images = images.slice(-20);
        localStorage.setItem('imageHistory', JSON.stringify(images));
    },
    
    getImageHistory() {
        return JSON.parse(localStorage.getItem('imageHistory') || '[]');
    },
    
    clearHistory() {
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('imageHistory');
    }
};

// Export for use in other files
if(typeof module !== 'undefined' && module.exports) {
    module.exports = { APIHandler, Storage };
}