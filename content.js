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
        } else if (message.action === "get_api_profile_data") {
            // Return API profile data if available
            sendResponse(window.__lastApiProfileData || {});
        } else if (message.action === "perform_deep_analysis") {
            // Handle deep analysis request
            performDeepTweetAnalysis().then(result => {
                if (result) {
                    sendResponse({
                        success: true,
                        data: result
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: "Failed to perform analysis"
                    });
                }
            }).catch(error => {
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
            return true; // Keep message channel open for async response
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

// Function to manually test data extraction with sample data
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

// Tweet Analysis Functionality
async function extractTweetsWithScrolling() {
    const tweets = new Set();
    const processedElements = new Set();
    let previousHeight = document.body.scrollHeight;
    let scrollCount = 0;
    const maxScrolls = 1; // Increased to collect more tweets
    let noNewContentCount = 0;
    const maxNoNewContent = 3;

    console.log('🔄 Starting tweet extraction with scrolling...');

    function extractTweetsFromCurrentView() {
        const tweetArticles = document.querySelectorAll('article[role="article"]');
        console.log(`📝 Found ${tweetArticles.length} tweet articles`);

        let newTweetsCount = 0;
        tweetArticles.forEach((article, index) => {
            if (processedElements.has(article)) return;

            const tweetContent = article.innerText || '';
            const trimmedContent = tweetContent.trim();

            if (trimmedContent && trimmedContent.length > 10) {
                if (!tweets.has(trimmedContent)) {
                    tweets.add(trimmedContent);
                    newTweetsCount++;
                    console.log(`📄 New tweet ${index + 1}: ${trimmedContent.substring(0, 80)}...`);
                }
            }

            processedElements.add(article);
        });

        return newTweetsCount;
    }

    // Initial load
    console.log('📖 Extracting initially visible tweets...');
    const initialTweets = extractTweetsFromCurrentView();
    console.log(`📊 Initially visible tweets extracted: ${initialTweets}`);

    // Scroll loop
    while (scrollCount < maxScrolls && noNewContentCount < maxNoNewContent) {
        console.log(`🔄 Scroll attempt ${scrollCount + 1}/${maxScrolls}`);

        const currentScrollY = window.scrollY;

        // Smooth stepped scrolling to bottom
        const scrollStep = 400;
        const maxStepScrolls = Math.ceil((document.body.scrollHeight - currentScrollY) / scrollStep);

        for (let i = 0; i < maxStepScrolls; i++) {
            window.scrollBy(0, scrollStep);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Wait after full scroll
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newHeight = document.body.scrollHeight;
        const newScrollY = window.scrollY;

        if (newHeight === previousHeight && newScrollY === currentScrollY) {
            noNewContentCount++;
            console.log(`⚠️ No new content detected (${noNewContentCount}/${maxNoNewContent})`);
        } else {
            noNewContentCount = 0;
            console.log(`✅ New content loaded. Height: ${newHeight}, Scroll: ${newScrollY}`);

            const newTweets = extractTweetsFromCurrentView();
            console.log(`📝 New tweets extracted after scroll: ${newTweets}`);

            if (newTweets === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryTweets = extractTweetsFromCurrentView();
                console.log(`📝 Retry extraction: ${retryTweets} tweets`);
            }
        }

        previousHeight = newHeight;
        scrollCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final extraction
    console.log('🔄 Final tweet extraction...');
    const finalNewTweets = extractTweetsFromCurrentView();
    console.log(`📝 Final extraction: ${finalNewTweets} new tweets added`);

    const finalTweets = Array.from(tweets);
    console.log(`🎯 Total unique tweets extracted: ${finalTweets.length}`);

    return finalTweets;
}


// === 1. Sentiment Keywords (with memecoin) ===
const normalizeKeywordList = (keywords) =>
    [...new Set(keywords.map(k => k.toLowerCase()))];

const sentimentKeywords = {
    bullish: normalizeKeywordList([
        "bullish", "long", "buy", "pump", "moon", "ATH", "breakout", "rally", "up", "gain", "profit", "strong", "HODL", "diamond hands", "🚀", "📈",
        "accumulate", "accumulation", "bull run", "bull market", "surge", "soar", "skyrocket", "explode", "rocket", "blast off", "liftoff", "mooning", "to the moon", "lambo", "lamborghini",
        "wealth", "riches", "millionaire", "billionaire", "fortunes", "trending up", "uptrend", "support", "bounce", "recovery", "rebound", "bullish divergence", "golden cross",
        "buy the dip", "BTD", "💎🙌", "hodl", "hold", "strong hands", "not selling", "never selling", "long term", "fundamentals", "adoption", "mass adoption",
        "institutional", "whale", "whales buying", "smart money", "accumulation phase", "consolidation", "breakout imminent", "cup and handle", "ascending triangle", "flag pattern",
        "bull flag", "continuation", "next leg up", "higher highs", "higher lows", "bullish engulfing", "hammer", "doji", "green candle", "bullish momentum", "RSI oversold",
        "MACD bullish", "stochastic oversold", "fibonacci retracement", "golden ratio", "golden pocket", "accumulation zone", "distribution", "smart accumulation", "value investing"
    ]),
    bearish: normalizeKeywordList([
        "bearish", "short", "sell", "dump", "crash", "dip", "down", "loss", "weak", "FUD", "bear trap", "🩸", "📉",
        "bear market", "bear run", "dumpster fire", "shitcoin", "scam", "rug pull", "exit scam", "ponzi", "pyramid scheme", "bubble", "bubble burst", "correction", "crash landing",
        "free fall", "plunge", "tank", "tanking", "sinking", "sinking ship", "going to zero", "worthless", "dead coin", "zombie coin", "ghost chain", "abandoned project",
        "sell the news", "sell signal", "distribution", "whales selling", "smart money leaving", "institutional selling", "panic sell", "FOMO out", "fear", "greed index low",
        "bearish divergence", "death cross", "resistance", "rejection", "lower highs", "lower lows", "downtrend", "bear flag", "descending triangle", "head and shoulders",
        "double top", "triple top", "bearish engulfing", "shooting star", "evening star", "red candle", "bearish momentum", "RSI overbought", "MACD bearish", "stochastic overbought",
        "fibonacci extension", "support broken", "key level broken", "stop loss", "liquidation", "margin call", "forced selling", "capitulation", "despair", "hopeless", "game over"
    ]),
    bullshit_news: normalizeKeywordList([
        "100x", "to the moon", "guaranteed profit", "buy now or miss out", "insider info", "trust me bro", "financial advice", "not financial advice", "DYOR", "NFA",
        "1000x", "millionaire maker", "get rich quick", "easy money", "free money", "risk-free", "guaranteed returns", "sure thing", "can't lose"
    ]),
    stablecoin: normalizeKeywordList(["USDT", "USDC", "BUSD", "DAI", "stablecoin", "fiat-backed", "peg", "Tether"]),
    nft: normalizeKeywordList(["NFT", "mint", "opensea", "collection", "pfp"]),
    defi: normalizeKeywordList(["DeFi", "staking", "yield farming", "lending", "borrowing", "DEX"]),
    web3: normalizeKeywordList(["Web3", "dApp", "blockchain", "DAO", "metaverse"]),
    memecoin: normalizeKeywordList([
        "DOGE", "SHIB", "FLOKI", "PEPE", "memecoin", "meme coin", "dogecoin", "shiba inu",
        "Dogecoin", "Shiba Inu", "Floki Inu", "Pepe", "Bonk", "BONK", "WIF", "dogwifhat", "Book of Meme", "BOME", "Myro", "MYRO", "Popcat", "POPCAT", "Cat in a dogs world", "MEW",
        "moon", "doge", "shib", "floki", "pepe", "bonk", "wif", "bome", "myro", "popcat", "mew", "cat", "dog", "inu", "wojak", "pepe the frog", "doge the dog", "shiba", "floki inu",
        "meme season", "meme pump", "meme rally", "meme mania", "meme frenzy", "meme craze", "meme bubble", "meme hype", "meme fomo", "meme fud", "meme shill", "meme shilling",
        "doge army", "shib army", "pepe army", "floki army", "bonk army", "wif army", "bome army", "myro army", "popcat army", "mew army", "cat army", "dog army", "inu army",
        "doge community", "shib community", "pepe community", "floki community", "bonk community", "wif community", "bome community", "myro community", "popcat community", "mew community",
        "doge holders", "shib holders", "pepe holders", "floki holders", "bonk holders", "wif holders", "bome holders", "myro holders", "popcat holders", "mew holders",
        "doge to the moon", "shib to the moon", "pepe to the moon", "floki to the moon", "bonk to the moon", "wif to the moon", "bome to the moon", "myro to the moon", "popcat to the moon", "mew to the moon",
        "doge lambo", "shib lambo", "pepe lambo", "floki lambo", "bonk lambo", "wif lambo", "bome lambo", "myro lambo", "popcat lambo", "mew lambo",
        "doge millionaire", "shib millionaire", "pepe millionaire", "floki millionaire", "bonk millionaire", "wif millionaire", "bome millionaire", "myro millionaire", "popcat millionaire", "mew millionaire"
    ])
};

// === 2. Analysis Helpers ===
const countKeywordMatches = (text, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = keyword.includes(" ") // phrase?
        ? new RegExp(`${escaped}`, 'gi')
        : new RegExp(`\\b${escaped}\\b`, 'gi');
    return (text.match(pattern) || []).length;
};

const isNegated = (text, keyword) => {
    const pattern = new RegExp(`\\b(?:not|never|no)\\s+${keyword}\\b`, 'i');
    return pattern.test(text);
};

// === 3. Sentiment Rules ===
const sentimentAnalysisRules = {
    overallSentiment: (tweet) => {
        const t = tweet.toLowerCase();
        let bull = 0, bear = 0;
        sentimentKeywords.bullish.forEach(k => { if (!isNegated(t, k)) bull += countKeywordMatches(t, k); });
        sentimentKeywords.bearish.forEach(k => { if (!isNegated(t, k)) bear += countKeywordMatches(t, k); });
        return bull > bear ? 'bullish' : bear > bull ? 'bearish' : 'neutral';
    },

    primaryFocus: (tweet) => {
        const t = tweet.toLowerCase();
        let focus = 'general crypto', max = 0;
        for (const cat in sentimentKeywords) {
            if (['bullish', 'bearish', 'bullshit_news'].includes(cat)) continue;
            let matches = 0;
            sentimentKeywords[cat].forEach(k => { matches += countKeywordMatches(t, k); });
            if (matches > max) {
                max = matches;
                focus = cat;
            }
        }
        return focus;
    },

    isFinancialAdvice: (tweet) => {
        const t = tweet.toLowerCase();
        return sentimentKeywords.bullshit_news.some(k => countKeywordMatches(t, k) > 0);
    }
};

// === 4. Tweet Analyzer ===
function analyzeTweets(tweets) {
    const analysis = {
        sentiment: { bullish: 0, bearish: 0, neutral: 0 },
        primaryFocusCounts: {},
        financialAdviceCount: 0,
        overallSentiment: 'neutral',
        primaryFocus: 'general crypto'
    };

    const priorityFocusOrder = ['memecoin', 'nft', 'defi', 'web3', 'stablecoin'];

    tweets.forEach(tweet => {
        const sentiment = sentimentAnalysisRules.overallSentiment(tweet);
        analysis.sentiment[sentiment]++;

        const focus = sentimentAnalysisRules.primaryFocus(tweet);
        analysis.primaryFocusCounts[focus] = (analysis.primaryFocusCounts[focus] || 0) + 1;

        if (sentimentAnalysisRules.isFinancialAdvice(tweet)) {
            analysis.financialAdviceCount++;
        }
    });

    // ✅ FIX: Compute majority-weighted sentiment
    const total = analysis.sentiment.bullish + analysis.sentiment.bearish + analysis.sentiment.neutral;
    if (total > 0) {
        const bullishPct = analysis.sentiment.bullish / total;
        const bearishPct = analysis.sentiment.bearish / total;

        if (bullishPct > 0.5) analysis.overallSentiment = 'bullish';
        else if (bearishPct > 0.5) analysis.overallSentiment = 'bearish';
        else analysis.overallSentiment = 'neutral';
    }

    // ✅ FIX: Prioritize real category > fallback to general crypto
    const focusEntries = Object.entries(analysis.primaryFocusCounts);
    const sorted = focusEntries.sort((a, b) => b[1] - a[1]);

    for (const [category] of sorted) {
        if (priorityFocusOrder.includes(category)) {
            analysis.primaryFocus = category;
            break;
        }
    }

    // fallback if nothing matched
    if (analysis.primaryFocus === 'general crypto' && sorted.length > 0) {
        analysis.primaryFocus = sorted[0][0];
    }

    return analysis;
}



// === 5. Main Function ===
async function performDeepTweetAnalysis() {
    try {
        console.log('🔍 Starting deep tweet analysis...');
        const tweets = await extractTweetsWithScrolling();
        console.log(`📊 Extracted ${tweets.length} tweets`);

        const analysis = analyzeTweets(tweets);
        console.log('📈 Tweet analysis completed:\n', JSON.stringify(analysis, null, 2));

        const url = window.location.href;
        const username = (url.match(/x\.com\/([A-Za-z0-9_]+)/) || [])[1] || '';

        await safeSendMessage({
            type: 'TWEET_ANALYSIS_COMPLETE',
            data: {
                username,
                tweets,
                analysis,
                timestamp: Date.now(),
                url
            }
        });

        return { tweets, analysis };
    } catch (err) {
        console.error('❌ Analysis failed:', err);
        return null;
    }
}



// Make functions available globally
window.extractTweetsWithScrolling = extractTweetsWithScrolling;
window.analyzeTweets = analyzeTweets;
window.performDeepTweetAnalysis = performDeepTweetAnalysis;

// Listen for test messages from page context
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "TEST_INJECTION") {
        console.log("✅ Injection test received from page context:", event.data);
    }
});