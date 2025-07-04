// --- PnL and Wallet Address Mapping ---
const PNL_DATA = {
  'vibed333': {
    walletAddress: 'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd',
    pnl: 211044,
    isPositive: true
  },
  'pandoraflips': {
    walletAddress: 'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm',
    pnl: 134506,
    isPositive: true
  },
  'jijo_exe': {
    walletAddress: '4BdKaxN8G6ka4GYtQQWk4G4dZRUTX2vQH9GcXdBREFUk',
    pnl: 102093,
    isPositive: true
  },
  'Latuche95': {
    walletAddress: 'GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65',
    pnl: 98750,
    isPositive: true
  },
  'Nosa1x': {
    walletAddress: 'GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65',
    pnl: 84168,
    isPositive: true
  },
  'traderpow': {
    walletAddress: '8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DFHJerQhc7Zd',
    pnl: -133854,
    isPositive: false
  },
  'CookerFlips': {
    walletAddress: '8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6',
    pnl: -121486,
    isPositive: false
  },
  'gorillacapsol': {
    walletAddress: 'DpNVrtA3ERfKzX4F8Pi2CVykdJJjoNxyY5QgoytAwD26',
    pnl: -105312,
    isPositive: false
  }
};

// --- Utility: Scrape the username from the current page (Twitter/Solana wallet, etc) ---
window.addEventListener('DOMContentLoaded', async () => {
  const tabs = await safeTabsQuery({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const tabId = tabs[0].id;
    const data = await safeTabsSendMessage(tabId, { action: 'get_profile_data' }) || {};
    updateProfileUI(data, profileData);
  } else {
    updateProfileUI({}, profileData);
  }

  // Attach CSP-safe event listeners
  document.getElementById('themeIcon')?.parentElement.addEventListener('click', toggleTheme);
  document.querySelector('.scan-button')?.addEventListener('click', scanProfile);
  document.querySelector('.close-overlay')?.addEventListener('click', closeDeepAnalysis);

  // Load theme and identity state
  loadTheme();
  updateIdentitySwitches([]);
  fetchAndUpdateTwitterData();

  // Show fallback values
  const accountAgeElement = document.getElementById('accountAge');
  const followersElement = document.getElementById('followers');
  if (accountAgeElement) accountAgeElement.textContent = profileData.accountAge;
  if (followersElement) followersElement.textContent = profileData.followers;

  // Start URL observation
  setupUrlChangeDetection();

  // Chrome storage listener
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
      const username = await getCurrentUsername();
      if (!username) return;

      const tokenKey = `token_list_${username}`;
      if (changes[tokenKey]) {
        const newData = changes[tokenKey].newValue;
        if (newData) {
          displayTokenData(newData);
        } else {
          displayNoTokenData();
        }
      }
    }
  });
});

// --- Utility: Observe URL changes using MutationObserver (for SPA navigation) ---
function observeUrlChange(callback) {
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback(lastUrl);
    }
  });
  observer.observe(document, { subtree: true, childList: true });
  return observer;
}

// Check if Chart.js is loaded
function checkChartJsLoaded() {
    return new Promise((resolve) => {
        if (typeof Chart !== 'undefined') {
            resolve(true);
            return;
        }
        
        // Wait a bit for Chart.js to load
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof Chart !== 'undefined') {
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 100);
    });
}

// --- Utility: Scrape stats for a Solana wallet user (dummy implementation) ---
function statsScrapper(walletAddress) {
  // TODO: Implement actual stats scraping logic for Solana wallet user
  // Example: fetch stats from a block explorer or API
  return {
    wallet: walletAddress,
    stats: {}, // Fill with real stats
  };
}

// Theme management
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const themeTransition = document.getElementById('themeTransition');
  const currentTheme = body.getAttribute('data-theme');

  // Define all themes with their icons and labels
  const themes = [
    { name: 'dark', icon: '🌙', label: 'Dark' },
    { name: 'light', icon: '☀️', label: 'Light' },
    { name: 'cyberpunk', icon: '🤖', label: 'Cyber' },
    { name: 'sunset', icon: '🌅', label: 'Sunset' },
    { name: 'ocean', icon: '🌊', label: 'Ocean' },
    { name: 'forest', icon: '🌲', label: 'Forest' },
    { name: 'neon', icon: '💫', label: 'Neon' }
  ];

  // Find current theme index
  let currentIndex = 0;
  if (currentTheme) {
    currentIndex = themes.findIndex(theme => theme.name === currentTheme);
    if (currentIndex === -1) currentIndex = 0;
  }

  // Move to next theme
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  // Trigger theme transition effect
  if (themeTransition) {
    themeTransition.classList.add('active');
    setTimeout(() => {
      themeTransition.classList.remove('active');
    }, 300);
  }

  // Create funky particles
  createThemeParticles();

  // Apply theme
  if (nextTheme.name === 'dark') {
    body.removeAttribute('data-theme');
  } else {
    body.setAttribute('data-theme', nextTheme.name);
  }

  // Update UI
  // themeIcon.textContent = nextTheme.icon; // Keep SVG palette icon for all themes
  themeLabel.textContent = nextTheme.label;

  // Add funky animation
  themeIcon.style.transform = 'rotate(360deg) scale(1.5)';
  setTimeout(() => {
    themeIcon.style.transform = 'rotate(0deg) scale(1)';
  }, 300);

  // Save theme preference
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({theme: nextTheme.name});
  } else {
    localStorage.setItem('theme', nextTheme.name);
  }
}

// Create funky particles for theme transitions
function createThemeParticles() {
  const particlesContainer = document.getElementById('themeParticles');
  if (!particlesContainer) return;

  // Clear existing particles
  particlesContainer.innerHTML = '';

  // Create 20 particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Random delay
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    
    // Random size
    const size = Math.random() * 6 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    particlesContainer.appendChild(particle);
  }

  // Remove particles after animation
  setTimeout(() => {
    particlesContainer.innerHTML = '';
  }, 2500);
}

// Load saved theme
function loadTheme() {
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  
  // Define all themes with their icons and labels
  const themes = [
    { name: 'dark', icon: '🌙', label: 'Dark' },
    { name: 'light', icon: '☀️', label: 'Light' },
    { name: 'cyberpunk', icon: '🤖', label: 'Cyber' },
    { name: 'sunset', icon: '🌅', label: 'Sunset' },
    { name: 'ocean', icon: '🌊', label: 'Ocean' },
    { name: 'forest', icon: '🌲', label: 'Forest' },
    { name: 'neon', icon: '💫', label: 'Neon' }
  ];
  
  // For extension: use chrome.storage instead of localStorage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['theme'], function(result) {
      const savedTheme = result.theme || 'dark';
      const theme = themes.find(t => t.name === savedTheme) || themes[0];
      
      if (theme.name !== 'dark') {
        document.body.setAttribute('data-theme', theme.name);
      }
      // themeIcon.textContent = theme.icon; // Keep SVG palette icon for all themes
      themeLabel.textContent = theme.label;
    });
  } else {
    // Fallback for testing
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const theme = themes.find(t => t.name === savedTheme) || themes[0];
    
    if (theme.name !== 'dark') {
      document.body.setAttribute('data-theme', theme.name);
    }
    // themeIcon.textContent = theme.icon; // Keep SVG palette icon for all themes
    themeLabel.textContent = theme.label;
  }
}

// Mock data for demonstration
const profileData = {
  usernameChanges: Math.floor(Math.random() * 10) + 1,
  pnl: (Math.random() - 0.5) * 10000,
  accountAge: `${Math.floor(Math.random() * 24) + 1} months`,
  activityScore: (Math.random() * 10).toFixed(1),
  followers: `${(Math.random() * 100).toFixed(1)}K`,
  walletAddress: '0x742d35Cc6634C0532925a3b8D4068' + Math.random().toString(36).substr(2, 8)
};

// Function to update Identity Switches display
function updateIdentitySwitches(usernameChangesArray) {
  const changesCount = usernameChangesArray ? usernameChangesArray.length : 0;
  const changesElement = document.getElementById('usernameChanges');
  const descElement = document.querySelector('.alert-desc');
  const alertBox = document.querySelector('.alert-box.alert-danger'); // Get the alert box
  
  // Update the count display
  if (changesElement) {
    if (changesCount === 0 && (!usernameChangesArray || usernameChangesArray.length === 0)) {
      changesElement.textContent = '...';
    } else {
      changesElement.textContent = changesCount;
    }
  }
  
  // Update the description based on count with color coding
  if (descElement) {
    if (changesCount === 0 && (!usernameChangesArray || usernameChangesArray.length === 0)) {
      descElement.textContent = 'Loading username history...';
      descElement.style.color = '#9ca3af'; // Default gray
    } else if (changesCount < 3) {
      descElement.textContent = 'Not much for a Scammer!';
      descElement.style.color = '#10b981'; // Green for low risk
    } else if (changesCount >= 3 && changesCount <= 5) {
      descElement.textContent = 'Hmmm. Suspicious!';
      descElement.style.color = '#f59e0b'; // Yellow/Orange for medium risk
    } else {
      descElement.textContent = 'Multiple aliases detected - High scam probability';
      descElement.style.color = '#ef4444'; // Red for high risk
    }
  }
  
  // Update alert box background color based on risk level
  if (alertBox) {
    if (changesCount === 0 && (!usernameChangesArray || usernameChangesArray.length === 0)) {
      // Keep default styling for loading state
      alertBox.className = 'alert-box alert-danger';
    } else if (changesCount < 3) {
      // Green background for low risk
      alertBox.className = 'alert-box alert-success';
    } else if (changesCount >= 3 && changesCount <= 5) {
      // Yellow/Orange background for medium risk
      alertBox.className = 'alert-box alert-warning';
    } else {
      // Red background for high risk
      alertBox.className = 'alert-box alert-danger';
    }
  }
  
  // Update risk level based on changes
  updateRiskLevel(changesCount);
}

function updateRiskLevel(changes) {
  const riskElement = document.getElementById('riskLevel');
  if (changes < 3) {
    riskElement.textContent = 'SECURE';
    riskElement.className = 'risk-level threat-low';
  } else if (changes >= 3 && changes <= 5) {
    riskElement.textContent = 'MODERATE';
    riskElement.className = 'risk-level threat-medium';
  } else {
    riskElement.textContent = 'CRITICAL';
    riskElement.className = 'risk-level threat-high';
  }
}

// Function to format wallet address (first 5 digits + 7 asterisks + last 4 digits)
function formatWalletAddress(address) {
  if (!address || address === 'Nil') return 'Nil';
  if (address.length <= 9) return address; // If too short, return as is
  
  const firstFive = address.substring(0, 5);
  const lastFour = address.substring(address.length - 4);
  
  return `${firstFive}*******${lastFour}`;
}

// Function to truncate address for display
function truncateAddress(address) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve();
    } catch (err) {
      textArea.remove();
      return Promise.reject(err);
    }
  }
}

// Function to create copy icon SVG
function createCopyIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="copy-icon" style="cursor: pointer; margin-left: 8px; opacity: 0.7; transition: opacity 0.3s ease;">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v4"/>
    <path d="M21 14H11"/>
    <path d="m15 10-4 4 4 4"/>
  </svg>`;
}

// Function to update PnL for a specific username
function updatePnLForUsername(username) {
  const pnlElement = document.getElementById('pnlValue');
  const pnlSection = document.getElementById('pnlSection');
  const walletElement = document.getElementById('walletAddress');
  
  if (!pnlElement || !pnlSection || !walletElement) return;
  
  const userData = PNL_DATA[username];
  
  // Debug logging
  console.log('[POPUP] Updating PnL for username:', username);
  console.log('[POPUP] User data found:', !!userData);
  
  if (userData) {
    // User found in mapping
    const formattedValue = userData.isPositive ? 
      `+$${userData.pnl.toLocaleString()}` : 
      `-$${Math.abs(userData.pnl).toLocaleString()}`;
    
    pnlElement.textContent = formattedValue;
    
    if (userData.isPositive) {
      pnlElement.classList.remove('pnl-negative');
      pnlSection.className = 'alert-box alert-success pnl-section';
    } else {
      pnlElement.classList.add('pnl-negative');
      pnlSection.className = 'alert-box alert-danger pnl-section';
    }
    
    // Update wallet address with copy functionality
    const formattedAddress = formatWalletAddress(userData.walletAddress);
    walletElement.innerHTML = `
      <span class="wallet-text">${formattedAddress}</span>
      ${createCopyIcon()}
    `;
    
    // Add click event for copy functionality
    const copyIcon = walletElement.querySelector('.copy-icon');
    if (copyIcon) {
      copyIcon.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await copyToClipboard(userData.walletAddress);
          
          // Visual feedback
          copyIcon.style.opacity = '1';
          copyIcon.style.transform = 'scale(1.2)';
          copyIcon.style.transition = 'all 0.2s ease';
          
          setTimeout(() => {
            copyIcon.style.opacity = '0.7';
            copyIcon.style.transform = 'scale(1)';
          }, 500);
          
        } catch (err) {
          console.warn('[POPUP] Failed to copy wallet address:', err);
        }
      });
    }
    
    // Show PnL section
    pnlSection.style.display = 'block';
    
  } else {
    // User not found in mapping
    pnlElement.textContent = 'N/A';
    pnlElement.classList.remove('pnl-negative');
    pnlSection.className = 'alert-box alert-success pnl-section';
    
    // Set wallet address to Nil
    walletElement.innerHTML = `
      <span class="wallet-text">Nil</span>
    `;
    
    // Show PnL section even for unknown users
    pnlSection.style.display = 'block';
  }
}

function formatAccountAge(joinDateStr) {
  if (!joinDateStr) return '';
  // joinDateStr is like 'June 2009'
  const now = new Date();
  const joinDate = new Date(joinDateStr + ' 1'); // e.g., 'June 2009 1'
  if (isNaN(joinDate.getTime())) return joinDateStr; // fallback if parse fails
  let years = now.getFullYear() - joinDate.getFullYear();
  let months = now.getMonth() - joinDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  let result = '';
  if (years > 0) result += years + ' year' + (years > 1 ? 's' : '');
  if (months > 0) {
    if (result) result += ', ';
    result += months + ' month' + (months > 1 ? 's' : '');
  }
  if (!result) result = 'Less than a month';
  return result;
}

function updateProfileUI(data, fallback) {
  // Username
  const usernameDiv = document.getElementById('username');
  if (usernameDiv) {
    usernameDiv.textContent = data.username || fallback.username || 'Not found';
  }
  
  // Username Changes Array
  if (data.usernameChangesArray) {
    updateIdentitySwitches(data.usernameChangesArray);
  }
  
  // Update PnL based on username from data
  const currentUsername = data.currentUsername || data.username;
  if (currentUsername) {
    console.log('[POPUP] Updating PnL for username:', currentUsername);
    updatePnLForUsername(currentUsername);
  }
  
  // Verification
  const verificationDiv = document.getElementById('verification');
  const verifiedIcon = document.getElementById('verifiedIcon');
  if (data.verified) {
    verificationDiv.textContent = 'Verified';
    verificationDiv.classList.remove('stat-unverified');
    verificationDiv.classList.add('stat-verified');
    if (verifiedIcon) verifiedIcon.style.display = 'inline-block';
    verificationDiv.appendChild(verifiedIcon);
  } else {
    verificationDiv.textContent = 'Unverified';
    verificationDiv.classList.remove('stat-verified');
    verificationDiv.classList.add('stat-unverified');
    if (verifiedIcon) verifiedIcon.style.display = 'none';
    verificationDiv.appendChild(verifiedIcon);
  }
  // Followers
  const followersDiv = document.getElementById('followers');
  if (followersDiv) {
    followersDiv.textContent = data.followers || fallback.followers;
  }
  // Join date (Account Age)
  const accountAgeDiv = document.getElementById('accountAge');
  if (accountAgeDiv) {
    if (data.joinDate) {
      accountAgeDiv.textContent = formatAccountAge(data.joinDate);
    } else {
      accountAgeDiv.textContent = fallback.accountAge;
    }
  }
}

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
        console.warn('[POPUP] Extension context invalid, skipping message send');
        return Promise.resolve(null);
    }
    
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                  //  console.warn('[POPUP] Runtime error:', chrome.runtime.lastError.message);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        } catch (e) {
            console.warn('[POPUP] Failed to send message:', e.message);
            resolve(null);
        }
    });
}

// Safe wrapper for chrome.tabs.sendMessage
function safeTabsSendMessage(tabId, message) {
    if (!isExtensionContextValid()) {
        console.warn('[POPUP] Extension context invalid, skipping tabs message send');
        return Promise.resolve(null);
    }
    
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[POPUP] Tabs runtime error:', chrome.runtime.lastError.message);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        } catch (e) {
            console.warn('[POPUP] Failed to send tabs message:', e.message);
            resolve(null);
        }
    });
}

// Safe wrapper for chrome.tabs.query
function safeTabsQuery(queryInfo) {
    if (!isExtensionContextValid()) {
        console.warn('[POPUP] Extension context invalid, skipping tabs query');
        return Promise.resolve([]);
    }
    
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query(queryInfo, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.warn('[POPUP] Tabs query error:', chrome.runtime.lastError.message);
                    resolve([]);
                } else {
                    resolve(tabs);
                }
            });
        } catch (e) {
            console.warn('[POPUP] Failed to query tabs:', e.message);
            resolve([]);
        }
    });
}

function scanProfile() {
    performDeepAnalysis();
}

function scrapeUserNameFromPage() {
    try {
        const url = window.location.href;
        const match = url.match(/x\.com\/([A-Za-z0-9_]+)/);
        if (match) return match[1];
        return "";
    } catch (e) {
        console.warn('[POPUP] Error scraping username:', e.message);
        return "";
    }
}

function checkVerifiedBadge() {
    try {
        return !!document.querySelector('[data-testid="icon-verified"]');
    } catch (e) {
        console.warn('[POPUP] Error checking verified badge:', e.message);
        return false;
    }
}

function sendScrapedData() {
    try {
        const username = scrapeUserNameFromPage();
        const verified = checkVerifiedBadge();
        
        safeSendMessage({
            action: "scrapedData",
            data: { username, verified }
        }).catch(e => {
            console.warn('[POPUP] Failed to send scraped data:', e.message);
        });
    } catch (e) {
        console.warn('[POPUP] Error in sendScrapedData:', e.message);
    }
}

// Global observer reference for cleanup
let urlObserver = null;

// Initialize scraping with proper error handling
function initializeScraping() {
    try {
        sendScrapedData();
        
        // Start observer with context validation
        if (urlObserver) {
            urlObserver.disconnect();
        }
        
        urlObserver = new MutationObserver((mutations) => {
            // Only process if extension context is still valid
            if (isExtensionContextValid()) {
                sendScrapedData();
            } else {
                console.warn('[POPUP] Extension context invalid, disconnecting observer');
                if (urlObserver) {
                    urlObserver.disconnect();
                    urlObserver = null;
                }
            }
        });
        
        urlObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.warn('[POPUP] Error initializing scraping:', e.message);
    }
}

// Initialize scraping
initializeScraping();

// Safe message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "scrapedData") {
            const tabId = sender.tab?.id;
            if (tabId && isExtensionContextValid()) {
                chrome.storage.local.set({ ["profile_" + tabId]: message.data }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('[POPUP] Storage error:', chrome.runtime.lastError.message);
                    }
                });
            }
        }
        if (message.action === "getTabId") {
            sendResponse({ tabId: sender.tab?.id || null });
        }
        // Listen for Twitter data updates
        if (message.action === "twitterDataFetched") {
            console.log('[POPUP] Twitter data updated:', message.data);
            updateIdentitySwitches(message.data);
        }
    } catch (e) {
        console.warn('[POPUP] Error handling message:', e.message);
        sendResponse({});
    }
});

// Cleanup on popup unload
window.addEventListener('unload', () => {
    if (urlObserver) {
        urlObserver.disconnect();
        urlObserver = null;
    }
});

// Cleanup on beforeunload
window.addEventListener('beforeunload', () => {
    if (urlObserver) {
        urlObserver.disconnect();
        urlObserver = null;
    }
});

// Dynamic scanning line effect
setInterval(() => {
    try {
        const scanElements = document.querySelectorAll('.pnl-section');
        scanElements.forEach(el => {
            if (Math.random() < 0.2) {
                el.style.background = 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)';
                setTimeout(() => {
                    el.style.background = '';
                }, 1000);
            }
        });
    } catch (e) {
        console.warn('[POPUP] Error in dynamic scanning effect:', e.message);
    }
}, 3000);

document.getElementById('side-bar').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
  });

  await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidebar.html',
      enabled: true,
  });

  await chrome.sidePanel.open({ tabId: tab.id });
  
  // Close the popup after opening the sidebar
  window.close();
});

// Function to fetch Twitter data from storage and update Identity Switches
async function fetchAndUpdateTwitterData() {
  try {
    // Get current tab to extract username
    const tabs = await safeTabsQuery({ active: true, currentWindow: true });
    if (tabs.length === 0) return;
    
    const tab = tabs[0];
    const url = tab.url;
    const match = url.match(/x\.com\/([A-Za-z0-9_]+)/);
    if (!match) return;
    
    const username = match[1];
    
    // Fetch stored Twitter data for this username
    const storageKey = `ux_twitter_${username}`;
    chrome.storage.local.get([storageKey], function(result) {
      if (result[storageKey]) {
        console.log(`[POPUP] Found Twitter data for @${username}:`, result[storageKey]);
        updateIdentitySwitches(result[storageKey]);
      } else {
        console.log(`[POPUP] No Twitter data found for @${username}`);
        // Keep the loading state or show default
        updateIdentitySwitches([]);
      }
    });
  } catch (error) {
    console.warn('[POPUP] Error fetching Twitter data:', error);
    updateIdentitySwitches([]);
  }
}

// Function to perform deep tweet analysis
async function performDeepAnalysis() {
  const overlay = document.getElementById('deepAnalysisOverlay');
  const content = overlay && overlay.querySelector('.deep-analysis-content');
  const loading = document.getElementById('analysisLoading');
  const results = document.getElementById('analysisResults');

  if (!overlay || !loading || !results) return;

  // Apply no-box styling for loading screen
  if (overlay && content) {
    overlay.classList.add('no-box');
    content.classList.add('no-box');
  }

  overlay.style.display = 'flex';
  loading.style.display = 'flex'; // Changed to flex for proper centering
  results.style.display = 'none';

  // Start the loading animation
  startAnalysisLoadingAnimation();

  try {
    const tabs = await safeTabsQuery({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      // Just start the analysis, the storage listener will handle the UI update
      await safeTabsSendMessage(tabs[0].id, { action: 'perform_deep_analysis' });
      console.log('✅ Deep analysis request sent to content script.');
    } else {
      throw new Error("No active tab found.");
    }
  } catch (error) {
    console.error('❌ Deep analysis failed:', error);
    // Hide overlay on failure
    overlay.style.display = 'none';
  }
}

// Function to update the analysis display
function updateAnalysisDisplay(data) {
    console.log('🎨 Updating analysis display with data:', data);
    
    const { tweets, analysis } = data;
    
    console.log('📊 Analysis data:', {
        tweetCount: tweets?.length || 0,
        sentiment: analysis?.sentiment,
        primaryFocus: analysis?.primaryFocus,
        overallSentiment: analysis?.overallSentiment
    });
    
    // Update profile information
    updateProfileDisplay(data);
    
    // Update sentiment analysis
    updateSentimentDisplay(analysis);
    
    // Animate the bar graphs
    animateBarGraphs(analysis);
    
    console.log('✅ Analysis display update complete');
}

// Function to update profile display
function updateProfileDisplay(data) {
    // Get profile data from the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url && tab.url.includes('x.com')) {
            try {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'get_api_profile_data'
                });
                
                if (response && response.id) {
                    // Update profile avatar
                    updateProfileAvatar(response.profile_url, response.name);
                    
                    // Update profile info
                    document.getElementById('profileName').textContent = response.name || 'Unknown';
                    document.getElementById('profileUsername').textContent = `@${response.username || 'unknown'}`;
                    
                    // Update stats
                    document.getElementById('followersCount').textContent = formatNumber(response.followers || 0);
                    document.getElementById('tweetsCount').textContent = formatNumber(response.statuses || 0);
                    
                    // Update verification badges
                    updateVerificationBadges(response);
                }
            } catch (error) {
                console.warn('Failed to get profile data:', error);
                // Use fallback data
                document.getElementById('profileName').textContent = 'Profile Data Unavailable';
                document.getElementById('profileUsername').textContent = '@unknown';
            }
        }
    });
}

// Function to update profile avatar
function updateProfileAvatar(profileUrl, name) {
    const avatarElement = document.getElementById('profileAvatar');
    
    if (profileUrl && profileUrl.trim() !== '') {
        const img = new Image();
        img.onload = function() {
            avatarElement.innerHTML = '';
            avatarElement.appendChild(img);
            avatarElement.classList.remove('fallback');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
        };
        img.onerror = function() {
            avatarElement.textContent = createFallbackAvatar(name);
            avatarElement.classList.add('fallback');
        };
        img.src = profileUrl;
    } else {
        avatarElement.textContent = createFallbackAvatar(name);
        avatarElement.classList.add('fallback');
    }
}

// Function to create fallback avatar
function createFallbackAvatar(name) {
    const initials = name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    return initials;
}

// Function to update verification badges
function updateVerificationBadges(profileData) {
    const badgesContainer = document.getElementById('verificationBadges');
    badgesContainer.innerHTML = '';
    
    if (profileData.blue_verified) {
        badgesContainer.innerHTML += '<span class="badge blue-verified">Blue ✓</span>';
    }
    if (!profileData.phone_verified) {
        badgesContainer.innerHTML += '<span class="badge suspicious">Phone ⚠</span>';
    }
    if (profileData.verified) {
        badgesContainer.innerHTML += '<span class="badge blue-verified">Verified ✓</span>';
    }
}

// Function to update sentiment display
function updateSentimentDisplay(analysis) {
    const bullish = analysis.sentiment.bullish || 0;
    const bearish = analysis.sentiment.bearish || 0;
    const neutral = analysis.sentiment.neutral || 0;
    const total = bullish + bearish + neutral;
    
    // Update values in the bars (counts are now shown on the right)
    document.getElementById('bullishCount').textContent = bullish;
    document.getElementById('bearishCount').textContent = bearish;
    document.getElementById('neutralCount').textContent = neutral;
    
    // Update overall sentiment
    const overallElement = document.getElementById('overallSentiment');
    const overallValue = document.getElementById('overallValue');
    
    overallElement.className = `overall-sentiment ${analysis.overallSentiment}`;
    overallValue.textContent = analysis.overallSentiment.toUpperCase();
    
    // Update content analysis
    document.getElementById('primaryFocus').textContent = analysis.primaryFocus.toUpperCase();
    
    const adviceText = analysis.financialAdviceCount === 1 ? '1 tweet' : `${analysis.financialAdviceCount} tweets`;
    document.getElementById('financialAdvice').textContent = adviceText;
    document.getElementById('totalTweets').textContent = `${total} tweets`;
}

// Function to animate bar graphs
function animateBarGraphs(analysis) {
    console.log('📈 Starting bar graph animations...');
    
    const bullish = analysis.sentiment.bullish || 0;
    const bearish = analysis.sentiment.bearish || 0;
    const neutral = analysis.sentiment.neutral || 0;
    const total = bullish + bearish + neutral;
    
    // Calculate percentages - only show fill if value > 0
    let bullishPercent = 0;
    let bearishPercent = 0;
    let neutralPercent = 0;
    
    if (total > 0) {
        // Only show bars for values > 0
        if (bullish > 0) {
            bullishPercent = (bullish / total) * 100;
        }
        if (bearish > 0) {
            bearishPercent = (bearish / total) * 100;
        }
        if (neutral > 0) {
            neutralPercent = (neutral / total) * 100;
        }
        
        // If only one bar is nonzero, make it 100%
        const nonZeroBars = [bullish, neutral, bearish].filter(v => v > 0).length;
        if (nonZeroBars === 1) {
            if (bullish > 0) {
                bullishPercent = 100;
            } else if (neutral > 0) {
                neutralPercent = 100;
            } else if (bearish > 0) {
                bearishPercent = 100;
            }
        }
    }

    console.log('📊 Animating bars:', { 
        bullish, bearish, neutral, total,
        bullishPercent, bearishPercent, neutralPercent 
    });
    
    // Get bar elements
    const bullishBar = document.getElementById('bullishBar');
    const neutralBar = document.getElementById('neutralBar');
    const bearishBar = document.getElementById('bearishBar');
    
    console.log('🎯 Bar elements found:', {
        bullish: !!bullishBar,
        neutral: !!neutralBar,
        bearish: !!bearishBar
    });
    
    // Set initial width to 0 then animate
    if (bullishBar) bullishBar.style.width = '0%';
    if (neutralBar) neutralBar.style.width = '0%';
    if (bearishBar) bearishBar.style.width = '0%';
    
    // Animate bars with staggered timing
    setTimeout(() => {
        if (bullishBar) {
            bullishBar.style.width = `${bullishPercent}%`;
            console.log('✅ Bullish bar animated to', bullishPercent + '%');
        }
    }, 300);
    
    setTimeout(() => {
        if (neutralBar) {
            neutralBar.style.width = `${neutralPercent}%`;
            console.log('✅ Neutral bar animated to', neutralPercent + '%');
        }
    }, 600);
    
    setTimeout(() => {
        if (bearishBar) {
            bearishBar.style.width = `${bearishPercent}%`;
            console.log('✅ Bearish bar animated to', bearishPercent + '%');
        }
    }, 900);
    
    console.log('🎬 Bar animations scheduled');
}

// Utility function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function closeDeepAnalysis() {
    const overlay = document.getElementById('deepAnalysisOverlay');
    overlay.style.display = 'none';
    
    // Clean up charts safely
    if (window.sentimentChart && typeof window.sentimentChart.destroy === 'function') {
        window.sentimentChart.destroy();
        window.sentimentChart = null;
    }
    if (window.focusChart && typeof window.focusChart.destroy === 'function') {
        window.focusChart.destroy();
        window.focusChart = null;
    }
}

// Test function to manually show the overlay
function testOverlay() {
    console.log('🧪 Testing overlay display...');
    
    const overlayElement = document.getElementById('deepAnalysisOverlay');
    const loadingElement = document.getElementById('analysisLoading');
    const resultsElement = document.getElementById('analysisResults');
    
    console.log('📋 Elements found:', {
        overlay: !!overlayElement,
        loading: !!loadingElement,
        results: !!resultsElement
    });
    
    if (overlayElement) {
        overlayElement.style.display = 'flex';
        console.log('✅ Overlay should be visible now');
        
        // Test with sample data
        setTimeout(() => {
            if (loadingElement) loadingElement.style.display = 'none';
            if (resultsElement) resultsElement.style.display = 'block';
            
            // Test with sample analysis data
            const sampleData = {
                tweets: ['Sample tweet 1', 'Sample tweet 2'],
                analysis: {
                    sentiment: { bullish: 5, bearish: 2, neutral: 3 },
                    primaryFocus: 'memecoin',
                    financialAdviceCount: 1,
                    overallSentiment: 'bullish'
                }
            };
            
            updateAnalysisDisplay(sampleData);
        }, 2000);
    } else {
        console.error('❌ Overlay element not found!');
    }
}

// Make test function available globally
window.testOverlay = testOverlay;

// Function to set up URL change detection
function setupUrlChangeDetection() {
  // The PnL will be updated automatically when the profile data changes
  // through the existing message passing system, so we don't need complex URL monitoring
  console.log('[POPUP] PnL will be updated automatically with profile data changes');
}

// Function to refresh PnL data (can be called manually)
function refreshPnLData() {
  // This will be handled automatically through the profile data system
  console.log('[POPUP] PnL refresh requested - will be handled by profile data updates');
}

// Test function to verify PnL functionality
function testPnLFunctionality() {
  console.log('[POPUP] Testing PnL functionality...');
  
  // Test with known users
  const testUsers = ['vibed333', 'traderpow', 'unknown_user'];
  
  testUsers.forEach((username, index) => {
    setTimeout(() => {
      console.log(`[POPUP] Testing with username: ${username}`);
      updatePnLForUsername(username);
    }, index * 2000);
  });
}

// Make test functions available globally
window.testPnLFunctionality = testPnLFunctionality;
window.refreshPnLData = refreshPnLData;

// Simple test function for immediate testing
window.testPnLWithUser = function(username) {
  console.log(`[POPUP] Testing PnL with user: ${username}`);
  const userData = PNL_DATA[username];
  console.log('[POPUP] User data:', userData);
  
  if (userData) {
    console.log(`[POPUP] Should show: ${userData.isPositive ? '+' : '-'}$${Math.abs(userData.pnl).toLocaleString()}`);
    console.log(`[POPUP] Wallet: ${formatWalletAddress(userData.walletAddress)}`);
  } else {
    console.log('[POPUP] Should show: N/A and Nil');
  }
  
  // Update PnL for the username
  updatePnLForUsername(username);
};

// Test function to verify content script communication
window.testContentScriptCommunication = async function() {
  console.log('[POPUP] Testing content script communication...');
  
  try {
    const tabs = await safeTabsQuery({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      console.log('[POPUP] Current tab:', tabs[0].url);
      
      const response = await safeTabsSendMessage(tabs[0].id, { action: 'get_profile_data' });
      console.log('[POPUP] Content script response:', response);
      
      if (response && response.currentUsername) {
        console.log('[POPUP] Username from content script:', response.currentUsername);
        return response.currentUsername;
      } else {
        console.log('[POPUP] No username in response');
        return null;
      }
    } else {
      console.log('[POPUP] No active tabs found');
      return null;
    }
  } catch (err) {
    console.error('[POPUP] Error testing content script communication:', err);
    return null;
  }
};

// ===== WALLET AND TOKEN DATA FUNCTIONS =====

// Global variables for wallet and token data
let currentWalletData = null;
let currentTokenData = null;
let currentUsername = null;

// Initialize wallet and token data loading
async function initializeWalletTokenData() {
  const username = await getCurrentUsername();
  console.log('[POPUP] initializeWalletTokenData username:', username);
  if (username) {
    console.log(`🚀 Initializing data for ${username}...`);
    currentUsername = username;
    
    // Load wallet data
    await loadWalletData(username);
    
    await loadTokenData(username);
    // Load token data - try multiple times if needed
    // let tokenDataLoaded = false;
    // for (let i = 0; i < 8; i++) {
    //   console.log("i ye hai dekh -> ", i)
    //   try {
    //     const response = await safeSendMessage({
    //       action: 'getTokenData',
    //       username: username
    //     });
    //     console.log("ANSWER AAGYA ye hai dekh -> ", response)
    //     console.log('[POPUP] getTokenData response:', response);
    //     if (response && response.data) {
    //       console.log('[POPUP] Token data loaded:', response.data);
    //       currentTokenData = response.data;
    //       displayTokenData(response.data);
    //       tokenDataLoaded = true;
    //       break;
    //     }
    //   } catch (error) {
    //     console.log(`[POPUP] Attempt ${i + 1} to load token data failed:`, error);
    //   }
      
    //   if (!tokenDataLoaded && i < 2) {
    //     // Wait a bit before retrying
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //   }
    // }
    
    // if (!tokenDataLoaded) {
    //   console.log('[POPUP] No token data found after retries');
    //   displayNoTokenData();
    // }
  } else {
    console.log('🤷 No username found, displaying default state. !!!!!!!!!!!!!');
    displayNoWalletData();
    displayNoTokenData();
  }
}

// Get current username from various sources
async function getCurrentUsername() {
  try {
    // Try to get from URL first
    const tabs = await safeTabsQuery({ active: true, currentWindow: true });
    if (tabs.length === 0) return null;
    
    const tab = tabs[0];
    if (tab.url) {
      const urlMatch = tab.url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1] && !urlMatch[1].includes('.')) {
        return urlMatch[1];
      }
    }
    
    // Try to get from content script
    try {
      const response = await safeTabsSendMessage(tab.id, { action: 'get_username' });
      if (response && response.username) {
        return response.username;
      }
    } catch (err) {
      console.log('[POPUP] Content script not available for username');
    }
    
    // Try to get from stored profile data
    try {
      const profileResponse = await safeSendMessage({ action: 'getAxiomData' });
      if (profileResponse && profileResponse.username) {
        return profileResponse.username;
      }
    } catch (err) {
      console.log('[POPUP] No stored profile data available');
    }
    
    return null;
  } catch (error) {
    console.error('[POPUP] Error getting username:', error);
    return null;
  }
}

// Load wallet data for a username
async function loadWalletData(username) {
  console.log('[POPUP] Loading wallet data for:', username);
  
  try {
    const response = await safeSendMessage({
      action: 'getWalletData',
      username: username
    });
    
    if (response && response.success && response.data) {
      currentWalletData = response.data;
      displayWalletData(response.data);
      console.log('[POPUP] Wallet data loaded:', response.data);
    } else {
      console.log('[POPUP] No wallet data found for:', username);
      displayNoWalletData();
    }
  } catch (error) {
    console.error('[POPUP] Error loading wallet data:', error);
    displayWalletError(error.message);
  }
}

// Load token data for a username
async function loadTokenData(username, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second delay between retries
  
  console.log(`[POPUP] Loading token data for: ${username} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  try {
    const cachedTokenData = await chrome.storage.local.get(`token_list_${username}`);
    const tokenObject = cachedTokenData[`token_list_${username}`];

    if (tokenObject && tokenObject.data) {
      currentTokenData = tokenObject;
      displayTokenData(tokenObject);  // ✅ correct extraction
      console.log('[POPUP] Token data loaded from cache:', tokenObject);
      return;
    }

    const response = await safeSendMessage({
      action: 'getTokenData',
      username: username
    });
    console.log('[POPUP] Token data response:', response);

    // Check if we have an error response
    if (!response || !response.success) {
      const errorMsg = response?.error || 'Failed to load token data';
      console.log(`[POPUP] Token data error on attempt ${retryCount + 1}:`, errorMsg);
      
      // If we haven't reached max retries, try again
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`[POPUP] Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadTokenData(username, retryCount + 1);
      }
      
      // If we've exhausted all retries, show error
      console.error('[POPUP] Token data error after all retries:', errorMsg);
      displayTokenError(errorMsg);
      return;
    }

    // Check if we have valid data
    if (response.data && response.data.data) {
      currentTokenData = response.data;  // Store just the data portion
      displayTokenData(response.data);   // Pass just the data portion
      console.log('[POPUP] Token data loaded:', response.data);
    } else if (retryCount < MAX_RETRIES - 1) {
      // If no data but retries remaining, try again
      console.log(`[POPUP] No data yet, retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return loadTokenData(username, retryCount + 1);
    } else {
      console.log('[POPUP] No token data found after all retries for:', username);
      displayNoTokenData();
    }
  } catch (error) {
    console.error(`[POPUP] Error loading token data (attempt ${retryCount + 1}):`, error);
    
    // Retry on error if attempts remain
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`[POPUP] Retrying after error in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return loadTokenData(username, retryCount + 1);
    } else {
      displayTokenError(error.message);
    }
  }
}

// Display wallet data in the UI
function displayWalletData(walletData) {
  const walletPanel = document.getElementById('walletPanel');
  const walletList = document.getElementById('walletList');
  
  if (!walletPanel || !walletList) return;
  
  // Show the panel
  walletPanel.style.display = 'block';
  
  // Clear loading state
  walletList.innerHTML = '';
  
  const data = walletData.data || walletData;
  
  if (!data || Object.keys(data).length === 0) {
    displayNoWalletData();
    return;
  }
  
  // Group wallets by date and display
  Object.keys(data).sort().reverse().forEach(date => {
    const wallets = data[date];
    if (!wallets || wallets.length === 0) return;
    
    // Create date group
    const dateGroup = document.createElement('div');
    dateGroup.className = 'date-group';
    
    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header';
    dateHeader.textContent = formatDateForDisplay(date);
    dateGroup.appendChild(dateHeader);
    
    // Add wallets for this date
    wallets.forEach(walletInfo => {
      const walletItem = createWalletItem(walletInfo, date);
      dateGroup.appendChild(walletItem);
    });
    
    walletList.appendChild(dateGroup);
  });
}

// Create a wallet item element
function createWalletItem(walletInfo, date) {
  const address = walletInfo.address || walletInfo;
  const pnlData = walletInfo.pnlData;
  const error = walletInfo.error;
  
  const walletItem = document.createElement('div');
  walletItem.className = 'wallet-item';
  
  const header = document.createElement('div');
  header.className = 'wallet-header';
  
  const addressDisplay = document.createElement('div');
  addressDisplay.className = 'wallet-address-display';
  addressDisplay.textContent = formatWalletAddress(address);
  
  const dateBadge = document.createElement('div');
  dateBadge.className = 'wallet-date';
  dateBadge.textContent = formatDateForDisplay(date);
  
  const copyButton = document.createElement('div');
  copyButton.className = 'wallet-copy';
  copyButton.innerHTML = '📋';
  copyButton.title = 'Copy wallet address';
  copyButton.addEventListener('click', () => copyWalletAddress(address));
  
  const refreshButton = document.createElement('button');
  refreshButton.className = 'wallet-refresh';
  refreshButton.textContent = '🔄';
  refreshButton.title = 'Refresh PnL';
  refreshButton.addEventListener('click', () => refreshWalletPnL(address));
  
  header.appendChild(addressDisplay);
  header.appendChild(dateBadge);
  header.appendChild(copyButton);
  header.appendChild(refreshButton);
  
  walletItem.appendChild(header);
  
  if (error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'wallet-error';
    errorDiv.textContent = `Error: ${error}`;
    walletItem.appendChild(errorDiv);
  } else if (pnlData) {
    const pnlMetrics = createPnLMetrics(pnlData);
    walletItem.appendChild(pnlMetrics);
  } else {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'wallet-loading';
    loadingDiv.innerHTML = '<div class="spinner"></div><p>Loading PnL...</p>';
    walletItem.appendChild(loadingDiv);
  }
  
  return walletItem;
}

// Create comprehensive PnL metrics display
function createPnLMetrics(pnlData) {
  const container = document.createElement('div');
  
  // Main PnL summary with unrealized gains
  const summary = document.createElement('div');
  summary.className = 'pnl-summary';
  
  const summaryHeader = document.createElement('div');
  summaryHeader.className = 'pnl-summary-header';
  summaryHeader.textContent = 'Realized P&L';
  
  const summaryValue = document.createElement('div');
  summaryValue.className = 'pnl-summary-value';
  
  const pnlValue = pnlData.totalPnL || 0;
  const pnlPercentage = pnlData.pnlPercentage || 0;
  const unrealizedPnL = pnlData.unrealizedPnL || 0;
  
  summaryValue.innerHTML = `
    ${formatPnLValue(pnlValue)} SOL
    <span class="pnl-percentage">(${formatPercentage(pnlPercentage)})</span>
  `;
  
  if (pnlValue > 0) {
    summaryValue.classList.add('pnl-positive');
  } else if (pnlValue < 0) {
    summaryValue.classList.add('pnl-negative');
  } else {
    summaryValue.classList.add('pnl-neutral');
  }
  
  summary.appendChild(summaryHeader);
  summary.appendChild(summaryValue);
  
  // Add unrealized PnL if significant (greater than 0.01 SOL)
  if (Math.abs(unrealizedPnL) > 0.01) {
    const unrealizedDiv = document.createElement('div');
    unrealizedDiv.className = 'pnl-unrealized';
    unrealizedDiv.innerHTML = `
      <span style="font-size: 10px; color: var(--text-secondary);">Unrealized: </span>
      <span class="${unrealizedPnL > 0 ? 'pnl-positive' : 'pnl-negative'}" style="font-size: 11px; font-weight: 600;">
        ${formatPnLValue(unrealizedPnL)} SOL
      </span>
    `;
    summary.appendChild(unrealizedDiv);
  }
  
  container.appendChild(summary);
  
  // Enhanced metrics grid with more data
  const metricsGrid = document.createElement('div');
  metricsGrid.className = 'pnl-metrics';
  
  const totalAssets = pnlData.totalAssets || 0;
  const feePaid = pnlData.feePaid || 0;
  const currentBalance = pnlData.currentBalance || 0;
  const invested = pnlData.invested || 0;
  
  const metrics = [
    { 
      label: 'Balance', 
      value: `${formatLargeNumber(currentBalance)} SOL`,
      color: currentBalance > invested ? 'pnl-positive' : 'pnl-neutral'
    },
    { 
      label: 'Invested', 
      value: `${formatLargeNumber(invested)} SOL`,
      color: 'pnl-neutral'
    },
    { 
      label: 'Win Rate', 
      value: `${(pnlData.winRate || 0).toFixed(1)}%`,
      color: (pnlData.winRate || 0) > 50 ? 'pnl-positive' : 'pnl-negative'
    },
    { 
      label: 'Portfolio Value', 
      value: formatLargeNumber(totalAssets),
      color: 'pnl-positive',
      tooltip: 'Total portfolio value including all token holdings'
    },
    { 
      label: 'Wins/Losses', 
      value: `${pnlData.totalWins || 0}/${pnlData.totalLosses || 0}`,
      color: (pnlData.totalWins || 0) > (pnlData.totalLosses || 0) ? 'pnl-positive' : 'pnl-negative'
    },
    { 
      label: 'Fees Paid', 
      value: `${feePaid.toFixed(3)} SOL`,
      color: 'pnl-negative'
    },
    { 
      label: 'Unique Tokens', 
      value: `${pnlData.uniqueTokens || 0}`,
      color: pnlData.uniqueTokens > 500 ? 'pnl-positive' : 'pnl-neutral',
      tooltip: 'Total different tokens traded'
    },
    { 
      label: 'Total Trades', 
      value: `${(pnlData.totalWins || 0) + (pnlData.totalLosses || 0)}`,
      color: 'pnl-neutral'
    }
  ];
  
  metrics.forEach(metric => {
    const metricDiv = document.createElement('div');
    metricDiv.className = 'pnl-metric';
    if (metric.tooltip) {
      metricDiv.title = metric.tooltip;
    }
    
    const label = document.createElement('div');
    label.className = 'pnl-metric-label';
    label.textContent = metric.label;
    
    const value = document.createElement('div');
    value.className = `pnl-metric-value ${metric.color || ''}`;
    value.textContent = metric.value;
    
    metricDiv.appendChild(label);
    metricDiv.appendChild(value);
    metricsGrid.appendChild(metricDiv);
  });
  
  container.appendChild(metricsGrid);
  
  // Trading performance insights
  if (pnlData.topPerformers || pnlData.recentTrades || pnlData.dailyProfit) {
    const insightsSection = createTradingInsights(pnlData);
    container.appendChild(insightsSection);
  }
  
  return container;
}

// Create trading insights section
function createTradingInsights(pnlData) {
  const insights = document.createElement('div');
  insights.className = 'trading-insights';
  
  const header = document.createElement('div');
  header.className = 'insights-header';
  header.textContent = '📊 Trading Insights';
  insights.appendChild(header);
  
  // Recent activity summary
  if (pnlData.recentTrades && pnlData.recentTrades.length > 0) {
    const recentSection = document.createElement('div');
    recentSection.className = 'insight-item';
    
    const recentTrades = pnlData.recentTrades.slice(0, 5); // Last 5 trades
    const recentWins = recentTrades.filter(trade => {
      const profit = trade.pnl || trade.profit || 0;
      return profit > 0;
    }).length;
    const recentPnL = recentTrades.reduce((sum, trade) => {
      return sum + (trade.pnl || trade.profit || 0);
    }, 0);
    
    recentSection.innerHTML = `
      <div class="insight-label">Recent Activity (Last 5 trades)</div>
      <div class="insight-value">
        ${recentWins}/${recentTrades.length} wins, ${formatPnLValue(recentPnL)} SOL
        <span class="${recentPnL > 0 ? 'pnl-positive' : 'pnl-negative'}" style="margin-left: 4px;">
          ${recentPnL > 0 ? '📈' : '📉'}
        </span>
      </div>
    `;
    
    insights.appendChild(recentSection);
  }
  
  // Top performing tokens
  if (pnlData.topPerformers && Object.keys(pnlData.topPerformers).length > 0) {
    const topSection = document.createElement('div');
    topSection.className = 'insight-item';
    
    const topTokens = Object.entries(pnlData.topPerformers).slice(0, 2);
    
    topSection.innerHTML = `
      <div class="insight-label">🏆 Top Performers</div>
      <div class="insight-value" style="font-size: 10px;">
        ${topTokens.map(([token, data]) => 
          `${token.substring(0, 8)}... (+${formatPnLValue(data.profit || 0)})`
        ).join(', ')}
      </div>
    `;
    
    insights.appendChild(topSection);
  }
  
  // Daily profit trend (last 7 days)
  if (pnlData.dailyProfit && Object.keys(pnlData.dailyProfit).length > 0) {
    const dailySection = document.createElement('div');
    dailySection.className = 'insight-item';
    
    const dailyEntries = Object.entries(pnlData.dailyProfit)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 7);
    
    const totalWeeklyPnL = dailyEntries.reduce((sum, [, pnl]) => sum + (pnl || 0), 0);
    const positiveDays = dailyEntries.filter(([, pnl]) => (pnl || 0) > 0).length;
    
    dailySection.innerHTML = `
      <div class="insight-label">📅 Weekly Trend (Last 7 days)</div>
      <div class="insight-value">
        ${positiveDays}/${dailyEntries.length} green days, ${formatPnLValue(totalWeeklyPnL)} SOL
        <span class="${totalWeeklyPnL > 0 ? 'pnl-positive' : 'pnl-negative'}" style="margin-left: 4px;">
          ${totalWeeklyPnL > 0 ? '🔥' : '❄️'}
        </span>
      </div>
    `;
    
    insights.appendChild(dailySection);
  }
  
  // Token performance distribution using actual win/loss data
  if (pnlData.totalWins !== undefined && pnlData.totalLosses !== undefined) {
    const distSection = document.createElement('div');
    distSection.className = 'insight-item';
    
    const totalTrades = pnlData.totalWins + pnlData.totalLosses;
    const winRate = pnlData.winRate || 0;
    
    distSection.innerHTML = `
      <div class="insight-label">🎯 Trade Success Rate</div>
      <div class="insight-value">
        ${pnlData.totalWins}/${totalTrades} trades won (${winRate.toFixed(1)}%)
        <span class="${winRate > 50 ? 'pnl-positive' : 'pnl-negative'}" style="margin-left: 4px;">
          ${winRate > 50 ? '🔥' : '❄️'}
        </span>
      </div>
    `;
    
    insights.appendChild(distSection);
  }
  
  // Worst performing tokens (if available)
  if (pnlData.underPerformers && Object.keys(pnlData.underPerformers).length > 0) {
    const worstSection = document.createElement('div');
    worstSection.className = 'insight-item';
    
    const worstTokens = Object.entries(pnlData.underPerformers).slice(0, 2);
    
    worstSection.innerHTML = `
      <div class="insight-label">💩 Worst Performers</div>
      <div class="insight-value" style="font-size: 10px;">
        ${worstTokens.map(([token, data]) => 
          `${token.substring(0, 8)}... (${formatPnLValue(data.profit || data.loss || 0)})`
        ).join(', ')}
      </div>
    `;
    
    insights.appendChild(worstSection);
  }
  
  // Token diversity insight
  if (pnlData.uniqueTokens && pnlData.totalWins && pnlData.totalLosses) {
    const diversitySection = document.createElement('div');
    diversitySection.className = 'insight-item';
    
    const totalTrades = pnlData.totalWins + pnlData.totalLosses;
    const avgTradesPerToken = (totalTrades / pnlData.uniqueTokens).toFixed(1);
    
    diversitySection.innerHTML = `
      <div class="insight-label">🎲 Trading Diversity</div>
      <div class="insight-value">
        ${pnlData.uniqueTokens} tokens, ${avgTradesPerToken} avg trades/token
        <span style="margin-left: 4px;">
          ${pnlData.uniqueTokens > 500 ? '🌈' : pnlData.uniqueTokens > 100 ? '🎯' : '📌'}
        </span>
      </div>
    `;
    
    insights.appendChild(diversitySection);
  }
  
  // Fee efficiency insight
  if (pnlData.feePaid && pnlData.totalPnL !== undefined) {
    const feeSection = document.createElement('div');
    feeSection.className = 'insight-item';
    
    const feeEfficiency = ((pnlData.totalPnL / pnlData.feePaid) * 100).toFixed(1);
    const isEfficient = pnlData.totalPnL > pnlData.feePaid;
    
    feeSection.innerHTML = `
      <div class="insight-label">💰 Fee Efficiency</div>
      <div class="insight-value">
        ${feeEfficiency}% profit vs fees ratio
        <span class="${isEfficient ? 'pnl-positive' : 'pnl-negative'}" style="margin-left: 4px;">
          ${isEfficient ? '💎' : '🔥'}
        </span>
      </div>
    `;
    
    insights.appendChild(feeSection);
  }
  
  return insights;
}

// Enhanced number formatting for large values
function formatLargeNumber(num) {
  if (Math.abs(num) < 0.01) return '0.00';
  
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (Math.abs(num) >= 1) {
    return num.toFixed(2);
  } else {
    return num.toFixed(4);
  }
}
function stopAnalysisAnimation() {
  const loadingElement = document.getElementById('analysisLoading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }

  const tokenLoading = document.querySelector('#tokenList .token-loading');
  if (tokenLoading) tokenLoading.remove();
}

// Display token data as a table in the ca-table-container
function displayTokenData(tokenData) {
  stopAnalysisAnimation();
  console.log("displayTokenData called with:", tokenData);

  const tokenPanel = document.getElementById('tokenPanel');
  const caTableContainer = document.getElementById('ca-table-container');
  const tokenTitle = tokenPanel?.querySelector('.section-title');
  const loadingElement = document.getElementById('analysisLoading');
  const tokenLoading = document.querySelector('#tokenList .token-loading');

  // Basic sanity checks
  if (!tokenPanel || !caTableContainer || !tokenTitle) {
    console.error("Token panel elements not found!");
    return;
  }

  // Hide loading screen if analysis finished
  if (loadingElement) loadingElement.style.display = 'none';
  if (tokenLoading) tokenLoading.remove();  // remove spinner if exists

  // Clear previous results
  caTableContainer.innerHTML = '';

   // Parse token map
   let tokenMap = tokenData?.data;

// Fallback: tokenData is the tokenMap itself
if (!tokenMap && tokenData && typeof tokenData === 'object') {
  const maybeDates = Object.keys(tokenData);
  const isDateKeyedMap = maybeDates.length > 0 && maybeDates.every(k => Array.isArray(tokenData[k]));
  if (isDateKeyedMap) {
    tokenMap = tokenData;
    console.warn('⚠️ tokenData did not have a .data property; using root object as tokenMap');
  }
}
 
  console.log("tokenMap:", tokenMap);

  // Handle empty or invalid data
  if (!tokenMap || Object.keys(tokenMap).length === 0) {
    tokenPanel.style.display = 'none';
    caTableContainer.innerHTML = '<div class="ca-empty">No token addresses found</div>';
    return;
  }

  // Make sure panel is visible
  tokenPanel.style.display = 'block';
  tokenPanel.style.opacity = '1';
  tokenPanel.style.height = 'auto';
  tokenPanel.style.overflow = 'visible';
  tokenTitle.innerHTML = '🪙 Token Analysis';

  // Create the table
  const table = document.createElement('table');
  table.className = 'ca-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Address</th>
      <th>Status</th>
      <th>Best PnL</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Sort dates in descending order
  const sortedDates = Object.keys(tokenMap).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    const tokens = tokenMap[date];
    if (!Array.isArray(tokens) || tokens.length === 0) return;

    // Add date header row
    const dateRow = document.createElement('tr');
    dateRow.innerHTML = `<td colspan="4" class="ca-date-header">${formatDateForDisplay(date)}</td>`;
    tbody.appendChild(dateRow);

    // Add each token row
    tokens.forEach(tokenInfo => {
      const tokenRow = createTokenTableRow(tokenInfo);
      tbody.appendChild(tokenRow);
    });
  });

  table.appendChild(tbody);
  caTableContainer.appendChild(table);

  console.log("✅ Token table rendered successfully.");
}


// Create a token table row for the CA Analysis table
function createTokenTableRow(tokenInfo) {
  const row = document.createElement('tr');
  
  // Determine status and best PnL
  let status, statusClass, bestPnL, pnlClass;
  
  if (tokenInfo.is_pump) {
    status = 'Pump.fun';
    statusClass = 'pump';
    bestPnL = 'Skipped';
    pnlClass = 'neutral';
  } else if (tokenInfo.isValid && tokenInfo.pnl && tokenInfo.pnl.length > 0) {
    status = 'Analyzed';
    statusClass = 'success';
    
    // Find best PnL
    const bestEntry = tokenInfo.pnl.reduce((best, current) => {
      const currentGain = parseFloat(current.gainLoss);
      const bestGain = parseFloat(best.gainLoss);
      return currentGain > bestGain ? current : best;
    }, tokenInfo.pnl[0]);
    
    bestPnL = `${bestEntry.gainLoss}x (${bestEntry.percentage})`;
    pnlClass = parseFloat(bestEntry.gainLoss) >= 0 ? 'positive' : 'negative';
  } else {
    status = 'Failed';
    statusClass = 'error';
    bestPnL = 'N/A';
    pnlClass = 'neutral';
  }
  
  row.innerHTML = `
  <td>
    <span class="ca-address" data-action="copy-token" data-address="${tokenInfo.address}" title="Click to copy">
      ${truncateAddress(tokenInfo.address)}
    </span>
  </td>
  <td>
    <span class="ca-status ${statusClass}">${status}</span>
  </td>
  <td>
    <span class="ca-pnl ${pnlClass}">${bestPnL}</span>
  </td>
  <td>
    <div class="ca-actions">
      <button class="ca-btn" data-action="copy-token" data-address="${tokenInfo.address}" title="Copy Address">📋</button>
      <button class="ca-btn" data-action="open-solscan" data-address="${tokenInfo.address}" title="View on Solscan">🔗</button>
      ${tokenInfo.isValid && tokenInfo.pnl && tokenInfo.pnl.length > 0 ? 
        `<button class="ca-btn" data-action="toggle-pnl" data-address="${tokenInfo.address}" title="Show Details">📊</button>` : ''
      }
    </div>
  </td>
`;

  
  // Add detailed PnL row if token has valid data
  if (tokenInfo.isValid && tokenInfo.pnl && tokenInfo.pnl.length > 0) {
    const detailRow = document.createElement('tr');
    detailRow.id = `pnl-details-${tokenInfo.address}`;
    detailRow.style.display = 'none';
    detailRow.innerHTML = `
      <td colspan="4" style="padding: 0;">
        <div style="padding: 8px; background: rgba(0, 0, 0, 0.2);">
          <table style="width: 100%; font-size: 10px;">
            <thead>
              <tr style="opacity: 0.7;">
                <th style="text-align: left;">Time</th>
                <th style="text-align: right;">Gain/Loss</th>
                <th style="text-align: right;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${tokenInfo.pnl.map(pnl => `
                <tr>
                  <td>${pnl.time}</td>
                  <td style="text-align: right; ${parseFloat(pnl.gainLoss) >= 0 ? 'color: var(--cyber-green);' : 'color: var(--red-danger);'}">${pnl.gainLoss}x</td>
                  <td style="text-align: right; ${parseFloat(pnl.gainLoss) >= 0 ? 'color: var(--cyber-green);' : 'color: var(--red-danger);'}">${pnl.percentage}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </td>
    `;
    
    // Add the detail row after the main row
    setTimeout(() => {
      row.parentNode.insertBefore(detailRow, row.nextSibling);
    }, 0);
  }
  
  return row;
}

// Helper functions
function formatDateForDisplay(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (error) {
    return dateStr;
  }
}

function formatPnLValue(value) {
  if (Math.abs(value) < 0.01) return '0.00';
  return (value > 0 ? '+' : '') + value.toFixed(2);
}

function formatPercentage(value) {
  if (Math.abs(value) < 0.01) return '0.0%';
  return (value > 0 ? '+' : '') + value.toFixed(1) + '%';
}

function copyWalletAddress(address) {
  copyToClipboard(address)
    .then(() => showCopyFeedback('Wallet', address))
    .catch(() => showCopyError('Wallet'));
}

// Function to copy a CA address
function copyTokenAddress(address) {
  copyToClipboard(address)
    .then(() => showCopyFeedback('Token', address))
    .catch(() => showCopyError('Token'));
}

function showCopyFeedback(type, text) {
  const feedbackElement = document.getElementById('copyFeedback');
  if (feedbackElement) {
    feedbackElement.textContent = `Copied ${type}: ${truncateAddress(text)}`;
    feedbackElement.style.display = 'block';
      setTimeout(() => {
      feedbackElement.style.display = 'none';
      }, 2000);
    }
}

function showCopyError(type) {
  const feedbackElement = document.getElementById('copyFeedback');
  if (feedbackElement) {
    feedbackElement.textContent = `Failed to copy ${type} address!`;
    feedbackElement.style.display = 'block';
    feedbackElement.style.backgroundColor = 'var(--red-error)';
    setTimeout(() => {
      feedbackElement.style.display = 'none';
      feedbackElement.style.backgroundColor = '';
    }, 2000);
  }
}

function refreshWalletPnL(address) {
  console.log('Refreshing PnL for:', address);
  
  const refreshButton = document.querySelector(`.refresh-wallet-pnl[data-address="${address}"]`);
  if (refreshButton) {
    refreshButton.classList.add('loading');
  }

  safeSendMessage({
    action: 'refreshWalletPnL',
    username: currentUsername,
    walletAddress: address
  }).then(response => {
    if (response && response.success) {
      console.log('PnL refresh successful for', address);
      // The storage listener will handle the UI update
    } else {
      console.error('PnL refresh failed for', address, response?.error);
    }
  }).finally(() => {
    if (refreshButton) {
      refreshButton.classList.remove('loading');
    }
  });
}

function displayNoWalletData() {
  const walletList = document.getElementById('walletList');
  if (walletList) {
    walletList.innerHTML = '<div class="no-data">No wallet addresses found</div>';
  }
}

function displayNoTokenData() {
  const tokenPanel = document.getElementById('tokenPanel');
  const caTableContainer = document.getElementById('ca-table-container');

  if (!tokenPanel || !caTableContainer) return;

  tokenPanel.style.display = 'none'; // Hide if no data
  caTableContainer.innerHTML = '<div class="ca-empty">No CA mentions found to analyze.</div>';
}

function displayWalletError(error) {
  const walletList = document.getElementById('walletList');
  if (walletList) {
    walletList.innerHTML = `<div class="wallet-error">Error loading wallets: ${error.message || error}</div>`;
  }
}

function displayTokenError(error) {
  const tokenPanel = document.getElementById('tokenPanel');
  const caTableContainer = document.getElementById('ca-table-container');

  if (!tokenPanel || !caTableContainer) return;

  tokenPanel.style.display = 'none'; // Hide on error
  caTableContainer.innerHTML = `<div class="ca-empty">Error loading CAs: ${error.message || error}</div>`;
}

// Toggle PnL details for a specific token
function togglePnLDetails(address) {
  const detailRow = document.getElementById(`pnl-details-${address}`);
  if (detailRow) {
    if (detailRow.style.display === 'none') {
      detailRow.style.display = 'table-row';
    } else {
      detailRow.style.display = 'none';
    }
  }
}

// Analysis loading text animation
function startAnalysisLoadingAnimation() {
  const statusTexts = [
    'Analyzing Tweets',
    'Heating Up Data',
    'Cooking Insights',
    'Seasoning Results',
    'Serving Analytics'
  ];
  const subTexts = [
    'Spicing up the data...',
    'Adding some heat...',
    'Turning up the flavor...',
    'Making it crispy...',
    'Almost ready to serve...'
  ];
  
  let currentIndex = 0;
  
  function updateText() {
    const statusEl = document.querySelector('#analysisLoading .status-text');
    const subEl = document.querySelector('#analysisLoading .sub-text');
    
    if (statusEl && subEl) {
      currentIndex = (currentIndex + 1) % statusTexts.length;
      statusEl.textContent = statusTexts[currentIndex];
      subEl.textContent = subTexts[currentIndex];
    }
  }
  
  // Start the animation if the loading screen is visible
  const loadingElement = document.getElementById('analysisLoading');
  if (loadingElement && loadingElement.style.display !== 'none') {
    const intervalId = setInterval(updateText, 2000);
    
    // Stop animation when loading screen is hidden
    const observer = new MutationObserver(() => {
      if (loadingElement.style.display === 'none') {
        clearInterval(intervalId);
        observer.disconnect();
      }
    });
    
    observer.observe(loadingElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }
}

// Refresh all wallets PnL
function refreshAllWallets() {
  const refreshBtn = document.querySelector('.refresh-all-wallets');
  if (refreshBtn) {
    refreshBtn.classList.add('loading');
  }

  // Reload wallet data which will trigger PnL fetches in the background
  if (currentUsername) {
    loadWalletData(currentUsername)
      .finally(() => {
  if (refreshBtn) {
          refreshBtn.classList.remove('loading');
        }
      });
  } else if (refreshBtn) {
    refreshBtn.classList.remove('loading');
  }
}

// --- PnL Progress Updates ---
function updateWalletProgress(walletAddress, status, data) {
  const walletItem = document.querySelector(`.wallet-item[data-address="${walletAddress}"]`);
  if (!walletItem) return;

  const pnlContainer = walletItem.querySelector('.pnl-container');
  if (!pnlContainer) return;

  switch (status) {
    case 'requesting':
    case 'waiting':
    case 'polling':
      pnlContainer.innerHTML = `<div class="pnl-loading">Loading PnL... (${status})</div>`;
      break;
    case 'completed':
      pnlContainer.innerHTML = createPnLMetrics(data);
      break;
    case 'failed':
      pnlContainer.innerHTML = `<div class="pnl-error">Failed to load PnL: ${data?.message || 'Unknown error'}</div>`;
      break;
  }
}


// --- Event Listeners and Initialization ---

// This function is not used, event listeners are initialized in DOMContentLoaded
function initializeEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeIcon');
  if (themeToggle) {
    themeToggle.parentElement.addEventListener('click', toggleTheme);
  }

  // Scan button
  const scanBtn = document.querySelector('.scan-button');
  if (scanBtn) {
    scanBtn.addEventListener('click', scanProfile);
  }

  // Close button
  const closeBtn = document.querySelector('.close-overlay');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDeepAnalysis);
  }
  
  // Refresh all button
  const refreshAllBtn = document.querySelector('.refresh-all-wallets');
  if (refreshAllBtn) {
    refreshAllBtn.addEventListener('click', refreshAllWallets);
  }
}

async function init() {
  // Restore theme
  const savedTheme = await chrome.storage.local.get('theme');
  if (savedTheme.theme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Manually initialize event listeners here
  const themeToggle = document.getElementById('themeIcon');
  if (themeToggle) {
    themeToggle.parentElement.addEventListener('click', toggleTheme);
  }
  const scanBtn = document.querySelector('.scan-button');
  if (scanBtn) {
    scanBtn.addEventListener('click', performDeepAnalysis);
  }
  const closeBtn = document.querySelector('.close-overlay');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDeepAnalysis);
  }
  const refreshAllBtn = document.querySelector('.refresh-all-wallets');
  if (refreshAllBtn) {
    refreshAllBtn.addEventListener('click', refreshAllWallets);
  }

  // Initial data load
  await initializeWalletTokenData();

  // Listen for storage changes to update UI automatically
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
      const username = await getCurrentUsername();
      if (!username) return;
  
      const tokenStorageKey = `token_list_${username}`;
      const walletStorageKey = `wallet_list_${username}`;
  
      if (changes[tokenStorageKey]) {
        const newTokenData = changes[tokenStorageKey].newValue;
        console.log('Detected change in token data, reloading...');
        if (newTokenData && newTokenData.data) {
          displayTokenData(newTokenData); // ✅ Correct format
        } else {
          displayNoTokenData();
        }
      }
  
      if (changes[walletStorageKey]) {
        const newWalletData = changes[walletStorageKey].newValue;
        console.log('Detected change in wallet data, reloading...');
        if (newWalletData && newWalletData.data) {
          displayWalletData(newWalletData);
        } else {
          displayNoWalletData();
        }
      }
    }
  });
  

  // Listen for PnL progress updates from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PNL_PROGRESS_UPDATE') {
      updateWalletProgress(message.wallet, message.status, message.data);
    }
  });

  document.getElementById('ca-table-container').addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
  
    const action = actionEl.getAttribute('data-action');
    const address = actionEl.getAttribute('data-address');
  
    switch (action) {
      case 'copy-token':
        copyTokenAddress(address);
        break;
      case 'open-solscan':
        window.open(`https://solscan.io/token/${address}`, '_blank');
        break;
      case 'toggle-pnl':
        togglePnLDetails(address);
        break;
    }
  });
  
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', function() {
  const scanBtn = document.getElementById('scanProfileBtn');
  if (scanBtn) {
    scanBtn.addEventListener('click', scanProfile);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const scanBtn = document.getElementById('closeDeepAnalysis');
  if (scanBtn) {
    scanBtn.addEventListener('click', closeDeepAnalysis);
  }
});


// --- Utility: Observe URL changes using MutationObserver (for SPA navigation) ---
function observeUrlChange(callback) {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      callback(url);
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
}

// When popup loads or refreshes
chrome.runtime.sendMessage({ action: 'getTokenData', username: currentUsername }, (response) => {
  console.log('🔍 Token Data Response:', response);
  
  if (response.success && response.data) {
    console.log('📊 Received Token Data:', JSON.stringify(response.data, null, 2));
    
    // Detailed logging of token map
    Object.entries(response.data.data).forEach(([date, tokens]) => {
      console.log(`📅 Date: ${date}`);
      tokens.forEach(token => {
        console.log(`🪙 Token Address: ${token.address}`);
        console.log(`📈 Is Pump: ${token.is_pump}`);
        console.log(`🕒 Timestamp: ${token.timestamp}`);
        console.log(`📊 PnL Length: ${token.pnl ? token.pnl.length : 'No PnL data'}`);
      });
    });
    
    // Render logic here
  } else {
    console.warn('❌ No token data found or retrieval failed');
  }
});

// Also listen for incremental updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'INCREMENTAL_DATA_UPDATE') {
    console.log('🔄 Incremental Token Data Update:', message);
    // Handle incremental update rendering
  }
});