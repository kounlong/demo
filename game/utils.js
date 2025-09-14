// 音频上下文单例
let audioContext = null;

// 音频状态管理
const audioState = {
    isSuspended: false,
    hasUserInteracted: false
};

// 初始化音频系统
function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音频上下文初始化成功');
        } catch (error) {
            console.error('音频上下文初始化失败:', error);
            return false;
        }
    }
    
    // 检查音频上下文状态
    if (audioContext.state === 'suspended' && !audioState.hasUserInteracted) {
        audioState.isSuspended = true;
        console.log('音频上下文被暂停，需要用户交互');
    }
    
    return true;
}

// 恢复音频上下文（需要用户交互）
function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        return audioContext.resume().then(() => {
            audioState.isSuspended = false;
            audioState.hasUserInteracted = true;
            console.log('音频上下文已恢复');
            return true;
        }).catch(error => {
            console.error('恢复音频上下文失败:', error);
            return false;
        });
    }
    return Promise.resolve(true);
}

// 播放音效
function playSound(type) {
    // 确保音频系统已初始化
    if (!initAudio()) {
        return;
    }
    
    // 如果音频被暂停，需要用户交互才能恢复
    if (audioState.isSuspended && !audioState.hasUserInteracted) {
        console.log('需要用户交互才能播放音效');
        return;
    }
    
    // 恢复音频上下文（如果需要）
    if (audioContext.state === 'suspended') {
        resumeAudio().then(() => {
            // 音频恢复后播放音效
            createAndPlaySound(type);
        });
    } else {
        // 直接播放音效
        createAndPlaySound(type);
    }
}

// 创建并播放特定类型的音效
function createAndPlaySound(type) {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // 设置音效参数
        let frequency, duration, waveType;
        
        switch(type) {
            case 'eat':
                frequency = 523.25; // C5
                duration = 0.1;
                waveType = 'sine';
                break;
            case 'gameOver':
                frequency = 196.00; // G3
                duration = 0.5;
                waveType = 'sawtooth';
                break;
            case 'levelUp':
                frequency = 659.25; // E5
                duration = 0.3;
                waveType = 'triangle';
                break;
            case 'move':
                frequency = 261.63; // C4
                duration = 0.05;
                waveType = 'sine';
                break;
            default:
                frequency = 440.00; // A4
                duration = 0.2;
                waveType = 'sine';
        }
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放音效
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.error('播放音效失败:', error);
    }
}

// 游戏消息显示函数
function showGameMessage(message, buttonText = null, buttonCallback = null) {
    // 移除现有的消息元素
    hideGameMessage();
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.id = 'gameMessage';
    messageContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        z-index: 1000;
        min-width: 300px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.1);
    `;
    
    // 创建消息文本
    const messageText = document.createElement('div');
    messageText.textContent = message;
    messageText.style.cssText = `
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        font-weight: bold;
    `;
    
    messageContainer.appendChild(messageText);
    
    // 如果需要按钮，创建按钮
    if (buttonText && buttonCallback) {
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // 添加悬停效果
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        
        // 添加点击事件（使用标准事件监听器）
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            buttonCallback();
        });
        
        messageContainer.appendChild(button);
    }
    
    // 添加到页面
    document.body.appendChild(messageContainer);
    
    // 添加点击背景关闭的功能
    messageContainer.addEventListener('click', (event) {
        event.stopPropagation();
    });
    
    document.addEventListener('click', function closeMessage() {
        hideGameMessage();
        document.removeEventListener('click', closeMessage);
    });
}

// 隐藏游戏消息
function hideGameMessage() {
    const existingMessage = document.getElementById('gameMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// 添加用户交互监听器（用于恢复音频）
document.addEventListener('click', function handleFirstUserInteraction() {
    if (!audioState.hasUserInteracted) {
        audioState.hasUserInteracted = true;
        resumeAudio().then(() => {
            console.log('用户交互后音频已恢复');
        });
    }
    document.removeEventListener('click', handleFirstUserInteraction);
});

// 添加触摸事件监听器
document.addEventListener('touchstart', function handleFirstTouch() {
    if (!audioState.hasUserInteracted) {
        audioState.hasUserInteracted = true;
        resumeAudio().then(() => {
            console.log('触摸交互后音频已恢复');
        });
    }
    document.removeEventListener('touchstart', handleFirstTouch);
});

// 导出函数
window.playSound = playSound;
window.showGameMessage = showGameMessage;
window.hideGameMessage = hideGameMessage;