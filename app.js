// 全局状态
const state = {
    apiType: 'gemini',
    essayContent: '',
    imageData: null,
    isProcessing: false,
    serverConfig: null
};

// DOM元素
const elements = {
    // API配置
    apiTypeRadios: document.querySelectorAll('input[name="api-type"]'),
    geminiConfig: document.getElementById('gemini-config'),
    openaiConfig: document.getElementById('openai-config'),
    geminiModel: document.getElementById('gemini-model'),
    geminiKey: document.getElementById('gemini-key'),
    openaiBase: document.getElementById('openai-base'),
    openaiKey: document.getElementById('openai-key'),
    openaiModel: document.getElementById('openai-model'),
    
    // 输入区域
    tabButtons: document.querySelectorAll('.tab-button'),
    textInput: document.getElementById('text-input'),
    imageInput: document.getElementById('image-input'),
    essayText: document.getElementById('essay-text'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    imagePreview: document.getElementById('image-preview'),
    previewImg: document.getElementById('preview-img'),
    removeImage: document.getElementById('remove-image'),
    submitBtn: document.getElementById('submit-btn'),
    
    // 结果区域
    resultSection: document.getElementById('result-section'),
    thinkingToggle: document.getElementById('thinking-toggle'),
    thinkingContent: document.getElementById('thinking-content'),
    thinkingText: document.getElementById('thinking-text'),
    suggestions: document.getElementById('suggestions'),
    copyBtn: document.getElementById('copy-btn'),
    newEssayBtn: document.getElementById('new-essay-btn'),
    
    // 提示
    loading: document.getElementById('loading'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message'),
    successToast: document.getElementById('success-toast'),
    successMessage: document.getElementById('success-message')
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadServerConfig();
    initializeEventListeners();
    loadOpenAIModels();
});

// 加载服务器配置
async function loadServerConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            state.serverConfig = await response.json();
            
            // 设置默认值
            if (state.serverConfig.defaultGeminiModel) {
                elements.geminiModel.value = state.serverConfig.defaultGeminiModel;
            }
            
            // 如果服务器有 Gemini API Key，显示提示
            if (state.serverConfig.hasGeminiKey) {
                elements.geminiKey.placeholder = 'API Key 已在服务器配置（可选）';
            }
            
            // 设置默认的 OpenAI 配置
            if (state.serverConfig.openaiBaseUrl) {
                elements.openaiBase.value = state.serverConfig.openaiBaseUrl;
            }
            if (state.serverConfig.defaultOpenAIModel) {
                // 先加载模型列表，然后设置默认值
                await loadOpenAIModels();
                setTimeout(() => {
                    if (elements.openaiModel.querySelector(`option[value="${state.serverConfig.defaultOpenAIModel}"]`)) {
                        elements.openaiModel.value = state.serverConfig.defaultOpenAIModel;
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('Failed to load server config:', error);
    }
}

// 事件监听器初始化
function initializeEventListeners() {
    // API类型切换
    elements.apiTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleApiTypeChange);
    });
    
    // 标签页切换
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
    
    // 文本输入
    elements.essayText.addEventListener('input', handleTextInput);
    
    // 图片上传
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.removeImage.addEventListener('click', removeImage);
    
    // 提交
    elements.submitBtn.addEventListener('click', handleSubmit);
    
    // 结果操作
    elements.thinkingToggle.addEventListener('click', toggleThinking);
    elements.copyBtn.addEventListener('click', copyResult);
    elements.newEssayBtn.addEventListener('click', resetForm);
    
    // OpenAI配置变化时重新加载模型
    elements.openaiBase.addEventListener('change', loadOpenAIModels);
    elements.openaiKey.addEventListener('change', loadOpenAIModels);
}

// API类型切换
function handleApiTypeChange(e) {
    state.apiType = e.target.value;
    elements.geminiConfig.style.display = state.apiType === 'gemini' ? 'block' : 'none';
    elements.openaiConfig.style.display = state.apiType === 'openai' ? 'block' : 'none';
}

// 标签页切换
function handleTabSwitch(e) {
    const tab = e.target.dataset.tab;
    
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    elements.textInput.classList.toggle('active', tab === 'text');
    elements.imageInput.classList.toggle('active', tab === 'image');
}

// 文本输入处理
function handleTextInput(e) {
    state.essayContent = e.target.value;
}

// 文件选择处理
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        readImageFile(file);
    }
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        readImageFile(file);
    }
}

// 读取图片文件
function readImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.imageData = e.target.result;
        elements.previewImg.src = state.imageData;
        elements.uploadArea.style.display = 'none';
        elements.imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 移除图片
function removeImage() {
    state.imageData = null;
    elements.fileInput.value = '';
    elements.uploadArea.style.display = 'block';
    elements.imagePreview.style.display = 'none';
}

// 加载OpenAI模型列表
async function loadOpenAIModels() {
    if (state.apiType !== 'openai') return;
    
    const apiBase = elements.openaiBase.value;
    const apiKey = elements.openaiKey.value;
    
    if (!apiKey) {
        elements.openaiModel.innerHTML = '<option value="">请先输入API Key</option>';
        return;
    }
    
    try {
        const response = await fetch('/api/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'x-api-base': apiBase
            }
        });
        
        if (!response.ok) throw new Error('Failed to load models');
        
        const data = await response.json();
        const models = data.data || [];
        
        elements.openaiModel.innerHTML = models
            .filter(model => model.id.includes('gpt'))
            .map(model => `<option value="${model.id}">${model.id}</option>`)
            .join('');
            
        if (elements.openaiModel.options.length === 0) {
            elements.openaiModel.innerHTML = '<option value="">没有可用的模型</option>';
        }
    } catch (error) {
        console.error('Error loading models:', error);
        elements.openaiModel.innerHTML = '<option value="">加载模型失败</option>';
    }
}

// 提交处理
async function handleSubmit() {
    // 验证输入
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    
    if (activeTab === 'text' && !state.essayContent.trim()) {
        showError('请输入作文内容');
        return;
    }
    
    if (activeTab === 'image' && !state.imageData) {
        showError('请上传作文图片');
        return;
    }
    
    // 验证API配置
    if (state.apiType === 'openai') {
        if (!elements.openaiKey.value) {
            showError('请输入OpenAI API Key');
            return;
        }
        if (!elements.openaiModel.value) {
            showError('请选择模型');
            return;
        }
    }
    
    // 开始处理
    state.isProcessing = true;
    elements.submitBtn.disabled = true;
    elements.loading.style.display = 'flex';
    elements.resultSection.style.display = 'none';
    
    try {
        let result;
        if (state.apiType === 'gemini') {
            result = await processWithGemini(activeTab);
        } else {
            result = await processWithOpenAI(activeTab);
        }
        
        displayResult(result);
    } catch (error) {
        console.error('Processing error:', error);
        showError(error.message || '处理失败，请重试');
    } finally {
        state.isProcessing = false;
        elements.submitBtn.disabled = false;
        elements.loading.style.display = 'none';
    }
}

// 使用Gemini API处理
async function processWithGemini(inputType) {
    const model = elements.geminiModel.value || state.serverConfig?.defaultGeminiModel || 'gemini-1.5-flash';
    const apiKey = elements.geminiKey.value;
    
    const prompt = `你是一位专业的高中英语老师，请帮助学生修改英语作文。请按照以下格式输出：

<thinking>
[在这里详细分析作文的问题，包括语法错误、词汇使用、句式结构、逻辑连贯性等]
</thinking>

<suggestions>
[
  {
    "title": "错误类型（如：语法错误、词汇使用等）",
    "original": "原文中的错误句子或段落",
    "corrected": "修改后的正确句子或段落",
    "explanation": "详细解释为什么要这样修改"
  }
]
</suggestions>

请确保输出格式正确，以便程序解析。`;

    let content;
    if (inputType === 'text') {
        content = [
            {
                text: prompt + '\n\n作文内容：\n' + state.essayContent
            }
        ];
    } else {
        content = [
            {
                text: prompt
            },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: state.imageData.split(',')[1]
                }
            }
        ];
    }
    
    const requestBody = {
        contents: [{
            parts: content
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        }
    };
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (apiKey) {
        headers['x-goog-api-key'] = apiKey;
    }
    
    const response = await fetch(`/api/gemini/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API请求失败');
    }
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return parseGeminiResponse(text);
}

// 使用OpenAI API处理
async function processWithOpenAI(inputType) {
    const apiBase = elements.openaiBase.value || state.serverConfig?.openaiBaseUrl || 'https://api.openai.com';
    const apiKey = elements.openaiKey.value;
    const model = elements.openaiModel.value || state.serverConfig?.defaultOpenAIModel || 'gpt-4o-mini';
    
    const systemPrompt = `你是一位专业的高中英语老师，请帮助学生修改英语作文。请按照以下格式输出：

<thinking>
[在这里详细分析作文的问题，包括语法错误、词汇使用、句式结构、逻辑连贯性等]
</thinking>

<suggestions>
[
  {
    "title": "错误类型（如：语法错误、词汇使用等）",
    "original": "原文中的错误句子或段落",
    "corrected": "修改后的正确句子或段落",
    "explanation": "详细解释为什么要这样修改"
  }
]
</suggestions>

请确保输出格式正确，以便程序解析。`;

    let messages;
    if (inputType === 'text') {
        messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: '请修改以下作文：\n\n' + state.essayContent
            }
        ];
    } else {
        messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: '请修改图片中的作文：'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: state.imageData
                        }
                    }
                ]
            }
        ];
    }
    
    const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'x-api-base': apiBase
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API请求失败');
    }
    
    const data = await response.json();
    const text = data.choices[0].message.content;
    
    return parseGeminiResponse(text);
}

// 解析API响应
function parseGeminiResponse(text) {
    const result = {
        thinking: '',
        suggestions: []
    };
    
    // 提取thinking内容
    const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
        result.thinking = thinkingMatch[1].trim();
    }
    
    // 提取suggestions内容
    const suggestionsMatch = text.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
    if (suggestionsMatch) {
        try {
            result.suggestions = JSON.parse(suggestionsMatch[1].trim());
        } catch (e) {
            console.error('Failed to parse suggestions:', e);
            // 如果JSON解析失败，尝试手动解析
            result.suggestions = [{
                title: '修改建议',
                original: '',
                corrected: '',
                explanation: suggestionsMatch[1].trim()
            }];
        }
    }
    
    return result;
}

// 显示结果
function displayResult(result) {
    // 显示思考过程
    elements.thinkingText.textContent = result.thinking || '正在分析...';
    
    // 显示修改建议
    elements.suggestions.innerHTML = '';
    
    if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions.forEach((suggestion, index) => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion-item';
            suggestionEl.innerHTML = `
                <div class="suggestion-title">${index + 1}. ${suggestion.title}</div>
                ${suggestion.original ? `<div class="original-text">原文：${suggestion.original}</div>` : ''}
                ${suggestion.corrected ? `<div class="corrected-text">修改：${suggestion.corrected}</div>` : ''}
                <div class="explanation">${suggestion.explanation}</div>
            `;
            elements.suggestions.appendChild(suggestionEl);
        });
    } else {
        elements.suggestions.innerHTML = '<p>未找到需要修改的地方，作文写得很好！</p>';
    }
    
    // 显示结果区域
    elements.resultSection.style.display = 'block';
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 切换思考过程显示
function toggleThinking() {
    elements.thinkingToggle.classList.toggle('collapsed');
    elements.thinkingContent.classList.toggle('collapsed');
}

// 复制结果
function copyResult() {
    const resultText = Array.from(elements.suggestions.querySelectorAll('.suggestion-item'))
        .map((item, index) => {
            const title = item.querySelector('.suggestion-title').textContent;
            const original = item.querySelector('.original-text')?.textContent || '';
            const corrected = item.querySelector('.corrected-text')?.textContent || '';
            const explanation = item.querySelector('.explanation').textContent;
            
            return `${title}\n${original}\n${corrected}\n${explanation}`;
        })
        .join('\n\n');
    
    navigator.clipboard.writeText(resultText).then(() => {
        showSuccess('修改建议已复制到剪贴板');
    }).catch(() => {
        showError('复制失败，请手动复制');
    });
}

// 重置表单
function resetForm() {
    state.essayContent = '';
    state.imageData = null;
    
    elements.essayText.value = '';
    elements.fileInput.value = '';
    elements.uploadArea.style.display = 'block';
    elements.imagePreview.style.display = 'none';
    elements.resultSection.style.display = 'none';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 显示错误提示
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.style.display = 'block';
    
    setTimeout(() => {
        elements.errorToast.style.display = 'none';
    }, 3000);
}

// 显示成功提示
function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successToast.style.display = 'block';
    
    setTimeout(() => {
        elements.successToast.style.display = 'none';
    }, 3000);
}