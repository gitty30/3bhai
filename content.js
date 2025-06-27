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
        console.warn('[CONTENT] Extension context invalid, skipping message send');
        return Promise.resolve(null);
    }
    
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[CONTENT] Runtime error:', chrome.runtime.lastError.message);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        } catch (e) {
            console.warn('[CONTENT] Failed to send message:', e.message);
            resolve(null);
        }
    });
}

// Scrape all relevant profile data from the Twitter profile page
function scrapeProfileData() {
    try {
        // Username from URL
        const url = window.location.href;
        const match = url.match(/x\.com\/([A-Za-z0-9_]+)/);
        const username = match ? match[1] : '';

        // Verified badge
        const verified = !!document.querySelector('[data-testid="icon-verified"]');

        // Followers count
        let followers = '';
        const spans = Array.from(document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3'));
        for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            const parent = span.parentElement;
            if (!parent) continue;
            const nextSpan = parent.nextElementSibling;
            if (nextSpan && nextSpan.textContent.trim() === 'Followers') {
                followers = span.textContent.trim();
                break;
            }
            if (parent && parent.children.length === 2 && parent.children[1].textContent.trim() === 'Followers') {
                followers = parent.children[0].textContent.trim();
                break;
            }
        }

        // Join date
        let joinDate = '';
        const joinSpan = document.querySelector('span[data-testid="UserJoinDate"]');
        if (joinSpan) {
            joinDate = joinSpan.textContent.replace('Joined', '').trim();
        }

        // Store the last data for popup requests
        window.__lastProfileData = { username, verified, followers, joinDate };

        // Send all data to background for this tab (safely)
        safeSendMessage({
            action: "profileData",
            data: { username, verified, followers, joinDate }
        }).catch(e => {
            console.warn('[CONTENT] Failed to send profile data:', e.message);
        });

    } catch (e) {
        console.warn('[CONTENT] Error in scrapeProfileData:', e.message);
    }
}

// Global observer reference for cleanup
let observer = null;

// Observe DOM changes for real-time updates
function startObserver() {
    try {
        if (observer) {
            observer.disconnect();
        }
        
        observer = new MutationObserver((mutations) => {
            // Only process if extension context is still valid
            if (isExtensionContextValid()) {
                scrapeProfileData();
            } else {
                console.warn('[CONTENT] Extension context invalid, disconnecting observer');
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.warn('[CONTENT] Failed to start observer:', e.message);
    }
}

// Initial scrape
scrapeProfileData();
startObserver();

// Respond to popup requests for latest data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "get_profile_data") {
            sendResponse(window.__lastProfileData || {});
        }
    } catch (e) {
        console.warn('[CONTENT] Error handling message:', e.message);
        sendResponse({});
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

// Cleanup on extension context invalidation
window.addEventListener('beforeunload', () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});