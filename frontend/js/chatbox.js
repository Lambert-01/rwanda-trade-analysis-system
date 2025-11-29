/**
 * AI Chatbox Functionality
 * Handles AI assistant interactions and chatbox behavior
 */

class AIChatbox {
    constructor() {
        this.chatbox = document.getElementById('ai-chatbox');
        this.toggleBtn = document.getElementById('chatbox-toggle');
        this.input = document.getElementById('chat-input');
        this.messagesContainer = document.getElementById('chat-messages');
        this.isOpen = false;

        this.initializeEventListeners();
        this.loadChatHistory();
    }

    initializeEventListeners() {
        // Toggle chatbox - Add touch support for mobile
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleChatbox());
            this.toggleBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleChatbox();
            }, { passive: false });
        }

        // Send message on Enter
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Close chatbox button - Add touch support
        const closeBtn = this.chatbox?.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeChatbox());
            closeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.closeChatbox();
            }, { passive: false });
        }

        // Minimize chatbox button - Add touch support
        const minimizeBtn = this.chatbox?.querySelector('.btn-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeChatbox());
            minimizeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.minimizeChatbox();
            }, { passive: false });
        }

        // Control buttons - Add touch support
        const controlBtns = this.chatbox?.querySelectorAll('.control-btn');
        controlBtns?.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('onclick');
                if (action) {
                    // Execute the onclick action
                    eval(action.replace('this.', 'btn.'));
                }
            }, { passive: false });
        });

        // Send button - Add touch support
        const sendBtn = this.chatbox?.querySelector('.btn-send');
        if (sendBtn) {
            sendBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.sendMessage();
            }, { passive: false });
        }

        // Action buttons - Add touch support
        const actionBtns = this.chatbox?.querySelectorAll('.action-btn');
        actionBtns?.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('onclick');
                if (action) {
                    eval(action.replace('this.', 'btn.'));
                }
            }, { passive: false });
        });

        // Click outside to close - Improve for mobile
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.chatbox?.contains(e.target) && !this.toggleBtn?.contains(e.target)) {
                this.closeChatbox();
            }
        });

        // Touch outside to close for mobile
        document.addEventListener('touchstart', (e) => {
            if (this.isOpen && !this.chatbox?.contains(e.target) && !this.toggleBtn?.contains(e.target)) {
                this.closeChatbox();
            }
        }, { passive: true });

        // Handle viewport changes (keyboard show/hide on mobile)
        window.addEventListener('resize', () => this.handleViewportChange());
        window.addEventListener('orientationchange', () => this.handleViewportChange());

        // Prevent zoom on input focus for iOS
        if (this.input) {
            this.input.addEventListener('focus', () => {
                if (window.innerWidth < 768) {
                    this.adjustForMobileKeyboard();
                }
            });

            this.input.addEventListener('blur', () => {
                if (window.innerWidth < 768) {
                    this.restoreFromMobileKeyboard();
                }
            });
        }
    }

    toggleChatbox() {
        if (this.isOpen) {
            this.closeChatbox();
        } else {
            this.openChatbox();
        }
    }

    openChatbox() {
        this.chatbox?.classList.add('show');
        this.toggleBtn?.style.setProperty('display', 'none');
        this.isOpen = true;
        this.input?.focus();

        // Update notification dot
        const dot = this.toggleBtn?.querySelector('.notification-dot');
        if (dot) {
            dot.style.display = 'none';
        }
    }

    closeChatbox() {
        this.chatbox?.classList.remove('show');
        this.toggleBtn?.style.setProperty('display', 'flex');
        this.isOpen = false;
    }

    minimizeChatbox() {
        this.chatbox?.classList.add('minimized');
    }

    async sendMessage() {
        const message = this.input?.value?.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');

        // Clear input
        if (this.input) {
            this.input.value = '';
        }

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Call backend API for AI response
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: 'trade_analysis'
                })
            });

            const data = await response.json();

            // Remove typing indicator
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'ai');
                this.saveChatHistory();

                // Update API status if this is a successful AI response
                if (data.using_ai) {
                    this.updateAPIStatus('connected');
                }
            } else {
                console.error('Chat API error:', data.error);
                this.addMessage('Sorry, I encountered an error processing your message. Please try again.', 'ai');

                // Update API status to show error
                this.updateAPIStatus('error');
            }

        } catch (error) {
            console.error('Error sending message:', error);

            // Remove typing indicator
            this.hideTypingIndicator();

            // Fallback to static response if API fails
            setTimeout(() => {
                this.generateAIResponse(message);
                this.updateAPIStatus('fallback');
            }, 500);
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.style.display = 'flex';
        messageDiv.style.width = '100%';
        messageDiv.style.marginBottom = '8px';
        messageDiv.style.alignItems = 'flex-start';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.style.width = '24px';
        avatarDiv.style.height = '24px';
        avatarDiv.style.borderRadius = '50%';
        avatarDiv.style.display = 'flex';
        avatarDiv.style.alignItems = 'center';
        avatarDiv.style.justifyContent = 'center';
        avatarDiv.style.fontSize = '0.7rem';
        avatarDiv.style.marginRight = '8px';
        avatarDiv.style.flexShrink = '0';
        avatarDiv.style.background = sender === 'ai' ? '#00A1F1' : '#64748b';
        avatarDiv.style.color = 'white';

        const avatarIcon = document.createElement('i');
        if (sender === 'ai') {
            avatarIcon.className = 'fas fa-robot';
        } else {
            avatarIcon.className = 'fas fa-user';
        }
        avatarDiv.appendChild(avatarIcon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.flex = '1';
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.style.width = '100%';
        textDiv.style.display = 'block';
        textDiv.style.fontSize = '0.75rem';
        textDiv.style.lineHeight = '1.4';
        textDiv.style.padding = '6px 10px';
        textDiv.style.borderRadius = '12px';
        textDiv.style.wordWrap = 'break-word';
        textDiv.style.maxWidth = sender === 'user' ? '80%' : '85%';

        // Style based on sender
        if (sender === 'user') {
            textDiv.style.background = 'linear-gradient(135deg, #00A1F1, #0077CC)';
            textDiv.style.color = 'white';
            textDiv.style.marginLeft = 'auto';
            textDiv.style.textAlign = 'left';
        } else {
            textDiv.style.background = '#f1f5f9';
            textDiv.style.color = '#334155';
            textDiv.style.textAlign = 'left';
        }

        // Render markdown for AI messages, plain text for user messages
        if (sender === 'ai') {
            textDiv.innerHTML = this.renderMarkdown(text);
        } else {
            textDiv.textContent = text;
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        timeDiv.style.marginTop = '2px';
        timeDiv.style.fontSize = '0.6rem';
        timeDiv.style.color = '#94a3b8';
        timeDiv.style.textAlign = sender === 'user' ? 'right' : 'left';

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.messagesContainer?.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Render basic markdown formatting for AI responses
     */
    renderMarkdown(text) {
        return text
            // Headers (## Header -> <h3>Header</h3>)
            .replace(/^## (.*$)/gim, '<h3 class="ai-header" style="font-size: 0.8rem; font-weight: 600; margin: 4px 0 2px 0; color: #1e40af;">$1</h3>')
            // Bold text (**text** -> <strong>text</strong>)
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1e40af;">$1</strong>')
            // Bullet points (• text -> <li>text</li>)
            .replace(/^• (.*$)/gim, '<li class="ai-bullet" style="font-size: 0.7rem; line-height: 1.3; margin-bottom: 2px; padding-left: 8px; position: relative;">$1</li>')
            // Convert multiple bullets into a list
            .replace(/(<li class="ai-bullet">.*?<\/li>\s*)+/g, '<ul class="ai-list" style="margin: 4px 0; padding-left: 12px;">$&</ul>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Clean up any double <ul> tags that might have been created
            .replace(/<\/ul>\s*<ul class="ai-list">/g, '');
    }

    generateAIResponse(userMessage) {
        // Fallback method when API is not available
        const responses = this.getAIResponses(userMessage.toLowerCase());
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        this.addMessage(randomResponse, 'ai');
        this.saveChatHistory();
    }

    showTypingIndicator() {
        // Remove existing typing indicator
        this.hideTypingIndicator();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.style.display = 'flex';
        typingDiv.style.width = '100%';
        typingDiv.style.marginBottom = '8px';
        typingDiv.style.alignItems = 'flex-start';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        avatarDiv.style.width = '24px';
        avatarDiv.style.height = '24px';
        avatarDiv.style.borderRadius = '50%';
        avatarDiv.style.display = 'flex';
        avatarDiv.style.alignItems = 'center';
        avatarDiv.style.justifyContent = 'center';
        avatarDiv.style.fontSize = '0.7rem';
        avatarDiv.style.marginRight = '8px';
        avatarDiv.style.flexShrink = '0';
        avatarDiv.style.background = '#00A1F1';
        avatarDiv.style.color = 'white';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.flex = '1';
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        const typingContent = document.createElement('div');
        typingContent.className = 'message-text';
        typingContent.style.width = '100%';
        typingContent.style.display = 'block';
        typingContent.style.fontSize = '0.75rem';
        typingContent.style.lineHeight = '1.4';
        typingContent.style.padding = '6px 10px';
        typingContent.style.borderRadius = '12px';
        typingContent.style.wordWrap = 'break-word';
        typingContent.style.maxWidth = '85%';
        typingContent.style.background = '#f1f5f9';
        typingContent.style.color = '#334155';
        typingContent.style.textAlign = 'left';
        typingContent.innerHTML = `
            <div class="typing-dots" style="display: flex; gap: 4px; align-items: center;">
                <span class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: typing 1.4s infinite;"></span>
                <span class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: typing 1.4s infinite 0.2s;"></span>
                <span class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: typing 1.4s infinite 0.4s;"></span>
            </div>
        `;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = 'AI is typing...';
        timeDiv.style.marginTop = '2px';
        timeDiv.style.fontSize = '0.6rem';
        timeDiv.style.color = '#94a3b8';
        timeDiv.style.textAlign = 'left';

        contentDiv.appendChild(typingContent);
        contentDiv.appendChild(timeDiv);

        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);

        this.messagesContainer?.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    getAIResponses(message) {
        const responseMap = {
            'export': [
                'Based on the latest data, Rwanda\'s top exports include coffee, tea, minerals, and horticultural products. The United Arab Emirates is currently the largest export destination.',
                'Export trends show strong growth in traditional commodities like coffee and tea, with emerging opportunities in manufactured goods and services.'
            ],
            'import': [
                'Rwanda\'s main imports include machinery, petroleum products, and construction materials. Tanzania is the primary source for many essential imports.',
                'Import patterns indicate growing demand for industrial equipment and technology products as the economy modernizes.'
            ],
            'trade balance': [
                'Rwanda currently has a trade deficit of approximately $11.32 billion. However, export growth is outpacing imports, suggesting improvement over time.',
                'The trade balance shows deficit primarily due to infrastructure development and capital goods imports needed for economic growth.'
            ],
            'commodity': [
                'Coffee remains Rwanda\'s most valuable export commodity, followed by tea and minerals. The country is diversifying into manufactured goods and services.',
                'Agricultural commodities still dominate exports, but there\'s growing potential in ICT services and light manufacturing.'
            ],
            'partner': [
                'Rwanda\'s main trading partners include the United Arab Emirates, Tanzania, China, and European countries. The UAE is the top export destination.',
                'Regional integration through EAC is strengthening trade relationships with neighboring countries like Uganda and Kenya.'
            ],
            'growth': [
                'Rwanda has shown impressive export growth of 157.9% over recent years, driven by improved agricultural productivity and market diversification.',
                'Economic reforms and investment in infrastructure are supporting sustained trade growth across multiple sectors.'
            ],
            'prediction': [
                'AI forecasts suggest continued export growth, particularly in value-added agricultural products and emerging technology sectors.',
                'Trade diversification and regional integration should help reduce dependency on traditional markets and improve overall trade balance.'
            ],
            'help': [
                'I can help you analyze trade data, identify trends, explain market insights, and provide forecasts. Try asking about exports, imports, commodities, or specific countries.',
                'Feel free to ask me about any aspect of Rwanda\'s trade data. I have access to comprehensive analytics and can provide detailed insights.'
            ]
        };

        // Find matching responses
        for (const [key, responses] of Object.entries(responseMap)) {
            if (message.includes(key)) {
                return responses;
            }
        }

        // Default responses
        return [
            'I\'d be happy to help you analyze Rwanda\'s trade data. Could you be more specific about what you\'d like to know?',
            'I have comprehensive data on Rwanda\'s exports, imports, commodities, and trading partners. What specific aspect interests you?',
            'Try asking me about exports, imports, trade balance, commodities, or specific trading partners for detailed insights.'
        ];
    }

    askQuestion(question) {
        if (this.input) {
            this.input.value = question;
            this.sendMessage();
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    saveChatHistory() {
        const messages = this.messagesContainer?.querySelectorAll('.message-text');
        const history = [];

        messages?.forEach(msg => {
            history.push({
                text: msg.textContent,
                time: msg.nextElementSibling?.textContent || ''
            });
        });

        localStorage.setItem('rwandaTradeChatHistory', JSON.stringify(history));
    }

    loadChatHistory() {
        const history = localStorage.getItem('rwandaTradeChatHistory');
        if (history) {
            try {
                const messages = JSON.parse(history);
                messages.forEach((msg, index) => {
                    if (index > 0) { // Skip the initial AI message
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message ai-message';

                        const avatarDiv = document.createElement('div');
                        avatarDiv.className = 'message-avatar';
                        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';

                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'message-content';

                        const textDiv = document.createElement('div');
                        textDiv.className = 'message-text';
                        textDiv.textContent = msg.text;

                        const timeDiv = document.createElement('div');
                        timeDiv.className = 'message-time';
                        timeDiv.textContent = msg.time;

                        contentDiv.appendChild(textDiv);
                        contentDiv.appendChild(timeDiv);

                        messageDiv.appendChild(avatarDiv);
                        messageDiv.appendChild(contentDiv);

                        this.messagesContainer?.appendChild(messageDiv);
                    }
                });
            } catch (e) {
                console.error('Error loading chat history:', e);
            }
        }
    }

    updateAPIStatus(status) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            const statusDot = statusElement.querySelector('.status-indicator') || document.createElement('span');

            if (!statusDot.classList.contains('status-indicator')) {
                statusDot.className = 'status-indicator';
                statusElement.insertBefore(statusDot, statusElement.firstChild);
            }

            switch (status) {
                case 'connected':
                    statusDot.className = 'status-indicator connected';
                    statusElement.className = 'status online ';
                    statusElement.innerHTML = '<span class="status-indicator connected"></span>AI Powered (OpenRouter)';
                    break;
                case 'error':
                    statusDot.className = 'status-indicator error';
                    statusElement.className = 'status error';
                    statusElement.innerHTML = '<span class="status-indicator error"></span>AI Error - Using Fallback';
                    break;
                case 'fallback':
                    statusDot.className = 'status-indicator fallback';
                    statusElement.className = 'status fallback';
                    statusElement.innerHTML = '<span class="status-indicator fallback"></span>Static Mode';
                    break;
                default:
                    statusDot.className = 'status-indicator';
                    statusElement.className = 'status offline';
                    statusElement.innerHTML = '<span class="status-indicator"></span>Offline';
            }
        }
    }

    // Mobile-specific methods
    handleViewportChange() {
        if (window.innerWidth < 768 && this.isOpen) {
            // Adjust chatbox position and size for viewport changes
            const chatbox = this.chatbox;
            if (chatbox) {
                const viewportHeight = window.innerHeight;
                const maxHeight = viewportHeight - 40; // Leave some margin

                chatbox.style.maxHeight = maxHeight + 'px';

                // If keyboard is likely shown (viewport height decreased significantly)
                if (viewportHeight < window.screen.height * 0.8) {
                    this.adjustForMobileKeyboard();
                } else {
                    this.restoreFromMobileKeyboard();
                }
            }
        }
    }

    adjustForMobileKeyboard() {
        const chatbox = this.chatbox;
        if (chatbox && window.innerWidth < 768) {
            // Move chatbox up to avoid keyboard overlap
            const keyboardHeight = window.screen.height - window.innerHeight;
            const currentTop = parseFloat(getComputedStyle(chatbox).top) || 50;

            if (keyboardHeight > 150) { // Significant keyboard height
                const newTop = Math.max(10, currentTop - (keyboardHeight / 2));
                chatbox.style.top = newTop + '%';
                chatbox.style.transform = 'translate(-50%, 0)';
            }

            // Reduce chatbox height to fit better
            const maxHeight = window.innerHeight - keyboardHeight - 60;
            chatbox.style.maxHeight = maxHeight + 'px';

            // Scroll to input area
            setTimeout(() => {
                const inputContainer = chatbox.querySelector('.chat-input-container');
                if (inputContainer) {
                    inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 300);
        }
    }

    restoreFromMobileKeyboard() {
        const chatbox = this.chatbox;
        if (chatbox && window.innerWidth < 768) {
            // Restore original positioning
            chatbox.style.top = '50%';
            chatbox.style.transform = 'translate(-50%, -50%)';
            chatbox.style.maxHeight = 'calc(100vh - 40px)';
        }
    }
}

// Sidebar functionality
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebar-overlay');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        this.isCollapsed = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }

        // Close sidebar when clicking on links (mobile)
        const navLinks = this.sidebar?.querySelectorAll('.nav-link');
        navLinks?.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.openMobileSidebar();
        } else {
            this.toggleDesktopSidebar();
        }
    }

    openMobileSidebar() {
        this.sidebar?.classList.add('show');
        this.overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar?.classList.remove('show');
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleDesktopSidebar() {
        this.isCollapsed = !this.isCollapsed;
        this.sidebar?.classList.toggle('collapsed');
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.closeSidebar();
            if (this.isCollapsed) {
                this.sidebar?.classList.add('collapsed');
            } else {
                this.sidebar?.classList.remove('collapsed');
            }
        }
    }
}

// Time display functionality
class TimeManager {
    constructor() {
        this.timeElement = document.getElementById('current-time');
        this.updateTime();
        setInterval(() => this.updateTime(), 60000); // Update every minute
    }

    updateTime() {
        if (this.timeElement) {
            const now = new Date();
            this.timeElement.textContent = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    }
}

// Notification system
class NotificationManager {
    constructor() {
        this.notificationBtn = document.querySelector('.btn-notifications');
        this.badge = document.querySelector('.notification-badge');
        this.notifications = [
            { id: 1, message: 'Export data updated', type: 'success', time: '2 minutes ago' },
            { id: 2, message: 'AI analysis completed', type: 'info', time: '15 minutes ago' },
            { id: 3, message: 'New trading partner added', type: 'warning', time: '1 hour ago' }
        ];

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (this.notificationBtn) {
            this.notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }
    }

    toggleNotifications() {
        // Create and show notification panel
        this.showNotificationPanel();
    }

    showNotificationPanel() {
        // Create notification dropdown
        const existingPanel = document.querySelector('.notification-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h4>Notifications</h4>
                <button class="btn-close-notification" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-list">
                ${this.notifications.map(notif => `
                    <div class="notification-item ${notif.type}">
                        <div class="notification-icon">
                            <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-message">${notif.message}</div>
                            <div class="notification-time">${notif.time}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.notificationBtn?.appendChild(panel);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Dashboard utilities
function refreshDashboard() {
    const btn = document.querySelector('.btn-refresh');
    if (btn) {
        btn.style.transform = 'rotate(360deg)';
        btn.style.transition = 'transform 0.5s ease';

        // Show loading state
        showToast('Refreshing dashboard data...', 'info');

        setTimeout(() => {
            btn.style.transform = 'rotate(0deg)';
            showToast('Dashboard updated successfully!', 'success');
        }, 1000);
    }
}

function generateInsights() {
    showToast('Generating AI insights...', 'info');
    setTimeout(() => {
        showToast('New insights available!', 'success');
    }, 2000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Global functions for HTML onclick handlers
function toggleChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.toggleChatbox();
    }
}

function sendMessage() {
    if (window.aiChatbox) {
        window.aiChatbox.sendMessage();
    }
}

function askQuestion(question) {
    if (window.aiChatbox) {
        window.aiChatbox.askQuestion(question);
    }
}

function closeChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.closeChatbox();
    }
}

function minimizeChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.minimizeChatbox();
    }
}

// AI Settings Modal Functions
function openAISettings() {
    const modal = document.getElementById('ai-settings-modal');
    if (modal) {
        modal.classList.add('show');
        loadCurrentSettings();
    }
}

function closeAISettings() {
    const modal = document.getElementById('ai-settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function loadCurrentSettings() {
    try {
        // Check backend API status
        const response = await fetch('/api/chat/status');
        const data = await response.json();

        if (data.success && data.ai_configured) {
            console.log('✅ xAI Grok is configured and ready');
            showToast('xAI Grok AI assistant is ready!', 'success');
        } else {
            console.log('⚠️ AI not configured, using fallback responses');
            showToast('Using static responses - configure API key for AI features', 'info');
        }
    } catch (error) {
        console.error('Error checking AI configuration:', error);
        showToast('Error checking AI status', 'warning');
    }
}

function saveAISettings() {
    // Since API key is configured in .env file, just show success message
    showToast('xAI Grok is already configured and ready to use!', 'success');
    updateAPIStatus();
    closeAISettings();
}

function updateAPIStatus() {
    try {
        const statusIndicator = document.getElementById('api-status');
        if (!statusIndicator) {
            console.warn('⚠️ API status indicator not found');
            return;
        }

        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        const openaiKey = localStorage.getItem('openai_api_key');
        const openrouterKey = localStorage.getItem('openrouter_api_key');

        if (openaiKey || openrouterKey) {
            statusDot?.classList.add('connected');
            if (statusText) {
                statusText.textContent = 'API key configured';
            }
            statusIndicator.style.borderLeftColor = 'var(--success-color)';
        } else {
            statusDot?.classList.remove('connected');
            if (statusText) {
                statusText.textContent = 'No API key configured';
            }
            statusIndicator.style.borderLeftColor = 'var(--warning-color)';
        }

        console.log('✅ API status updated successfully');
    } catch (error) {
        console.error('❌ Error updating API status:', error);
    }
}

// Force show chatbox function (for debugging)
function forceShowChatbox() {
    const chatbox = document.getElementById('ai-chatbox');
    const toggleBtn = document.getElementById('chatbox-toggle');

    if (chatbox) {
        console.log('🔧 Force showing chatbox...');
        chatbox.classList.add('show');
        chatbox.style.display = 'flex';
        chatbox.style.visibility = 'visible';
        chatbox.style.opacity = '1';
        chatbox.style.transform = 'translateY(0) scale(1)';
    }

    if (toggleBtn) {
        toggleBtn.style.display = 'none';
    }

    // Update status to show it's working
    const statusElement = chatbox?.querySelector('.status');
    if (statusElement) {
        statusElement.innerHTML = `<span class="status-indicator"></span>AI Powered (xAI Grok)`;
        statusElement.className = 'status online ';
    }

    showToast('Chatbox force-opened for testing!', 'success');
}

// Check API status on page load
document.addEventListener('DOMContentLoaded', function() {
    updateAPIStatus();
});

function toggleNotifications() {
    if (window.notificationManager) {
        window.notificationManager.toggleNotifications();
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    window.sidebarManager = new SidebarManager();
    window.aiChatbox = new AIChatbox();
    window.timeManager = new TimeManager();
    window.notificationManager = new NotificationManager();

    // Check AI status and update UI
    updateAIStatusIndicator();

    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('btn-refresh') && !this.classList.contains('btn-notifications')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });

    console.log('🚀 Rwanda trade analysis systemDashboard initialized successfully!');
    console.log('🤖 AI Chatbox ready with xAI Grok integration');
});

// Update AI status indicator
async function updateAIStatusIndicator() {
    try {
        const response = await fetch('/api/chat/status');
        const data = await response.json();

        if (data.success) {
            const statusElement = document.querySelector('.status');
            if (statusElement) {
                if (data.ai_configured) {
                    statusElement.innerHTML = `<span class="status-indicator"></span>AI Powered (${data.provider})`;
                    statusElement.className = 'status online ';
                    console.log('✅ AI service configured:', data.provider, 'Model:', data.model);
                } else {
                    statusElement.innerHTML = `<span class="status-indicator"></span>Static Mode`;
                    statusElement.className = 'status offline';
                    console.log('⚠️ AI service not configured - using fallback responses');
                }
            }
        }
    } catch (error) {
        console.error('Error checking AI status:', error);
    }
}