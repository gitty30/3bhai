// Enhanced API Interceptor for X/Twitter GraphQL calls
(function() {
  'use strict';
  
  console.log('🚀 Enhanced API Interceptor loaded on:', window.location.href);
  
  // Store original functions
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Function to extract and format profile data
  function extractProfileData(apiData) {
    try {
      if (!apiData || !apiData.data || !apiData.data.user || !apiData.data.user.result) {
        console.log('❌ Invalid API data structure');
        return null;
      }
      
      const user = apiData.data.user.result;
      const legacy = user.legacy || {};
      const verification = user.verification || {};
      const verificationInfo = user.verification_info || {};
      const tipjar = user.tipjar_settings || {};
      const affiliates = user.affiliates_highlighted_label || {};
      
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
      const createdDate = legacy.created_at ? 
        new Date(legacy.created_at).toISOString().split('T')[0] : 
        null;
      
      const profileData = {
        id: user.rest_id || user.id,
        username: legacy.screen_name || '',
        is_verified: user.is_blue_verified || false,
        is_identity_verified: verificationInfo.is_identity_verified || false,
        phone_verified: user.verified_phone_status || false,
        created_at: createdDate,
        followers: legacy.followers_count || 0,
        friends: legacy.friends_count || 0,
        ffr: ffr,
        tipjar_enabled: tipjar.is_enabled || false,
        affiliation: affiliates.label ? affiliates.label.description : null,
        business_label: !!affiliates.label,
        creator_subscriptions: user.creator_subscriptions_count || 0,
        suspicious_flags: suspiciousFlags
      };
      
      console.log('📊 Extracted Profile Data:', profileData);
      return profileData;
      
    } catch (error) {
      console.error('❌ Error extracting profile data:', error);
      return null;
    }
  }
  
  // Function to send data to background script
  function sendToBackground(data) {
    try {
      chrome.runtime.sendMessage({
        type: 'PROFILE_DATA_EXTRACTED',
        data: data,
        timestamp: Date.now(),
        url: window.location.href
      }).catch(err => {
        console.log('📨 Message send failed:', err);
      });
    } catch (error) {
      console.error('❌ Failed to send to background:', error);
    }
  }
  
  // Function to send data to database (placeholder)
  function sendToDatabase(data) {
    const CHANGE_URL = 'https://your-api-endpoint.com/profile-data'; // Replace with actual URL
    
    fetch(CHANGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      console.log('✅ Data sent to database:', result);
    })
    .catch(error => {
      console.error('❌ Failed to send to database:', error);
    });
  }
  
  // Function to process intercepted data
  function processInterceptedData(data, source) {
    console.log(`📦 Raw API Response Data (${source}):`, data);
    
    // Extract profile data
    const profileData = extractProfileData(data);
    
    if (profileData) {
      // Send to background script
      sendToBackground(profileData);
      
      // Send to database (uncomment when ready)
      // sendToDatabase(profileData);
      
      // Store in window for access by other scripts
      window.__lastApiProfileData = profileData;
    }
  }
  
  // Function to check if URL is a target API call
  function isTargetApiCall(url) {
    const urlString = typeof url === 'string' ? url : url.toString();
    return (
      (urlString.includes('api.x.com/graphql') && urlString.includes('UserByScreenName')) ||
      (urlString.includes('x.com/i/api/graphql') && urlString.includes('UserByScreenName')) ||
      (urlString.includes('api.twitter.com/graphql') && urlString.includes('UserByScreenName')) ||
      (urlString.includes('graphql') && urlString.includes('UserByScreenName'))
    );
  }
  
  // Override fetch function
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // Check if this is the X API call we want
    if (isTargetApiCall(url)) {
      console.log('🎯 INTERCEPTED FETCH API CALL!');
      console.log('URL:', url);
      console.log('Options:', options);
      
      // Call original fetch and intercept response
      return originalFetch.apply(this, args)
        .then(response => {
          console.log('📡 Fetch Response received:', response.status);
          
          // Clone response to read without consuming
          const clonedResponse = response.clone();
          
          // Extract and process the data
          clonedResponse.json()
            .then(data => {
              console.log('📦 Raw API Response Data (fetch):', data);
              processInterceptedData(data, 'fetch');
            })
            .catch(err => {
              console.log('❌ Fetch JSON parse failed:', err);
            });
          
          // Return original response unchanged
          return response;
        })
        .catch(error => {
          console.error('❌ Fetch error:', error);
          return originalFetch.apply(this, args);
        });
    }
    
    // For non-target requests, just pass through
    return originalFetch.apply(this, args);
  };
  
  // Override XMLHttpRequest with response capture
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    this._isTargetCall = isTargetApiCall(url);
    
    if (this._isTargetCall) {
      console.log('🎯 INTERCEPTED XHR OPEN CALL!');
      console.log('URL:', url);
      console.log('Method:', method);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    if (this._isTargetCall) {
      console.log('🎯 INTERCEPTED XHR SEND CALL!');
      console.log('URL:', this._url);
      console.log('Method:', this._method);
      console.log('Data:', data);
      
      // Store original onreadystatechange
      const originalOnReadyStateChange = this.onreadystatechange;
      
      this.onreadystatechange = function() {
        if (this.readyState === 4) {
          console.log('📡 XHR Response received:', this.status);
          
          if (this.status === 200) {
            try {
              const responseData = JSON.parse(this.responseText);
              console.log('📦 Raw API Response Data (xhr):', responseData);
              processInterceptedData(responseData, 'xhr');
            } catch (err) {
              console.log('❌ XHR JSON parse failed:', err);
            }
          } else {
            console.log('❌ XHR request failed with status:', this.status);
          }
        }
        
        // Call original handler if it exists
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments);
        }
      };
    }
    
    return originalXHRSend.apply(this, [data]);
  };
  
  // Monitor network requests using Performance API
  function monitorNetworkRequests() {
    if (window.performance && window.performance.getEntriesByType) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
            if (isTargetApiCall(entry.name)) {
              console.log('🔍 Performance API detected API call:', entry.name);
              
              // Try to intercept this call by making our own request
              interceptPerformanceApiCall(entry.name);
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['resource'] });
        console.log('✅ Performance API monitoring enabled');
      } catch (e) {
        console.log('⚠️ Performance API monitoring failed:', e);
      }
    }
  }
  
  // Function to intercept Performance API detected calls
  function interceptPerformanceApiCall(url) {
    console.log('🎯 Intercepting Performance API detected call:', url);
    
    // Instead of making a new request, let's capture the response data
    // by monitoring the network response directly
    captureResponseData(url);
  }
  
  // Function to capture response data from existing requests
  function captureResponseData(url) {
    console.log('🔍 Attempting to capture response data for:', url);
    
    // Method 1: Try to get from cache
    if ('caches' in window) {
      caches.match(url).then(response => {
        if (response) {
          console.log('📦 Found response in cache');
          response.json().then(data => {
            console.log('📦 Cached response data:', data);
            processInterceptedData(data, 'cache');
          }).catch(err => {
            console.log('❌ Failed to parse cached response:', err);
          });
        } else {
          console.log('📦 No cached response found');
        }
      }).catch(err => {
        console.log('❌ Cache check failed:', err);
      });
    }
    
    // Method 2: Try to extract from performance entry
    setTimeout(() => {
      console.log('🔄 Checking performance entry for response data...');
      
      const entries = performance.getEntriesByType('resource');
      const targetEntry = entries.find(entry => entry.name === url);
      
      if (targetEntry) {
        console.log('📊 Performance entry found:', {
          name: targetEntry.name,
          duration: targetEntry.duration,
          transferSize: targetEntry.transferSize,
          encodedBodySize: targetEntry.encodedBodySize,
          decodedBodySize: targetEntry.decodedBodySize,
          initiatorType: targetEntry.initiatorType
        });
        
        // If we have response size data, the request completed successfully
        if (targetEntry.transferSize > 0) {
          console.log('✅ API call completed successfully with data size:', targetEntry.transferSize);
          
          // Try to get the response from the network tab or use a different approach
          extractResponseFromNetworkTab(url);
        } else {
          console.log('⚠️ API call may have failed or is still in progress');
        }
      }
    }, 2000); // Wait 2 seconds for the request to complete
  }
  
  // Function to extract response from network tab or other sources
  function extractResponseFromNetworkTab(url) {
    console.log('🔍 Attempting to extract response from network...');
    
    // Method 1: Try to get from service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.active) {
            console.log('🔍 Service worker found, checking for cached response...');
          }
        });
      });
    }
    
    // Method 2: Try to intercept the response using a more sophisticated approach
    // Instead of making a new request, let's try to capture the response
    // from the original request that was already made
    
    console.log('📋 Response extraction methods attempted. Check Network tab for actual response data.');
    console.log('📋 You can manually copy the response from the Network tab and use:');
    console.log('📋 window.processManualResponse(responseData)');
  }
  
  // Monitor DOM for script tags that might make API calls
  function monitorScriptInjection() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src) {
            if (isTargetApiCall(node.src)) {
              console.log('🔍 Script injection detected:', node.src);
            }
          }
        });
      });
    });
    
    try {
      // Only observe if document.head exists
      if (document.head) {
        observer.observe(document.head, { childList: true, subtree: true });
        console.log('✅ Script injection monitoring enabled');
      } else {
        console.log('⚠️ Document head not available, skipping script injection monitoring');
      }
    } catch (e) {
      console.log('⚠️ Script injection monitoring failed:', e);
    }
  }
  
  // Monitor for dynamic fetch/XHR calls
  function monitorDynamicCalls() {
    // Override window.fetch after a delay to catch late assignments
    setTimeout(() => {
      if (window.fetch !== originalFetch) {
        console.log('🔄 Re-applying fetch override');
        const currentFetch = window.fetch;
        window.fetch = function(...args) {
          const [url] = args;
          if (isTargetApiCall(url)) {
            console.log('🎯 INTERCEPTED DYNAMIC FETCH CALL!');
            console.log('URL:', url);
          }
          return currentFetch.apply(this, args);
        };
      }
    }, 1000);
    
    // Monitor for new XMLHttpRequest instances
    setInterval(() => {
      if (XMLHttpRequest.prototype.open !== originalXHROpen) {
        console.log('🔄 Re-applying XHR override');
        XMLHttpRequest.prototype.open = originalXHROpen;
        XMLHttpRequest.prototype.send = originalXHRSend;
      }
    }, 2000);
  }
  
  // Start all monitoring
  monitorNetworkRequests();
  monitorScriptInjection();
  monitorDynamicCalls();
  
  // Check for existing requests that might have been made before interceptor loaded
  function checkExistingRequests() {
    console.log('🔍 Checking for existing API requests...');
    
    // Check Performance API for existing requests
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => isTargetApiCall(r.name));
      
      if (apiCalls.length > 0) {
        console.log('📋 Found existing API calls:', apiCalls);
        apiCalls.forEach(call => {
          console.log('🔍 Existing call:', call.name, 'Duration:', call.duration, 'ms');
        });
      } else {
        console.log('📋 No existing API calls found');
      }
    }
    
    // Check if there are any pending XHR requests
    if (window.XMLHttpRequest) {
      console.log('📋 XMLHttpRequest available');
    }
  }
  
  // Monitor for new network requests more aggressively
  function aggressiveNetworkMonitoring() {
    // Override addEventListener to catch network-related events
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'load' || type === 'error' || type === 'abort') {
        console.log('🔍 Event listener added:', type, 'for', this);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Monitor for any script execution that might make API calls
    const originalEval = window.eval;
    window.eval = function(code) {
      if (typeof code === 'string' && code.includes('fetch') && code.includes('UserByScreenName')) {
        console.log('🔍 Eval detected with potential API call:', code.substring(0, 200) + '...');
      }
      return originalEval.call(this, code);
    };
    
    // Monitor for Function constructor calls
    const originalFunction = window.Function;
    window.Function = function(...args) {
      const code = args[args.length - 1];
      if (typeof code === 'string' && code.includes('fetch') && code.includes('UserByScreenName')) {
        console.log('🔍 Function constructor detected with potential API call');
      }
      return originalFunction.apply(this, args);
    };
    
    // Monitor network requests using a more direct approach
    if (window.performance && window.performance.getEntriesByType) {
      let lastEntryCount = 0;
      
      setInterval(() => {
        const entries = performance.getEntriesByType('resource');
        
        if (entries.length > lastEntryCount) {
          // New entries detected
          const newEntries = entries.slice(lastEntryCount);
          
          newEntries.forEach(entry => {
            if (isTargetApiCall(entry.name)) {
              console.log('🆕 New API call detected via performance monitoring:', entry.name);
              console.log('Entry details:', {
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize,
                initiatorType: entry.initiatorType
              });
              
              // Try to intercept this call
              interceptPerformanceApiCall(entry.name);
            }
          });
          
          lastEntryCount = entries.length;
        }
      }, 100); // Check every 100ms
    }
  }
  
  // Try to manually trigger the API call by monitoring page interactions
  function monitorPageInteractions() {
    let clickCount = 0;
    let scrollCount = 0;
    
    document.addEventListener('click', () => {
      clickCount++;
      if (clickCount <= 3) {
        console.log('🖱️ Page interaction detected (click)', clickCount);
        setTimeout(() => {
          checkExistingRequests();
        }, 1000);
      }
    });
    
    document.addEventListener('scroll', () => {
      scrollCount++;
      if (scrollCount <= 3) {
        console.log('📜 Page interaction detected (scroll)', scrollCount);
        setTimeout(() => {
          checkExistingRequests();
        }, 1000);
      }
    });
    
    // Monitor for URL changes
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🔗 URL changed to:', currentUrl);
        setTimeout(() => {
          checkExistingRequests();
        }, 2000);
      }
    }, 1000);
  }
  
  // Initialize all monitoring
  checkExistingRequests();
  aggressiveNetworkMonitoring();
  monitorPageInteractions();
  
  console.log('✅ Enhanced fetch and XHR interceptors installed!');
  
  // Expose function to get last extracted data
  window.getLastApiProfileData = function() {
    return window.__lastApiProfileData || null;
  };
  
  // Function to manually trigger API call monitoring
  window.debugApiCalls = function() {
    console.log('🔍 Debugging API calls...');
    console.log('Current URL:', window.location.href);
    console.log('Fetch overridden:', window.fetch !== originalFetch);
    console.log('XHR overridden:', XMLHttpRequest.prototype.open !== originalXHROpen);
    
    // Check for any pending requests
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => isTargetApiCall(r.name));
      console.log('Recent API calls:', apiCalls);
    }
  };
  
  // Function to manually trigger the API call
  window.triggerApiCall = function() {
    console.log('🚀 Manually triggering API call...');
    
    const apiUrl = 'https://x.com/i/api/graphql/jUKA--0QkqGIFhmfRZdWrQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22elonmusk%22%7D&features=%7B%22responsive_web_grok_bio_auto_translation_is_enabled%22%3Afalse%2C%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22payments_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Atrue%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22subscriptions_feature_can_gift_premium%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Atrue%7D';
    
    console.log('Making API call to:', apiUrl);
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-GB,en;q=0.6',
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'x-twitter-active-user': 'yes',
        'x-twitter-client-language': 'en-GB'
      }
    })
    .then(response => {
      console.log('📡 Manual API call response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📦 Manual API call response data:', data);
      processInterceptedData(data, 'manual_trigger');
    })
    .catch(error => {
      console.error('❌ Manual API call failed:', error);
    });
  };
  
  // Function to manually extract response data from network
  window.extractResponseData = function() {
    console.log('🔍 Manually extracting response data...');
    
    // Check if we have any stored response data
    if (window.__lastApiProfileData) {
      console.log('📦 Found stored API data:', window.__lastApiProfileData);
      return window.__lastApiProfileData;
    }
    
    // Check performance entries for recent API calls
    if (window.performance && window.performance.getEntriesByType) {
      const entries = performance.getEntriesByType('resource');
      const apiCalls = entries.filter(entry => isTargetApiCall(entry.name));
      
      console.log('📋 Found API calls in performance entries:', apiCalls.length);
      
      if (apiCalls.length > 0) {
        const latestCall = apiCalls[apiCalls.length - 1];
        console.log('📊 Latest API call:', latestCall);
        
        // Try to extract response data from this call
        if (latestCall.transferSize > 0) {
          console.log('✅ API call completed with data size:', latestCall.transferSize);
          
          // Try to get from cache
          if ('caches' in window) {
            caches.match(latestCall.name).then(response => {
              if (response) {
                response.json().then(data => {
                  console.log('📦 Extracted response data:', data);
                  processInterceptedData(data, 'manual_extract');
                });
              } else {
                console.log('📦 No cached response found for manual extraction');
                console.log('📋 Please copy the response from Network tab and use:');
                console.log('📋 window.processManualResponse(responseData)');
              }
            });
          }
        }
      }
    }
    
    console.log('❌ No response data found to extract');
  };
  
  // Function to manually process response data copied from Network tab
  window.processManualResponse = function(responseData) {
    console.log('🔧 Processing manual response data...');
    
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (error) {
        console.error('❌ Failed to parse response data as JSON:', error);
        return;
      }
    }
    
    if (responseData && typeof responseData === 'object') {
      console.log('📦 Manual response data received:', responseData);
      processInterceptedData(responseData, 'manual_response');
    } else {
      console.error('❌ Invalid response data format');
    }
  };
  
  // Function to test current interceptor state
  window.testInterceptorState = function() {
    console.log('🧪 Testing Interceptor State...');
    console.log('Current URL:', window.location.href);
    console.log('Fetch overridden:', window.fetch !== originalFetch);
    console.log('XHR overridden:', XMLHttpRequest.prototype.open !== originalXHROpen);
    console.log('Last API data:', window.__lastApiProfileData);
    
    // Test background communication
    chrome.runtime.sendMessage({
      type: 'DEBUG_MESSAGE',
      test: 'Interceptor state test',
      timestamp: Date.now()
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('❌ Background communication failed:', chrome.runtime.lastError);
      } else {
        console.log('✅ Background communication working:', response);
      }
    });
  };
  

  
  async function extractTweetsWithScrolling() {
    const tweets = new Set();
    const walletMap = new Map(); // date -> wallet address mapping
    const processedElements = new Set();
    let previousHeight = document.body.scrollHeight;
    let scrollCount = 0;
    const maxScrolls = 8;
    const QUICK_EXIT_CONDITIONS = {
        noNewTweetsTimeout: 3000,
        minTweetsForQuickExit: 2,
        sameHeightIterations: 2,
        sameContentIterations: 2
    };

    // Regex patterns
    const PATTERNS = {
        // Matches Solana addresses (base58 format, 32-44 chars)
        solanaAddress: /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
        // Matches date in tweet format: "· Mar 19, 2024" or "· 19h" or "· 2d"
        tweetDate: /·\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}|\d{1,2}[hd])/i
    };

    function extractDateAndWallet(tweetContent) {
        // Extract date
        const dateMatch = tweetContent.match(PATTERNS.tweetDate);
        let tweetDate = null;
        
        if (dateMatch) {
            const dateStr = dateMatch[0].replace('·', '').trim();
            
            // Convert relative time to actual date
            if (dateStr.endsWith('h')) {
                const hoursAgo = parseInt(dateStr);
                tweetDate = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
            } else if (dateStr.endsWith('d')) {
                const daysAgo = parseInt(dateStr);
                tweetDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
            } else {
                tweetDate = new Date(dateStr);
            }
        }

        // Extract wallet addresses
        const walletAddresses = tweetContent.match(PATTERNS.solanaAddress) || [];
        
        // Validate addresses
        const validAddresses = walletAddresses.filter(addr => {
            return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
        });

        return {
            date: tweetDate ? tweetDate.toISOString().split('T')[0] : null,
            wallets: validAddresses
        };
    }

    let lastNewTweetTime = Date.now();
    let sameHeightCount = 0;
    let sameContentCount = 0;
    let lastTweetCount = 0;

    console.log('🔄 Starting optimized tweet extraction...');

    function shouldQuickExit() {
        const timeSinceLastTweet = Date.now() - lastNewTweetTime;
        const hasMinimumTweets = tweets.size >= QUICK_EXIT_CONDITIONS.minTweetsForQuickExit;
        
        if (hasMinimumTweets) {
            // Check time-based exit
            if (timeSinceLastTweet > QUICK_EXIT_CONDITIONS.noNewTweetsTimeout) {
                console.log(`⏰ No new tweets for ${QUICK_EXIT_CONDITIONS.noNewTweetsTimeout/1000}s with ${tweets.size} tweets - quick exit`);
                return true;
            }

            // Check height-based exit
            if (sameHeightCount >= QUICK_EXIT_CONDITIONS.sameHeightIterations) {
                console.log(`📏 Page height unchanged for ${sameHeightCount} iterations with ${tweets.size} tweets - quick exit`);
                return true;
            }

            // Check content-based exit
            if (sameContentCount >= QUICK_EXIT_CONDITIONS.sameContentIterations) {
                console.log(`📄 Content unchanged for ${sameContentCount} iterations with ${tweets.size} tweets - quick exit`);
                return true;
            }
        }

        return false;
    }

    function extractTweetsFromCurrentView() {
        const tweetArticles = document.querySelectorAll('article[role="article"]');
        let newTweetsCount = 0;
        const currentTweetCount = tweets.size;

        tweetArticles.forEach((article) => {
            if (processedElements.has(article)) return;
            
            const tweetContent = article.innerText || '';
            const trimmedContent = tweetContent.trim();
            
            if (trimmedContent && trimmedContent.length > 10) {
                if (!tweets.has(trimmedContent)) {
                    tweets.add(trimmedContent);
                    newTweetsCount++;
                    lastNewTweetTime = Date.now();
                    
                    // Extract date and wallet addresses
                    const { date, wallets } = extractDateAndWallet(trimmedContent);
                    
                    if (date && wallets.length > 0) {
                        // Store the first wallet address found for this date
                        walletMap.set(date, wallets[0]);
                        
                        console.log(`📅 Found wallet for ${date}:`, wallets[0]);
                    }
                    
                    console.log(`📄 New tweet ${tweets.size}:`);
                    console.log(`${trimmedContent}`);
                    console.log('─'.repeat(80));
                }
            }
            processedElements.add(article);
        });

        // Update content change tracking
        if (tweets.size === lastTweetCount) {
            sameContentCount++;
        } else {
            sameContentCount = 0;
            lastTweetCount = tweets.size;
        }

        return newTweetsCount;
    }

    // Initial load with minimal wait
    await new Promise(resolve => setTimeout(resolve, 1000));
    const initialTweets = extractTweetsFromCurrentView();
    console.log(`📊 Initially found ${initialTweets} tweets`);

    // Main extraction loop with quick exit conditions
    while (scrollCount < maxScrolls && !shouldQuickExit()) {
        const currentHeight = document.body.scrollHeight;
        const currentScrollY = window.scrollY;

        // Single smooth scroll to bottom
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

        // Short wait for content load
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newHeight = document.body.scrollHeight;
        
        // Update height change tracking
        if (newHeight === currentHeight) {
            sameHeightCount++;
        } else {
            sameHeightCount = 0;
        }

        // Extract new tweets
        const newTweets = extractTweetsFromCurrentView();
        console.log(`📝 Iteration ${scrollCount + 1}: Found ${newTweets} new tweets (Total: ${tweets.size})`);

        scrollCount++;
    }

    console.log('🎯 ========== EXTRACTION COMPLETE ==========');
    console.log(`📊 Total unique tweets: ${tweets.size}`);
    console.log(`💰 Wallet addresses found: ${walletMap.size}`);
    console.log('📅 Date -> Wallet mapping:');
    for (const [date, wallet] of walletMap) {
        console.log(`${date}: ${wallet}`);
    }
    console.log('🎯 ==========================================');

    // Return both tweets and wallet mapping
    return {
        tweets: Array.from(tweets),
        walletMap: Object.fromEntries(walletMap)
    };
  }
  
  // Update the deep analysis function to handle the new return format
  async function performDeepTweetAnalysis() {
    try {
        console.log('🔍 Starting deep tweet analysis...');
        const { tweets, walletMap } = await extractTweetsWithScrolling();
        console.log(`📊 Extracted ${tweets.length} tweets`);

        // Send wallet mapping to background script for storage
        if (Object.keys(walletMap).length > 0) {
            const url = window.location.href;
            const username = (url.match(/x\.com\/([A-Za-z0-9_]+)/) || [])[1] || '';
            
            await chrome.runtime.sendMessage({
                type: 'WALLET_MAPPING_FOUND',
                data: {
                    username,
                    wallet_list: walletMap,
                    timestamp: Date.now()
                }
            });
        }

        const analysis = analyzeTweets(tweets);
        // ... rest of your analysis code ...

        return { tweets, analysis, walletMap };
    } catch (err) {
        console.error('❌ Analysis failed:', err);
        return null;
    }
  }
  
})(); 