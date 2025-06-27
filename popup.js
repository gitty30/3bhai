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

  // Initialize with mock data
  loadTheme(); // Load theme first

  document.getElementById('usernameChanges').textContent = profileData.usernameChanges + '/4';
  document.getElementById('accountAge').textContent = profileData.accountAge;
  document.getElementById('activityScore').textContent = profileData.activityScore + '/10';
  document.getElementById('followers').textContent = profileData.followers;

  // Animate wallet address with typewriter effect
  setTimeout(() => {
    animateWalletAddress();
  }, 1000);

  updateRiskLevel(profileData.usernameChanges);
  updatePnL(profileData.pnl);

  // Hide PnL section if no wallet data (simulate)
  if (Math.random() < 0.3) {
    document.getElementById('pnlSection').style.display = 'none';
  }
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

// --- Utility: Scrape stats for a Solana wallet user (dummy implementation) ---
function statsScrapper(walletAddress) {
  // TODO: Implement actual stats scraping logic for Solana wallet user
  // Example: fetch stats from a block explorer or API
  return {
    wallet: walletAddress,
    stats: {}, // Fill with real stats
  };
}

// Typewriter effect for wallet address
function typewriterEffect(element, text, speed = 100) {
  element.textContent = '';
  element.classList.add('typing');
  
  let i = 0;
  const timer = setInterval(() => {
    element.textContent += text.charAt(i);
    i++;
    
    if (i >= text.length) {
      clearInterval(timer);
      element.classList.remove('typing');
      // Add train effect after typing is done
      setTimeout(() => {
        element.classList.add('train-effect');
        setTimeout(() => {
          element.classList.remove('train-effect');
        }, 3000);
      }, 500);
    }
  }, speed);
}

// Enhanced wallet address effect
function animateWalletAddress() {
  const walletElement = document.getElementById('walletAddress');
  const fullAddress = profileData.walletAddress + '...';
  
  typewriterEffect(walletElement, fullAddress, 80);
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

function updateRiskLevel(changes) {
  const riskElement = document.getElementById('riskLevel');
  if (changes <= 4) {
    riskElement.textContent = 'SECURE';
    riskElement.className = 'risk-level threat-low';
  } else if (changes <= 6) {
    riskElement.textContent = 'MODERATE';
    riskElement.className = 'risk-level threat-medium';
  } else {
    riskElement.textContent = 'CRITICAL';
    riskElement.className = 'risk-level threat-high';
  }
}

function updatePnL(value) {
  const pnlElement = document.getElementById('pnlValue');
  const pnlSection = document.getElementById('pnlSection');
  const sign = value >= 0 ? '+' : '';

  pnlElement.textContent = `${sign}$${Math.abs(value).toFixed(2)}`;

  if (value >= 0) {
    pnlElement.className = 'pnl-value';
    pnlSection.className = 'alert-box alert-success pnl-section';
  } else {
    pnlElement.className = 'pnl-value pnl-negative';
    pnlSection.className = 'alert-box alert-danger pnl-section';
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
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.add('active');
    
    setTimeout(async () => {
        try {
            const tabs = await safeTabsQuery({ active: true, currentWindow: true });
            
            if (tabs.length > 0) {
                const tabId = tabs[0].id;
                const data = await safeTabsSendMessage(tabId, { action: 'get_profile_data' });
                updateProfileUI(data || {}, profileData);
            } else {
                updateProfileUI({}, profileData);
            }
            
            loadingElement.classList.remove('active');
        } catch (e) {
            console.warn('[POPUP] Error in scanProfile:', e.message);
            updateProfileUI({}, profileData);
            loadingElement.classList.remove('active');
        }
    }, 2500);
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
});