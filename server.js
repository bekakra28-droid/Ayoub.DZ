// تحميل متغيرات البيئة من ملف .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const axios = require('axios');

// استخدام المتغيرات من .env
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEFAULT_OPENAI_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

console.log(`🚀 Running in ${NODE_ENV} mode on port ${PORT}`);
console.log(`📡 Default OpenAI Key configured: ${DEFAULT_OPENAI_KEY ? 'Yes' : 'No'}`);
console.log(`📡 Default DeepSeek Key configured: ${DEFAULT_DEEPSEEK_KEY ? 'Yes' : 'No'}`);

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // تبسيط للتطوير
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'تم تجاوز حد الطلبات المسموح بها، يرجى المحاولة لاحقاً' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Helper function to get API key (user key or default)
function getApiKey(userKey, defaultKey, serviceName) {
    if (userKey && userKey.trim() !== '') {
        return userKey;
    }
    if (defaultKey && defaultKey.trim() !== '') {
        console.log(`Using default ${serviceName} API key from .env`);
        return defaultKey;
    }
    return null;
}

// ============ Chat API ============
app.post('/api/chat', async (req, res) => {
    try {
        const { message, apiKey, model = 'gpt-3.5-turbo' } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ 
                error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI في صفحة الإعدادات أو إضافة مفتاح في ملف .env' 
            });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Chat API Error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.error?.message || 'حدث خطأ في معالجة طلب الدردشة';
        res.status(500).json({ error: errorMsg });
    }
});

// ============ Text Generation API ============
app.post('/api/generate-text', async (req, res) => {
    try {
        const { prompt, apiKey, task = 'write' } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI' });
        }

        let systemPrompt = '';
        switch(task) {
            case 'summarize':
                systemPrompt = 'قم بتلخيص النص التالي بشكل مختصر ومفيد، مع الحفاظ على النقاط الرئيسية:';
                break;
            case 'translate':
                systemPrompt = 'قم بترجمة النص التالي إلى اللغة العربية الفصحى بدقة:';
                break;
            case 'improve':
                systemPrompt = 'قم بتحسين النص التالي من حيث الأسلوب والوضوح والإملاء:';
                break;
            default:
                systemPrompt = 'اكتب نصاً احترافياً ومميزاً بناءً على المطلوب التالي:';
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Text Generation Error:', error.message);
        res.status(500).json({ error: 'حدث خطأ في توليد النص' });
    }
});

// ============ Image Generation API ============
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, apiKey, size = '1024x1024' } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI' });
        }

        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: prompt,
            n: 1,
            size: size,
            quality: 'standard'
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        res.json({ imageUrl: response.data.data[0].url });
    } catch (error) {
        console.error('Image Generation Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'حدث خطأ في توليد الصورة' });
    }
});

// ============ Text to Speech API ============
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text, apiKey, voice = 'alloy' } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI' });
        }

        const response = await axios.post('https://api.openai.com/v1/audio/speech', {
            model: 'tts-1',
            input: text,
            voice: voice
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');
        res.json({ audio: `data:audio/mp3;base64,${audioBase64}` });
    } catch (error) {
        console.error('TTS Error:', error.message);
        res.status(500).json({ error: 'حدث خطأ في تحويل النص إلى صوت' });
    }
});

// ============ Speech to Text API ============
app.post('/api/speech-to-text', async (req, res) => {
    try {
        const { audioBase64, apiKey } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI' });
        }

        // تحويل base64 إلى buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        
        // إنشاء FormData لإرسال الملف
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', audioBuffer, { filename: 'audio.mp3' });
        formData.append('model', 'whisper-1');
        formData.append('language', 'ar');

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                ...formData.getHeaders()
            },
            timeout: 60000
        });

        res.json({ text: response.data.text });
    } catch (error) {
        console.error('STT Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'حدث خطأ في تحويل الصوت إلى نص' });
    }
});

// ============ Video Generation API (placeholder - using external API) ============
app.post('/api/generate-video', async (req, res) => {
    try {
        const { prompt, apiKey } = req.body;
        
        // This is a placeholder - would integrate with RunwayML, Pika, or similar
        // For now, return a mock response
        res.json({ 
            videoUrl: null,
            message: '🚧 ميزة توليد الفيديو قيد التطوير حالياً. سيتم إطلاقها قريباً!',
            status: 'coming_soon'
        });
    } catch (error) {
        console.error('Video Generation Error:', error.message);
        res.status(500).json({ error: 'حدث خطأ في توليد الفيديو' });
    }
});

// ============ DeepSeek API (Alternative) ============
app.post('/api/deepseek', async (req, res) => {
    try {
        const { message, apiKey } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_DEEPSEEK_KEY, 'DeepSeek');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ DeepSeek' });
        }

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('DeepSeek Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'حدث خطأ في الاتصال بـ DeepSeek' });
    }
});

// ============ Code Assistant API ============
app.post('/api/code-assistant', async (req, res) => {
    try {
        const { prompt, language, apiKey } = req.body;
        
        const activeApiKey = getApiKey(apiKey, DEFAULT_OPENAI_KEY, 'OpenAI');
        
        if (!activeApiKey) {
            return res.status(400).json({ error: 'يرجى إدخال مفتاح API الخاص بـ OpenAI' });
        }

        const systemPrompt = `أنت مساعد برمجة محترف. قم بكتابة كود ${language} بناءً على طلب المستخدم. قدم شرحاً موجزاً ثم الكود.`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${activeApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Code Assistant Error:', error.message);
        res.status(500).json({ error: 'حدث خطأ في مساعد الأكواد' });
    }
});

// ============ Serve HTML pages ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Tools routes
app.get('/tools/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'chat.html'));
});

app.get('/tools/text-generate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'text-generate.html'));
});

app.get('/tools/image-generate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'image-generate.html'));
});

app.get('/tools/video-generate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'video-generate.html'));
});

app.get('/tools/speech-to-text', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'speech-to-text.html'));
});

app.get('/tools/text-to-speech', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'text-to-speech.html'));
});

app.get('/tools/code-assistant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tools', 'code-assistant.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        defaultKeysConfigured: {
            openai: !!DEFAULT_OPENAI_KEY,
            deepseek: !!DEFAULT_DEEPSEEK_KEY
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`🚀 Yaqoub AI Platform is running!`);
    console.log(`=================================`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📱 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`=================================\n`);
});