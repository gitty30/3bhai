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
window.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { action: 'get_profile_data' }, function(data) {
        updateProfileUI(data || {}, profileData);
      });
    } else {
      updateProfileUI({}, profileData);
    }
  });

  // Attach all event listeners here to comply with CSP
  const themeToggle = document.getElementById('themeIcon');
  if (themeToggle) {
    themeToggle.parentElement.addEventListener('click', toggleTheme);
  }

  const scanBtn = document.querySelector('.scan-button');
  if (scanBtn) {
    scanBtn.addEventListener('click', scanProfile);
  }

  // Add event listener for close button
  const closeBtn = document.querySelector('.close-overlay');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDeepAnalysis);
  }

  // Initialize with mock data
  loadTheme(); // Load theme first

  // Initialize Identity Switches with loading state
  updateIdentitySwitches([]);
  
  // Fetch real Twitter data for the current user
  fetchAndUpdateTwitterData();
  
  document.getElementById('accountAge').textContent = profileData.accountAge;
  document.getElementById('activityScore').textContent = profileData.activityScore + '/10';
  document.getElementById('followers').textContent = profileData.followers;

  // PnL will be updated automatically when profile data is received from content script
  
  // Set up URL change detection for dynamic PnL updates
  setupUrlChangeDetection();
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
  const currentTheme = body.getAttribute('data-theme');

  if (currentTheme === 'light') {
    body.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
    // For extension: use chrome.storage instead of localStorage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({theme: 'dark'});
    }
  } else {
    body.setAttribute('data-theme', 'light');
    themeIcon.textContent = '☀️';
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
        themeIcon.textContent = '☀️';
      } else {
        themeIcon.textContent = '🌙';
      }
    });
  } else {
    // Fallback for testing
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      themeIcon.textContent = '☀️';
    } else {
      themeIcon.textContent = '🌙';
    }
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
  
  // Update the count display
  if (changesElement) {
    if (changesCount === 0 && (!usernameChangesArray || usernameChangesArray.length === 0)) {
      changesElement.textContent = '...';
    } else {
      changesElement.textContent = changesCount;
    }
  }
  
  // Update the description based on count
  if (descElement) {
    if (changesCount === 0 && (!usernameChangesArray || usernameChangesArray.length === 0)) {
      descElement.textContent = 'Loading username history...';
    } else if (changesCount < 3) {
      descElement.textContent = 'Not much for a Scammer!';
    } else if (changesCount >= 3 && changesCount <= 5) {
      descElement.textContent = 'Hmmm. Suspicious!';
    } else {
      descElement.textContent = 'Multiple aliases detected - High scam probability';
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
    try {
        console.log('🔍 Starting deep analysis in popup...');
        
        // Show loading state
        const loadingElement = document.getElementById('analysisLoading');
        const resultsElement = document.getElementById('analysisResults');
        const overlayElement = document.getElementById('deepAnalysisOverlay');
        
        console.log('📋 Elements found:', {
            loading: !!loadingElement,
            results: !!resultsElement,
            overlay: !!overlayElement
        });
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (resultsElement) resultsElement.style.display = 'none';
        if (overlayElement) overlayElement.style.display = 'flex';
        
        console.log('✅ Overlay should now be visible');
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url || !tab.url.includes('x.com')) {
            throw new Error('Please navigate to a Twitter/X profile page');
        }
        
        console.log('📄 Sending analysis request to content script...');
        
        // Send message to content script to perform analysis
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'perform_deep_analysis'
        });
        
        console.log('📊 Received response from content script:', response);
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to perform analysis');
        }
        
        // Hide loading and show results
        if (loadingElement) loadingElement.style.display = 'none';
        if (resultsElement) resultsElement.style.display = 'block';
        
        console.log('✅ Analysis results should now be visible');
        
        // Update the display with the analysis results
        updateAnalysisDisplay(response.data);
        
    } catch (error) {
        console.error('❌ Error in deep analysis:', error);
        
        // Hide loading
        const loadingElement = document.getElementById('analysisLoading');
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Show error message
        alert(`Analysis failed: ${error.message}`);
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
    
    // Calculate percentages (minimum width only if value > 0)
    const minWidth = 8; // percent
    const bullishPercent = total > 0 ? (bullish > 0 ? Math.max((bullish / total) * 100, minWidth) : 0) : 0;
    const bearishPercent = total > 0 ? (bearish > 0 ? Math.max((bearish / total) * 100, minWidth) : 0) : 0;
    const neutralPercent = total > 0 ? (neutral > 0 ? Math.max((neutral / total) * 100, minWidth) : 0) : 0;

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