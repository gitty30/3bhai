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

// Inject script into page context to intercept fetch calls
function injectInterceptorScript() {
    try {
        console.log('🚀 Injecting interceptor script into page context...');
        
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("inject.js");
        script.onload = () => {
            console.log('✅ Inject script loaded successfully');
            script.remove();
        };
        script.onerror = () => {
            console.error('❌ Failed to load inject script');
        };
        
        (document.head || document.documentElement).appendChild(script);
        
    } catch (error) {
        console.error('❌ Failed to inject script:', error);
    }
}

// Listen for messages from injected script
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "TWITTER_USER_DATA") {
        console.log("👁️‍🗨️ Intercepted Twitter user data from page context:", event.data);
        
        // Process the intercepted data
        const profileData = processInterceptedData(event.data.data, 'injected_script');
        
        if (profileData) {
            // Send processed profile data to background script
            safeSendMessage({
                type: 'PROFILE_DATA_EXTRACTED',
                data: profileData, // Send the processed profile data, not raw API data
                timestamp: event.data.timestamp,
                url: event.data.url,
                source: event.data.source || 'injected_script'
            }).then(response => {
                if (response) {
                    console.log('✅ Processed profile data sent to background script:', response);
                }
            });
        } else {
            console.log('❌ Failed to process profile data, not sending to background');
        }
    }
});

// Function to process intercepted data
function processInterceptedData(data, source) {
    try {
        console.log(`📊 Processing intercepted data from ${source}:`, data);
        
        // Check if data has the expected structure
        if (!data) {
            console.log('❌ No data provided');
            return null;
        }
        
        if (!data.data) {
            console.log('❌ No data.data found in response');
            return null;
        }
        
        if (!data.data.user) {
            console.log('❌ No data.data.user found in response');
            return null;
        }
        
        if (!data.data.user.result) {
            console.log('❌ No data.data.user.result found in response');
            return null;
        }
        
        console.log('✅ Data structure validation passed');
        
        // Extract profile data using the same logic as before
        const user = data.data.user.result;
        const legacy = user.legacy || {};
        const core = user.core || {};
        const verification = user.verification || {};
        const verificationInfo = user.verification_info || {};
        const tipjar = user.tipjar_settings || {};
        const affiliates = user.affiliates_highlighted_label || {};
        const avatar = user.avatar || {};
        const legacyExtended = user.legacy_extended_profile || {};
        
        console.log('📋 Extracted user data sections:', {
            hasLegacy: !!legacy,
            hasCore: !!core,
            hasVerification: !!verification,
            hasVerificationInfo: !!verificationInfo,
            hasTipjar: !!tipjar,
            hasAffiliates: !!affiliates,
            hasAvatar: !!avatar,
            hasLegacyExtended: !!legacyExtended
        });
        
        // Calculate FFR (Fast Followers Ratio)
        const fastFollowers = legacy.fast_followers_count || 0;
        const normalFollowers = legacy.normal_followers_count || legacy.followers_count || 0;
        const ffr = normalFollowers > 0 ? fastFollowers : 0;
        
        // Build suspicious flags array
        const suspiciousFlags = [];
        
        if (verificationInfo.reason && verificationInfo.reason.override_verified_year === -3000) {
            suspiciousFlags.push('override_verified_year:-3000');
        }
        
        if (!user.verified_phone_status) {
            suspiciousFlags.push('phone_not_verified');
        }
        
        if (user.has_hidden_subscriptions_on_profile) {
            suspiciousFlags.push('hidden_subscriptions:true');
        }
        
        // Format created_at date
        const createdDate = core.created_at ? 
            new Date(core.created_at).toISOString().split('T')[0] : 
            null;
        
        // Extract birthdate
        let birthdate = null;
        if (legacyExtended.birthdate) {
            const birth = legacyExtended.birthdate;
            if (birth.year && birth.month && birth.day) {
                birthdate = `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`;
            }
        }
        
        // Extract website URL
        let website = null;
        if (legacy.entities && legacy.entities.url && legacy.entities.url.urls && legacy.entities.url.urls.length > 0) {
            website = legacy.entities.url.urls[0].expanded_url;
        }
        
        // Extract profile banner URL
        const bannerUrl = legacy.profile_banner_url || null;
        
        const profileData = {
            id: user.rest_id || user.id,
            username: core.screen_name || legacy.screen_name || '',
            name: core.name || legacy.name || '',
            created_at: createdDate,
            followers: legacy.followers_count || 0,
            friends: legacy.friends_count || 0,
            statuses: legacy.statuses_count || 0,
            media: legacy.media_count || 0,
            verified: verification.verified || false,
            blue_verified: user.is_blue_verified || false,
            phone_verified: user.verified_phone_status || false,
            identity_verified: verificationInfo.is_identity_verified || false,
            tipjar_enabled: tipjar.is_enabled || false,
            subscriptions: user.creator_subscriptions_count || 0,
            profile_url: avatar.image_url || null,
            banner_url: bannerUrl,
            website: website,
            birthdate: birthdate,
            // Additional fields for compatibility
            ffr: ffr,
            affiliation: affiliates.label ? affiliates.label.description : null,
            business_label: !!affiliates.label,
            creator_subscriptions: user.creator_subscriptions_count || 0,
            suspicious_flags: suspiciousFlags
        };
        
        console.log('📊 Extracted Profile Data:', profileData);
        
        // Store in window for access by other scripts
        window.__lastApiProfileData = profileData;
        
        return profileData;
    } catch (error) {
        console.error('❌ Error processing intercepted data:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        return null;
    }
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

// Inject the interceptor script into page context
injectInterceptorScript();

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

// Function to get last intercepted API profile data
window.getLastApiProfileData = function() {
    return window.__lastApiProfileData || null;
};

// Function to get combined profile data (scraped + API)
window.getCombinedProfileData = function() {
    const scrapedData = window.__lastProfileData || {};
    const apiData = window.__lastApiProfileData || {};
    
    return {
        scraped: scrapedData,
        api: apiData,
        combined: {
            ...scrapedData,
            ...apiData
        }
    };
};

// Function to manually test API interceptor
window.testApiInterceptor = function() {
    console.log('🧪 Testing API Interceptor...');
    
    // Check if interceptor is loaded
    if (typeof window.getLastApiProfileData === 'function') {
        console.log('✅ API Interceptor functions available');
    } else {
        console.log('❌ API Interceptor functions not available');
    }
    
    // Try to manually trigger a fetch call to see if it's intercepted
    const testUrl = 'https://api.x.com/graphql/jUKA--0QkqGIFhmfRZdWrQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22elonmusk%22%7D';
    
    console.log('🔍 Testing fetch interception with:', testUrl);
    
    fetch(testUrl, {
        method: 'GET',
        headers: {
            'accept': '*/*',
            'content-type': 'application/json'
        }
    })
    .then(response => {
        console.log('📡 Test fetch response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📦 Test fetch response data:', data);
    })
    .catch(error => {
        console.log('❌ Test fetch failed:', error);
    });
    
    // Check for any existing API calls
    if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        const apiCalls = resources.filter(r => 
            r.name.includes('api.x.com') || 
            r.name.includes('api.twitter.com') ||
            r.name.includes('graphql')
        );
        console.log('📋 All API calls found:', apiCalls);
    }
};

// Function to debug current state
window.debugInterceptorState = function() {
    console.log('🔍 Debugging Interceptor State...');
    console.log('Current URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    console.log('Last scraped data:', window.__lastProfileData);
    console.log('Last API data:', window.__lastApiProfileData);
    
    // Check if fetch is overridden
    const originalFetch = window.fetch;
    console.log('Fetch function:', typeof originalFetch);
    
    // Check for any pending requests
    if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        console.log('Total network requests:', resources.length);
        
        const graphqlCalls = resources.filter(r => r.name.includes('graphql'));
        console.log('GraphQL calls:', graphqlCalls);
    }
};

// Function to test background script communication
window.testBackgroundCommunication = function() {
    console.log('🧪 Testing background script communication...');
    
    // Test basic message
    chrome.runtime.sendMessage({
        type: 'DEBUG_MESSAGE',
        test: 'Hello from content script',
        timestamp: Date.now()
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Background communication failed:', chrome.runtime.lastError);
        } else {
            console.log('✅ Background communication successful:', response);
        }
    });
    
    // Test profile data message
    const testProfileData = {
        id: "123456",
        username: "testuser",
        is_verified: true,
        is_identity_verified: false,
        phone_verified: false,
        created_at: "2020-01-01",
        followers: 1000,
        friends: 100,
        ffr: 50,
        tipjar_enabled: false,
        affiliation: "Test",
        business_label: false,
        creator_subscriptions: 0,
        suspicious_flags: ["test_flag"]
    };
    
    chrome.runtime.sendMessage({
        type: 'PROFILE_DATA_EXTRACTED',
        data: testProfileData,
        timestamp: Date.now(),
        url: window.location.href
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Profile data message failed:', chrome.runtime.lastError);
        } else {
            console.log('✅ Profile data message successful:', response);
        }
    });
};

// Function to test injection
window.testInjection = function() {
    console.log('🧪 Testing injection...');
    console.log('Current URL:', window.location.href);
    console.log('Last API data:', window.__lastApiProfileData);
    
    // Check if inject script is loaded
    const scripts = document.querySelectorAll('script[src*="inject.js"]');
    console.log('Inject scripts found:', scripts.length);
    
    // Test if fetch is overridden in page context
    const fetchStr = window.fetch.toString();
    console.log('Fetch function:', fetchStr.substring(0, 100) + '...');
    
    // Send test message to page context
    window.postMessage({
        type: 'TEST_INJECTION',
        test: 'Testing injection from content script'
    }, '*');
};

// Function to test data extraction with sample data
window.testDataExtraction = function() {
    console.log('🧪 Testing data extraction...');
    
    // Sample data similar to what we receive
    const sampleData = {
        data: {
            user: {
                result: {
                    id: "VXNlcjoxNTU2NTkyMTM=",
                    rest_id: "155659213",
                    core: {
                        created_at: "Mon Jun 14 19:09:20 +0000 2010",
                        name: "Cristiano Ronaldo",
                        screen_name: "Cristiano"
                    },
                    is_blue_verified: true,
                    legacy: {
                        followers_count: 115565882,
                        friends_count: 76,
                        statuses_count: 4317,
                        media_count: 2386,
                        profile_banner_url: "https://pbs.twimg.com/profile_banners/155659213/1668980773",
                        entities: {
                            url: {
                                urls: [{
                                    expanded_url: "https://www.cristianoronaldo.com/"
                                }]
                            }
                        }
                    },
                    avatar: {
                        image_url: "https://pbs.twimg.com/profile_images/1594446880498401282/o4L2z8Ay_normal.jpg"
                    },
                    verification: {
                        verified: false
                    },
                    verified_phone_status: false,
                    legacy_extended_profile: {
                        birthdate: {
                            day: 5,
                            month: 2,
                            year: 1985
                        }
                    },
                    verification_info: {
                        is_identity_verified: false
                    },
                    tipjar_settings: {
                        is_enabled: false
                    },
                    creator_subscriptions_count: 0
                }
            }
        }
    };
    
    console.log('📦 Processing sample data...');
    const extractedData = processInterceptedData(sampleData, 'test');
    
    if (extractedData) {
        console.log('✅ Data extraction successful!');
        console.log('📊 Extracted Profile Data:');
        console.log(JSON.stringify(extractedData, null, 2));
    } else {
        console.log('❌ Data extraction failed');
    }
};

// Listen for test messages from page context
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "TEST_INJECTION") {
        console.log("✅ Injection test received from page context:", event.data);
    }
});