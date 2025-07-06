// 全局状态
const state = {
    apiType: 'gemini',
    essayTitle: '',
    essayContent: '',
    imageData: null,
    titleImageData: null,
    contentImageData: null,
    isProcessing: false,
    serverConfig: null,
    apiConfigured: false,
    examType: 'gaokao',
    basePrompt: null
};

// DOM元素
const elements = {
    // API配置
    apiModal: document.getElementById('api-modal'),
    apiSettingsBtn: document.getElementById('api-settings-btn'),
    closeModal: document.getElementById('close-modal'),
    saveApiSettings: document.getElementById('save-api-settings'),
    apiTypeRadios: document.querySelectorAll('input[name="api-type"]'),
    geminiConfig: document.getElementById('gemini-config'),
    openaiConfig: document.getElementById('openai-config'),
    geminiModel: document.getElementById('gemini-model'),
    geminiKey: document.getElementById('gemini-key'),
    geminiProxy: document.getElementById('gemini-proxy'),
    geminiKeyStatus: document.getElementById('gemini-key-status'),
    openaiBase: document.getElementById('openai-base'),
    openaiKey: document.getElementById('openai-key'),
    openaiProxy: document.getElementById('openai-proxy'),
    openaiModel: document.getElementById('openai-model'),
    
    // 输入区域
    tabButtons: document.querySelectorAll('.tab-button'),
    textInput: document.getElementById('text-input'),
    imageInput: document.getElementById('image-input'),
    essayTitle: document.getElementById('essay-title'),
    essayText: document.getElementById('essay-text'),
    titleImageBtn: document.getElementById('title-image-btn'),
    titleFileInput: document.getElementById('title-file-input'),
    titleImagePreview: document.getElementById('title-image-preview'),
    titlePreviewImg: document.getElementById('title-preview-img'),
    removeTitleImage: document.getElementById('remove-title-image'),
    contentImageBtn: document.getElementById('content-image-btn'),
    contentFileInput: document.getElementById('content-file-input'),
    contentImagePreview: document.getElementById('content-image-preview'),
    contentPreviewImg: document.getElementById('content-preview-img'),
    removeContentImage: document.getElementById('remove-content-image'),
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
    await loadBasePrompt();
    initializeEventListeners();
    checkApiConfiguration();
});

// 加载基础 prompt
async function loadBasePrompt() {
    try {
        const response = await fetch('/prompt.txt');
        if (response.ok) {
            state.basePrompt = await response.text();
        }
    } catch (error) {
        console.error('Failed to load prompt.txt:', error);
        // 如果加载失败，使用默认的 prompt
        state.basePrompt = ESSAY_CORRECTION_PROMPT;
    }
}

// 加载服务器配置
async function loadServerConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            state.serverConfig = await response.json();
            
            // 如果服务器有 Gemini API Key，显示提示
            if (state.serverConfig.hasGeminiKey) {
                elements.geminiKeyStatus.textContent = '（内置）';
                elements.geminiKeyStatus.style.color = 'var(--success-color)';
                state.apiConfigured = true;
                // 设置 Gemini 模型选项
                updateGeminiModels();
            } else {
                elements.geminiKeyStatus.textContent = '（需要配置）';
                elements.geminiKeyStatus.style.color = 'var(--warning-color)';
            }
            
            // 设置默认的 OpenAI 配置
            if (state.serverConfig.openaiBaseUrl) {
                elements.openaiBase.value = state.serverConfig.openaiBaseUrl;
            }
        }
    } catch (error) {
        console.error('Failed to load server config:', error);
    }
}

// 检查 API 配置
function checkApiConfiguration() {
    // 检查本地存储的 API 配置
    const savedApiType = localStorage.getItem('apiType');
    const savedGeminiKey = localStorage.getItem('geminiKey');
    const savedOpenAIKey = localStorage.getItem('openaiKey');
    const savedExamType = localStorage.getItem('examType');
    
    if (savedApiType) {
        state.apiType = savedApiType;
        // 更新单选按钮
        document.querySelector(`input[name="api-type"][value="${savedApiType}"]`).checked = true;
    }
    
    // 恢复考试类型选择
    if (savedExamType) {
        state.examType = savedExamType;
        const examRadio = document.querySelector(`input[name="exam-type"][value="${savedExamType}"]`);
        if (examRadio) {
            examRadio.checked = true;
        }
    }
    
    if (savedGeminiKey) {
        elements.geminiKey.value = savedGeminiKey;
        state.apiConfigured = true;
        updateGeminiModels();
    }
    
    if (savedOpenAIKey) {
        elements.openaiKey.value = savedOpenAIKey;
        if (state.apiType === 'openai') {
            state.apiConfigured = true;
            loadOpenAIModels();
        }
    }
    
    // 如果没有配置 API，自动显示配置弹窗
    if (!state.apiConfigured && !state.serverConfig?.hasGeminiKey) {
        setTimeout(() => {
            showApiModal();
        }, 500);
    }
}

// 更新 Gemini 模型列表
function updateGeminiModels() {
    const models = [
        { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash（快速）' },
        { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro（推荐）' }
    ];
    
    elements.geminiModel.innerHTML = models
        .map(model => `<option value="${model.value}">${model.text}</option>`)
        .join('');
    
    // 设置默认值
    if (state.serverConfig?.defaultGeminiModel) {
        elements.geminiModel.value = state.serverConfig.defaultGeminiModel;
    } else {
        elements.geminiModel.value = 'gemini-1.5-pro';
    }
    
    // 从本地存储恢复选择
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel && elements.geminiModel.querySelector(`option[value="${savedModel}"]`)) {
        elements.geminiModel.value = savedModel;
    }
}

// 事件监听器初始化
function initializeEventListeners() {
    // API设置
    elements.apiSettingsBtn.addEventListener('click', showApiModal);
    elements.closeModal.addEventListener('click', hideApiModal);
    elements.apiModal.addEventListener('click', (e) => {
        if (e.target === elements.apiModal) hideApiModal();
    });
    elements.saveApiSettings.addEventListener('click', saveApiSettings);
    
    // API类型切换
    elements.apiTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleApiTypeChange);
    });
    
    // 考试类型切换
    const examTypeRadios = document.querySelectorAll('input[name="exam-type"]');
    examTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleExamTypeChange);
    });
    
    // 标签页切换
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
    
    // 文本输入
    elements.essayTitle.addEventListener('input', handleTitleInput);
    elements.essayText.addEventListener('input', handleTextInput);
    
    // 题目图片上传
    elements.titleImageBtn.addEventListener('click', () => elements.titleFileInput.click());
    elements.titleFileInput.addEventListener('change', handleTitleFileSelect);
    elements.removeTitleImage.addEventListener('click', removeTitleImage);
    
    // 内容图片上传
    elements.contentImageBtn.addEventListener('click', () => elements.contentFileInput.click());
    elements.contentFileInput.addEventListener('change', handleContentFileSelect);
    elements.removeContentImage.addEventListener('click', removeContentImage);
    
    // 作文图片上传（图片标签页）
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
    elements.openaiBase.addEventListener('change', () => {
        if (elements.openaiKey.value) loadOpenAIModels();
    });
    elements.openaiKey.addEventListener('change', () => {
        if (elements.openaiKey.value) loadOpenAIModels();
    });
}

// 显示API设置弹窗
function showApiModal() {
    elements.apiModal.style.display = 'flex';
    // 根据当前选择更新显示
    handleApiTypeChange();
}

// 隐藏API设置弹窗
function hideApiModal() {
    elements.apiModal.style.display = 'none';
}

// 保存API设置
function saveApiSettings() {
    const apiType = document.querySelector('input[name="api-type"]:checked').value;
    state.apiType = apiType;
    localStorage.setItem('apiType', apiType);
    
    if (apiType === 'gemini') {
        const geminiKey = elements.geminiKey.value;
        const geminiModel = elements.geminiModel.value;
        
        if (geminiKey || state.serverConfig?.hasGeminiKey) {
            localStorage.setItem('geminiKey', geminiKey);
            localStorage.setItem('geminiModel', geminiModel);
            state.apiConfigured = true;
            showSuccess('Gemini API 设置已保存');
            hideApiModal();
        } else {
            showError('请输入 Gemini API Key');
        }
    } else {
        const openaiKey = elements.openaiKey.value;
        const openaiModel = elements.openaiModel.value;
        
        if (openaiKey && openaiModel) {
            localStorage.setItem('openaiKey', openaiKey);
            localStorage.setItem('openaiModel', openaiModel);
            localStorage.setItem('openaiBase', elements.openaiBase.value);
            state.apiConfigured = true;
            showSuccess('OpenAI API 设置已保存');
            hideApiModal();
        } else {
            showError('请输入 API Key 并选择模型');
        }
    }
}

// API类型切换
function handleApiTypeChange(e) {
    const apiType = e ? e.target.value : document.querySelector('input[name="api-type"]:checked').value;
    state.apiType = apiType;
    elements.geminiConfig.style.display = apiType === 'gemini' ? 'block' : 'none';
    elements.openaiConfig.style.display = apiType === 'openai' ? 'block' : 'none';
    
    if (apiType === 'openai' && elements.openaiKey.value) {
        loadOpenAIModels();
    }
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

// 考试类型切换处理
function handleExamTypeChange(e) {
    state.examType = e.target.value;
    localStorage.setItem('examType', state.examType);
}

// 标题输入处理
function handleTitleInput(e) {
    state.essayTitle = e.target.value;
}

// 文本输入处理
function handleTextInput(e) {
    state.essayContent = e.target.value;
}

// 题目图片选择处理
function handleTitleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        readTitleImageFile(file);
    }
}

// 读取题目图片文件
function readTitleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.titleImageData = e.target.result;
        elements.titlePreviewImg.src = state.titleImageData;
        elements.titleImagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 移除题目图片
function removeTitleImage() {
    state.titleImageData = null;
    elements.titleFileInput.value = '';
    elements.titleImagePreview.style.display = 'none';
}

// 内容图片选择处理
function handleContentFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        readContentImageFile(file);
    }
}

// 读取内容图片文件
function readContentImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.contentImageData = e.target.result;
        elements.contentPreviewImg.src = state.contentImageData;
        elements.contentImagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 移除内容图片
function removeContentImage() {
    state.contentImageData = null;
    elements.contentFileInput.value = '';
    elements.contentImagePreview.style.display = 'none';
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
    const apiBase = elements.openaiBase.value;
    const apiKey = elements.openaiKey.value;
    
    if (!apiKey) {
        elements.openaiModel.innerHTML = '<option value="">请先输入API Key</option>';
        return;
    }
    
    elements.openaiModel.innerHTML = '<option value="">加载中...</option>';
    
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
        
        // 过滤并排序模型
        const gptModels = models
            .filter(model => model.id.includes('gpt'))
            .sort((a, b) => {
                // 优先显示 gpt-4 系列
                if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
                if (!a.id.includes('gpt-4') && b.id.includes('gpt-4')) return 1;
                return a.id.localeCompare(b.id);
            });
        
        if (gptModels.length > 0) {
            elements.openaiModel.innerHTML = gptModels
                .map(model => `<option value="${model.id}">${model.id}</option>`)
                .join('');
            
            // 恢复保存的选择或设置默认值
            const savedModel = localStorage.getItem('openaiModel');
            if (savedModel && elements.openaiModel.querySelector(`option[value="${savedModel}"]`)) {
                elements.openaiModel.value = savedModel;
            } else if (state.serverConfig?.defaultOpenAIModel && 
                       elements.openaiModel.querySelector(`option[value="${state.serverConfig.defaultOpenAIModel}"]`)) {
                elements.openaiModel.value = state.serverConfig.defaultOpenAIModel;
            }
        } else {
            elements.openaiModel.innerHTML = '<option value="">没有可用的模型</option>';
        }
    } catch (error) {
        console.error('Error loading models:', error);
        elements.openaiModel.innerHTML = '<option value="">加载模型失败</option>';
    }
}

// 提交处理
async function handleSubmit() {
    // 检查API配置
    if (!state.apiConfigured && !state.serverConfig?.hasGeminiKey) {
        showError('请先配置 API');
        showApiModal();
        return;
    }
    
    // 验证输入
    const activeTab = document.querySelector('.tab-button.active').dataset.tab;
    
    if (activeTab === 'text') {
        if (!state.essayContent.trim() && !state.titleImageData && !state.contentImageData) {
            showError('请输入作文内容或上传图片');
            return;
        }
    } else if (activeTab === 'image' && !state.imageData) {
        showError('请上传作文图片');
        return;
    }
    
    // 验证API配置
    if (state.apiType === 'openai') {
        if (!elements.openaiKey.value) {
            showError('请输入OpenAI API Key');
            showApiModal();
            return;
        }
        if (!elements.openaiModel.value) {
            showError('请选择模型');
            showApiModal();
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

// 获取动态调整的 prompt
function getDynamicPrompt() {
    if (!state.basePrompt) {
        return ESSAY_CORRECTION_PROMPT;
    }
    
    // 根据考试类型调整 prompt
    let prompt = state.basePrompt;
    const examTypeMap = {
        'gaokao': {
            role: '英语高考作文修改专家',
            description: '高中英语老师',
            focus: '高考英语作文'
        },
        'kaoyan': {
            role: '英语考研作文修改专家',
            description: '考研英语作文学习导师',
            focus: '考研英语作文'
        },
        'ielts': {
            role: '雅思写作修改专家',
            description: '雅思写作培训师',
            focus: '雅思写作'
        },
        'toefl': {
            role: '托福写作修改专家',
            description: '托福写作培训师',
            focus: '托福写作'
        }
    };
    
    const examInfo = examTypeMap[state.examType] || examTypeMap['gaokao'];
    
    // 替换 prompt 中的相关内容
    prompt = prompt.replace(/- Description: .*/, `- Description: ${examInfo.role}`);
    prompt = prompt.replace(/您是一位.*?，/, `您是一位耐心的${examInfo.description}，`);
    prompt = prompt.replace(/高中英语作文/g, examInfo.focus);
    prompt = prompt.replace(/高中英语老师/g, examInfo.description);
    
    return prompt;
}

// 详细的作文修改 prompt（默认）
const ESSAY_CORRECTION_PROMPT = `你是一位专业的高中英语老师，正在帮助学生修改英语作文。请严格按照以下五步流程进行修改：

## 第一步：识别并转录手写内容
如果是图片输入，请先准确识别手写内容，将其完整转录为文本。

## 第二步：理解作文要求
分析作文题目和要求，明确写作目的、体裁和关键要点。

## 第三步：整体评估
从以下维度评估作文：
- 内容完整性：是否充分回应题目要求
- 结构逻辑：段落安排是否合理，过渡是否自然
- 语言表达：词汇使用是否恰当，句式是否多样
- 语法准确性：时态、语态、主谓一致等

## 第四步：逐句修改
使用以下标记进行修改：
- 🔄 替换：将错误或不当的表达替换为更好的选择
- ➕ 添加：补充缺失的内容或连接词
- ❌ 删除：去除冗余或不当的内容

修改时请：
1. 保留原文的核心意思
2. 使修改后的文章更加地道和流畅
3. 确保语法正确性
4. 提升表达的准确性和多样性

## 第五步：提供改进建议
总结主要问题并给出具体的改进建议，帮助学生提高写作水平。

请按照以下格式输出：

<thinking>
[在这里进行详细的分析思考，包括：
- 作文题目理解
- 原文主要问题识别
- 修改思路和策略]
</thinking>

<suggestions>
[
  {
    "title": "修改类型",
    "original": "原文内容",
    "corrected": "修改后内容（使用修改标记）",
    "explanation": "修改原因说明"
  }
]
</suggestions>`;

// 使用Gemini API处理
async function processWithGemini(inputType) {
    const model = elements.geminiModel.value || 'gemini-1.5-pro';
    const apiKey = elements.geminiKey.value;
    const proxyUrl = elements.geminiProxy.value;
    
    let prompt = getDynamicPrompt();
    let content = [];
    
    // 处理题目
    if (state.essayTitle) {
        prompt += `\n\n作文题目：${state.essayTitle}`;
    }
    
    // 处理题目图片
    if (state.titleImageData) {
        content.push({
            text: '请先识别以下题目图片中的内容：'
        });
        content.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: state.titleImageData.split(',')[1]
            }
        });
    }
    
    // 处理内容图片
    if (state.contentImageData) {
        content.push({
            text: (content.length > 0 ? '\n\n' : '') + '以下是作文内容图片：'
        });
        content.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: state.contentImageData.split(',')[1]
            }
        });
    }
    
    // 处理作文内容
    if (inputType === 'text' && state.essayContent) {
        content.push({
            text: (content.length > 0 ? '\n\n' : '') + prompt + '\n\n请修改以下作文内容：\n\n' + state.essayContent
        });
    } else if (inputType === 'image' && state.imageData) {
        content.push({
            text: (content.length > 0 ? '\n\n' : '') + prompt + '\n\n请识别并修改图片中的手写作文：'
        });
        content.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: state.imageData.split(',')[1]
            }
        });
    } else if (content.length === 0) {
        // 如果只有题目图片，没有其他内容
        content = [{
            text: prompt + '\n\n请识别并修改图片中的作文（包括题目和内容）：'
        }];
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
    
    if (proxyUrl) {
        headers['x-gemini-proxy'] = proxyUrl;
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

// 使用OpenAI API处理（支持流式）
async function processWithOpenAI(inputType) {
    const apiBase = elements.openaiBase.value || 'https://api.openai.com';
    const apiKey = elements.openaiKey.value;
    const proxyUrl = elements.openaiProxy.value;
    const model = elements.openaiModel.value;
    
    let systemPrompt = getDynamicPrompt();
    if (state.essayTitle) {
        systemPrompt += `\n\n作文题目：${state.essayTitle}`;
    }
    
    let messages = [
        {
            role: 'system',
            content: systemPrompt
        }
    ];
    
    // 构建用户消息
    let userContent = [];
    
    // 处理题目图片
    if (state.titleImageData) {
        userContent.push({
            type: 'text',
            text: '请先识别以下题目图片中的内容：'
        });
        userContent.push({
            type: 'image_url',
            image_url: {
                url: state.titleImageData
            }
        });
    }
    
    // 处理内容图片
    if (state.contentImageData) {
        userContent.push({
            type: 'text',
            text: (userContent.length > 0 ? '\n\n' : '') + '以下是作文内容图片：'
        });
        userContent.push({
            type: 'image_url',
            image_url: {
                url: state.contentImageData
            }
        });
    }
    
    // 处理作文内容
    if (inputType === 'text' && state.essayContent) {
        userContent.push({
            type: 'text',
            text: (userContent.length > 0 ? '\n\n' : '') + '请修改以下作文内容：\n\n' + state.essayContent
        });
    } else if (inputType === 'image' && state.imageData) {
        userContent.push({
            type: 'text',
            text: (userContent.length > 0 ? '\n\n' : '') + '请识别并修改图片中的手写作文：'
        });
        userContent.push({
            type: 'image_url',
            image_url: {
                url: state.imageData
            }
        });
    }
    
    // 如果只有题目图片
    if (userContent.length === 2 && userContent[0].text.includes('题目图片')) {
        userContent[0].text = '请识别并修改图片中的作文（包括题目和内容）：';
    }
    
    messages.push({
        role: 'user',
        content: userContent.length === 1 ? userContent[0].text : userContent
    });
    
    const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'x-api-base': proxyUrl || apiBase
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096,
            stream: true  // 启用流式响应
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API请求失败');
    }
    
    // 处理流式响应
    return await handleStreamResponse(response, 'openai');
}

// 处理流式响应
async function handleStreamResponse(response, apiType) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // 立即显示结果区域
    elements.resultSection.style.display = 'block';
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    
    // 初始化结果
    const result = {
        thinking: '',
        suggestions: []
    };
    
    let buffer = '';
    let fullText = '';
    let isInThinking = false;
    let isInSuggestions = false;
    let thinkingBuffer = '';
    let suggestionsBuffer = '';
    
    // 清空现有内容
    elements.thinkingText.textContent = '';
    elements.suggestions.innerHTML = '<div class="stream-placeholder">AI 正在分析中...</div>';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // 处理缓冲区中的完整行
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                let content = '';
                
                if (apiType === 'openai') {
                    // OpenAI 格式：data: {...}
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const json = JSON.parse(data);
                            content = json.choices[0]?.delta?.content || '';
                        } catch (e) {
                            console.error('Failed to parse OpenAI stream:', e);
                            continue;
                        }
                    }
                } else if (apiType === 'gemini') {
                    // Gemini 格式：data: {...}
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const json = JSON.parse(data);
                            content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        } catch (e) {
                            console.error('Failed to parse Gemini stream:', e);
                            continue;
                        }
                    }
                }
                
                if (content) {
                    fullText += content;
                    
                    // 检测 thinking 标签
                    if (!isInThinking && fullText.includes('<thinking>')) {
                        isInThinking = true;
                        const startIdx = fullText.indexOf('<thinking>') + 10;
                        thinkingBuffer = fullText.substring(startIdx);
                    } else if (isInThinking && !fullText.includes('</thinking>')) {
                        thinkingBuffer += content;
                    } else if (isInThinking && fullText.includes('</thinking>')) {
                        isInThinking = false;
                        const endIdx = fullText.indexOf('</thinking>');
                        const startIdx = fullText.indexOf('<thinking>') + 10;
                        result.thinking = fullText.substring(startIdx, endIdx).trim();
                        // 实时更新思考内容
                        elements.thinkingText.textContent = result.thinking;
                    }
                    
                    // 检测 suggestions 标签
                    if (!isInSuggestions && fullText.includes('<suggestions>')) {
                        isInSuggestions = true;
                        const startIdx = fullText.indexOf('<suggestions>') + 13;
                        suggestionsBuffer = fullText.substring(startIdx);
                        // 清除占位符
                        elements.suggestions.innerHTML = '';
                    } else if (isInSuggestions && !fullText.includes('</suggestions>')) {
                        suggestionsBuffer += content;
                    } else if (isInSuggestions && fullText.includes('</suggestions>')) {
                        isInSuggestions = false;
                        const endIdx = fullText.indexOf('</suggestions>');
                        const startIdx = fullText.indexOf('<suggestions>') + 13;
                        const suggestionsText = fullText.substring(startIdx, endIdx).trim();
                        
                        try {
                            result.suggestions = JSON.parse(suggestionsText);
                            // 实时更新建议
                            displaySuggestions(result.suggestions);
                        } catch (e) {
                            console.error('Failed to parse suggestions:', e);
                        }
                    }
                    
                    // 实时更新正在处理的内容
                    if (isInThinking) {
                        elements.thinkingText.textContent = thinkingBuffer;
                        elements.thinkingText.classList.add('streaming');
                    } else {
                        elements.thinkingText.classList.remove('streaming');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Stream reading error:', error);
        throw error;
    }
    
    // 如果没有正确解析，尝试从完整文本中提取
    if (!result.thinking || result.suggestions.length === 0) {
        return parseGeminiResponse(fullText);
    }
    
    return result;
}

// 显示建议（独立函数）
function displaySuggestions(suggestions) {
    elements.suggestions.innerHTML = '';
    
    if (suggestions && suggestions.length > 0) {
        suggestions.forEach((suggestion, index) => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion-item stream-highlight';
            suggestionEl.style.animation = `fadeIn 0.3s ease-out ${index * 0.1}s both`;
            
            // 移除高亮效果
            setTimeout(() => {
                suggestionEl.classList.remove('stream-highlight');
            }, 1000);
            
            // 处理修改后的内容，确保修改标记正确显示
            const correctedHtml = suggestion.corrected ?
                suggestion.corrected
                    .replace(/🔄/g, '<span class="mark-replace">🔄</span>')
                    .replace(/➕/g, '<span class="mark-add">➕</span>')
                    .replace(/❌/g, '<span class="mark-delete">❌</span>')
                : '';
            
            suggestionEl.innerHTML = `
                <div class="suggestion-title">${index + 1}. ${suggestion.title}</div>
                ${suggestion.original ? `<div class="original-text">原文：${suggestion.original}</div>` : ''}
                ${correctedHtml ? `<div class="corrected-text">修改：${correctedHtml}</div>` : ''}
                <div class="explanation">${suggestion.explanation}</div>
            `;
            elements.suggestions.appendChild(suggestionEl);
        });
    } else {
        elements.suggestions.innerHTML = '<p>未找到需要修改的地方，作文写得很好！</p>';
    }
}

// 解析API响应（保留原有功能）
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

// 显示结果（用于非流式响应）
function displayResult(result) {
    // 显示思考过程
    elements.thinkingText.textContent = result.thinking || '正在分析...';
    
    // 显示修改建议
    displaySuggestions(result.suggestions);
    
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
    state.essayTitle = '';
    state.essayContent = '';
    state.imageData = null;
    state.titleImageData = null;
    state.contentImageData = null;
    
    elements.essayTitle.value = '';
    elements.essayText.value = '';
    elements.fileInput.value = '';
    elements.titleFileInput.value = '';
    elements.uploadArea.style.display = 'block';
    elements.imagePreview.style.display = 'none';
    elements.titleImagePreview.style.display = 'none';
    elements.contentImagePreview.style.display = 'none';
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