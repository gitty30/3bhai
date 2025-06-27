// Speech synthesis variables
let speechEnabled = true;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let cachedVoice = null; // Cache the best available voice

// Check if speech synthesis is supported
const isSpeechSupported = () => {
	return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

// Preload and cache the best available voice
function preloadBestVoice() {
	if (!isSpeechSupported()) return;
	
	const loadVoice = () => {
		const voices = speechSynthesis.getVoices();
		if (voices.length === 0) return;
		
		// Enhanced voice selection with better preferences
		let preferredVoice = null;
		
		// Priority 1: Google voices (usually better quality)
		preferredVoice = voices.find(voice => 
			voice.lang.includes('en') && 
			(voice.name.includes('Google') || voice.name.includes('Chrome'))
		);
		
		// Priority 2: Natural-sounding voices
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en') && 
				(voice.name.includes('Natural') || voice.name.includes('Premium') || voice.name.includes('Enhanced'))
			);
		}
		
		// Priority 3: Female voices (often sound more natural for AI assistants)
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en') && 
				(voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'))
			);
		}
		
		// Priority 4: Any English voice
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en')
			);
		}
		
		// Priority 5: Fallback to first available voice
		if (!preferredVoice && voices.length > 0) {
			preferredVoice = voices[0];
		}
		
		if (preferredVoice) {
			cachedVoice = preferredVoice;
			console.log('Cached voice:', preferredVoice.name);
		}
	};
	
	// Try to load immediately if voices are available
	loadVoice();
	
	// If voices aren't loaded yet, wait for them
	if (speechSynthesis.getVoices().length === 0) {
		speechSynthesis.onvoiceschanged = loadVoice;
	}
}

// Toggle speech on/off
function toggleSpeech() {
	if (!isSpeechSupported()) {
		console.warn('Speech synthesis not supported in this browser');
		return;
	}
	
	speechEnabled = !speechEnabled;
	const speechToggle = document.getElementById('speechToggle');
	
	if (speechEnabled) {
		// Update to use volume-on SVG
		speechToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume2-icon lucide-volume-2">
			<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
			<path d="M16 9a5 5 0 0 1 0 6"/>
			<path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>
		</svg>`;
		speechToggle.title = 'Disable Speech';
		speechToggle.classList.add('speech-enabled');
		speechToggle.classList.remove('speech-disabled');
	} else {
		// Update to use volume-off SVG
		speechToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-off-icon lucide-volume-off">
			<path d="M16 9a5 5 0 0 1 .95 2.293"/>
			<path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"/>
			<path d="m2 2 20 20"/>
			<path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"/>
			<path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"/>
		</svg>`;
		speechToggle.title = 'Enable Speech';
		speechToggle.classList.add('speech-disabled');
		speechToggle.classList.remove('speech-enabled');
		// Stop any current speech
		if (currentUtterance && speechSynthesis.speaking) {
			speechSynthesis.cancel();
		}
	}
	
	// Save setting
	if (typeof chrome !== 'undefined' && chrome.storage) {
		chrome.storage.local.set({speechEnabled: speechEnabled});
	}
}

// Load speech settings
function loadSpeechSettings() {
	const speechToggle = document.getElementById('speechToggle');
	
	// Check if speech synthesis is supported
	if (!isSpeechSupported()) {
		if (speechToggle) {
			speechToggle.disabled = true;
			speechToggle.title = 'Speech synthesis not supported';
			speechToggle.style.opacity = '0.5';
			speechToggle.style.cursor = 'not-allowed';
		}
		speechEnabled = false;
		return;
	}
	
	if (typeof chrome !== 'undefined' && chrome.storage) {
		chrome.storage.local.get(['speechEnabled'], function(result) {
			speechEnabled = result.speechEnabled !== false; // Default to true
			updateSpeechToggleUI();
		});
	} else {
		// Fallback for testing
		const savedSpeech = localStorage.getItem('speechEnabled');
		speechEnabled = savedSpeech !== 'false'; // Default to true
		updateSpeechToggleUI();
	}
}

// Update speech toggle UI
function updateSpeechToggleUI() {
	const speechToggle = document.getElementById('speechToggle');
	if (!speechToggle) return;
	
	if (speechEnabled) {
		// Update to use volume-on SVG
		speechToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume2-icon lucide-volume-2">
			<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
			<path d="M16 9a5 5 0 0 1 0 6"/>
			<path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>
		</svg>`;
		speechToggle.title = 'Disable Speech';
		speechToggle.classList.add('speech-enabled');
		speechToggle.classList.remove('speech-disabled');
	} else {
		// Update to use volume-off SVG
		speechToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-off-icon lucide-volume-off">
			<path d="M16 9a5 5 0 0 1 .95 2.293"/>
			<path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"/>
			<path d="m2 2 20 20"/>
			<path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"/>
			<path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"/>
		</svg>`;
		speechToggle.title = 'Enable Speech';
		speechToggle.classList.add('speech-disabled');
		speechToggle.classList.remove('speech-enabled');
	}
}

// Speak text using speech synthesis
function speakText(text) {
	if (!speechEnabled || !speechSynthesis || !isSpeechSupported()) return;
	
	// Stop any current speech
	if (speechSynthesis.speaking) {
		speechSynthesis.cancel();
	}
	
	// Create new utterance
	currentUtterance = new SpeechSynthesisUtterance(text);
	
	// Configure speech settings for faster, more natural speech
	currentUtterance.rate = 1.2; // Faster than before (was 0.9)
	currentUtterance.pitch = 1.1; // Slightly higher pitch for more natural sound
	currentUtterance.volume = 0.9; // Slightly louder
	
	// Use cached voice if available for faster performance
	if (cachedVoice) {
		currentUtterance.voice = cachedVoice;
		console.log('Using cached voice:', cachedVoice.name);
		
		// Add event listeners
		currentUtterance.onstart = () => {
			console.log('Speech started with cached voice:', cachedVoice.name);
		};
		
		currentUtterance.onend = () => {
			console.log('Speech ended');
			currentUtterance = null;
		};
		
		currentUtterance.onerror = (event) => {
			console.error('Speech error:', event.error);
			currentUtterance = null;
		};
		
		// Speak immediately with cached voice
		speechSynthesis.speak(currentUtterance);
		return;
	}
	
	// Fallback to dynamic voice selection if no cached voice
	const speakWithVoice = () => {
		const voices = speechSynthesis.getVoices();
		
		// Enhanced voice selection with better preferences
		let preferredVoice = null;
		
		// Priority 1: Google voices (usually better quality)
		preferredVoice = voices.find(voice => 
			voice.lang.includes('en') && 
			(voice.name.includes('Google') || voice.name.includes('Chrome'))
		);
		
		// Priority 2: Natural-sounding voices
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en') && 
				(voice.name.includes('Natural') || voice.name.includes('Premium') || voice.name.includes('Enhanced'))
			);
		}
		
		// Priority 3: Female voices (often sound more natural for AI assistants)
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en') && 
				(voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'))
			);
		}
		
		// Priority 4: Any English voice
		if (!preferredVoice) {
			preferredVoice = voices.find(voice => 
				voice.lang.includes('en')
			);
		}
		
		// Priority 5: Fallback to first available voice
		if (!preferredVoice && voices.length > 0) {
			preferredVoice = voices[0];
		}
		
		if (preferredVoice) {
			currentUtterance.voice = preferredVoice;
			// Cache this voice for future use
			cachedVoice = preferredVoice;
			console.log('Using voice:', preferredVoice.name);
		}
		
		// Add event listeners
		currentUtterance.onstart = () => {
			console.log('Speech started with voice:', currentUtterance.voice?.name);
		};
		
		currentUtterance.onend = () => {
			console.log('Speech ended');
			currentUtterance = null;
		};
		
		currentUtterance.onerror = (event) => {
			console.error('Speech error:', event.error);
			currentUtterance = null;
		};
		
		// Speak the text
		speechSynthesis.speak(currentUtterance);
	};
	
	// Check if voices are loaded, if not wait for them
	if (speechSynthesis.getVoices().length > 0) {
		speakWithVoice();
	} else {
		speechSynthesis.onvoiceschanged = speakWithVoice;
	}
}

// Chat functionality
console.log("chat functionality");
let chatCollapsed = false;

function toggleChat() {
	const chatMessages = document.getElementById('chatMessages');
	const chatInputContainer = document.getElementById('chatInputContainer');
	const chatToggle = document.getElementById('chatToggle');

	chatCollapsed = !chatCollapsed;

	if (chatCollapsed) {
		chatMessages.classList.add('collapsed');
		chatInputContainer.classList.add('collapsed');
		chatToggle.textContent = '▼';
	} else {
		chatMessages.classList.remove('collapsed');
		chatInputContainer.classList.remove('collapsed');
		chatToggle.textContent = '▲';
	}
}

function sendMessage() {
	const chatInput = document.getElementById('chatInput');
	const message = chatInput.value.trim();

	if (!message) return;

	// Add user message
	addMessage(message, 'user');
	chatInput.value = '';

	// Show typing indicator
	const typingIndicator = addMessage('Thinking...', 'ai');
	typingIndicator.classList.add('typing');

	// Call background script for AI response
	try {
		chrome.runtime.sendMessage({
			action: 'chatWithAI',
			message: message
		}, (response) => {
			// Remove typing indicator
			typingIndicator.remove();
			
			if (chrome.runtime.lastError) {
				console.error('Runtime error:', chrome.runtime.lastError);
				const errorMsg = 'Sorry, I encountered a connection error. Please try again.';
				addMessage(errorMsg, 'ai');
				return;
			}
			
			if (response && response.success) {
				addMessage(response.response, 'ai');
				// Speak the AI response
				speakText(response.response);
			} else {
				const errorMessage = response?.error || 'Sorry, I encountered an error. Please try again.';
				addMessage(errorMessage, 'ai');
				// Speak the error message too
				speakText(errorMessage);
			}
		});
	} catch (error) {
		// Remove typing indicator
		typingIndicator.remove();
		console.error('Error sending message:', error);
		const errorMsg = 'Sorry, I encountered an error. Please try again.';
		addMessage(errorMsg, 'ai');
		// Speak the error message
		speakText(errorMsg);
	}
}

function addMessage(text, type) {
	const chatMessages = document.getElementById('chatMessages');
	const messageDiv = document.createElement('div');
	messageDiv.className = `message ${type}`;
	messageDiv.textContent = text;

	chatMessages.appendChild(messageDiv);
	chatMessages.scrollTop = chatMessages.scrollHeight;
	
	return messageDiv;
}

function handleChatKeyPress(event) {
	if (event.key === 'Enter') {
		sendMessage();
	}
}

// Theme management
function toggleTheme() {
	const body = document.body;
	const themeIcon = document.getElementById('themeIcon');
	const currentTheme = body.getAttribute('data-theme');

	if (currentTheme === 'light') {
		body.removeAttribute('data-theme');
		// Update to use moon SVG
		themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
		</svg>`;
		// For extension: use chrome.storage instead of localStorage
		if (typeof chrome !== 'undefined' && chrome.storage) {
			chrome.storage.local.set({theme: 'dark'});
		}
	} else {
		body.setAttribute('data-theme', 'light');
		// Update to use sun SVG
		themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun">
			<circle cx="12" cy="12" r="4"/>
			<path d="M12 2v2"/>
			<path d="M12 20v2"/>
			<path d="m4.93 4.93 1.41 1.41"/>
			<path d="m17.66 17.66 1.41 1.41"/>
			<path d="M2 12h2"/>
			<path d="M20 12h2"/>
			<path d="m6.34 17.66-1.41 1.41"/>
			<path d="m19.07 4.93-1.41 1.41"/>
		</svg>`;
		// For extension: use chrome.storage instead of localStorage
		if (typeof chrome !== 'undefined' && chrome.storage) {
			chrome.storage.local.set({theme: 'light'});
		}
	}
}

// Load saved theme
function loadTheme() {
	const themeIcon = document.getElementById('themeIcon');
	
	// For extension: use chrome.storage instead of localStorage
	if (typeof chrome !== 'undefined' && chrome.storage) {
		chrome.storage.local.get(['theme'], function(result) {
			if (result.theme === 'light') {
				document.body.setAttribute('data-theme', 'light');
				// Update to use sun SVG
				themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun">
					<circle cx="12" cy="12" r="4"/>
					<path d="M12 2v2"/>
					<path d="M12 20v2"/>
					<path d="m4.93 4.93 1.41 1.41"/>
					<path d="m17.66 17.66 1.41 1.41"/>
					<path d="M2 12h2"/>
					<path d="M20 12h2"/>
					<path d="m6.34 17.66-1.41 1.41"/>
					<path d="m19.07 4.93-1.41 1.41"/>
				</svg>`;
			} else {
				// Update to use moon SVG
				themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon">
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
				</svg>`;
			}
		});
	} else {
		// Fallback for testing
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'light') {
			document.body.setAttribute('data-theme', 'light');
			// Update to use sun SVG
			themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun">
				<circle cx="12" cy="12" r="4"/>
				<path d="M12 2v2"/>
				<path d="M12 20v2"/>
				<path d="m4.93 4.93 1.41 1.41"/>
				<path d="m17.66 17.66 1.41 1.41"/>
				<path d="M2 12h2"/>
				<path d="M20 12h2"/>
				<path d="m6.34 17.66-1.41 1.41"/>
				<path d="m19.07 4.93-1.41 1.41"/>
			</svg>`;
		} else {
			// Update to use moon SVG
			themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon">
				<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
			</svg>`;
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	// Attach event listeners
	const chatSendBtn = document.getElementById('chatSend');
	if (chatSendBtn) {
		chatSendBtn.addEventListener('click', sendMessage);
	}

	const chatInput = document.getElementById('chatInput');
	if (chatInput) {
		chatInput.addEventListener('keypress', handleChatKeyPress);
	}

	// Add speech toggle button event listener if it exists
	const speechToggleBtn = document.getElementById('speechToggle');
	if (speechToggleBtn) {
		speechToggleBtn.addEventListener('click', toggleSpeech);
	}

	// Add theme toggle button event listener if it exists
	const themeToggleBtn = document.getElementById('themeIcon');
	if (themeToggleBtn) {
		themeToggleBtn.addEventListener('click', toggleTheme);
	}

	// Add close sidebar button event listener if it exists
	const closeSidebarBtn = document.getElementById('closeSidebar');
	if (closeSidebarBtn) {
		closeSidebarBtn.addEventListener('click', closeSidebar);
	}

	// Initialize with settings
	loadTheme(); // Load theme first
	loadSpeechSettings(); // Load speech settings
	preloadBestVoice(); // Preload the best available voice for faster speech

	// Speak the initial AI message after a short delay
	setTimeout(() => {
		const initialMessage = "Hello! I'm your AI security analyst. How can I help you with this profile analysis?";
		speakText(initialMessage);
	}, 2000);
});

// Utility function to check if extension context is still valid
function isExtensionContextValid() {
	try {
		return typeof chrome !== 'undefined' && 
			   chrome.runtime && 
			   chrome.runtime.id && 
			   !chrome.runtime.lastError;
	} catch (e) {
		return false;
	}
}

// Safe wrapper for chrome.runtime.sendMessage
function safeSendMessage(message) {
	if (!isExtensionContextValid()) {
		console.warn('[SIDEBAR] Extension context invalid, skipping message send');
		return Promise.resolve(null);
	}
	
	return new Promise((resolve, reject) => {
		try {
			chrome.runtime.sendMessage(message, (response) => {
				if (chrome.runtime.lastError) {
					console.warn('[SIDEBAR] Runtime error:', chrome.runtime.lastError.message);
					resolve(null);
				} else {
					resolve(response);
				}
			});
		} catch (e) {
			console.warn('[SIDEBAR] Failed to send message:', e.message);
			resolve(null);
		}
	});
}

// Close sidebar function
function closeSidebar() {
	// Send message to background script to close the sidebar
	if (typeof chrome !== 'undefined' && chrome.runtime) {
		chrome.runtime.sendMessage({
			action: 'closeSidebar'
		});
	}
}
