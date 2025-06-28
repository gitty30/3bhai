// Inject script to intercept fetch calls in page context
(function () {
  'use strict';
  
  console.log('🚀 Inject script loaded in page context');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch function
  window.fetch = async function (...args) {
    const [url, options] = args;
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Check if this is the X API call we want
    if (urlString.includes('api.x.com/graphql') && 
        urlString.includes('UserByScreenName')) {
      
      console.log('🎯 INJECT: Intercepted fetch call in page context!');
      console.log('URL:', urlString);
      console.log('Options:', options);
      
      try {
        // Call original fetch
        const response = await originalFetch.apply(this, args);
        
        console.log('📡 INJECT: Response received, status:', response.status);
        
        // Clone the response so we can read it
        const clone = response.clone();
        
        // Extract and process the data
        clone.json().then((data) => {
          console.log('📦 INJECT: Raw API Response Data:', data);
          
          // Send data to content script via postMessage
          window.postMessage({
            type: "TWITTER_USER_DATA",
            data: data,
            url: urlString,
            timestamp: Date.now()
          }, "*");
          
        }).catch(err => {
          console.log('❌ INJECT: JSON parse failed:', err);
        });
        
        return response;
      } catch (error) {
        console.error('❌ INJECT: Fetch error:', error);
        return originalFetch.apply(this, args);
      }
    }
    
    // For non-target requests, just pass through
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ INJECT: Fetch interceptor installed in page context!');
  
  // Also override XMLHttpRequest for completeness
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    this._isTargetCall = url.includes('api.x.com/graphql') && url.includes('UserByScreenName');
    
    if (this._isTargetCall) {
      console.log('🎯 INJECT: Intercepted XHR open call in page context!');
      console.log('URL:', url);
      console.log('Method:', method);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    if (this._isTargetCall) {
      console.log('🎯 INJECT: Intercepted XHR send call in page context!');
      
      // Store original onreadystatechange
      const originalOnReadyStateChange = this.onreadystatechange;
      
      this.onreadystatechange = function() {
        if (this.readyState === 4) {
          console.log('📡 INJECT: XHR Response received, status:', this.status);
          
          if (this.status === 200) {
            try {
              const responseData = JSON.parse(this.responseText);
              console.log('📦 INJECT: XHR Response Data:', responseData);
              
              // Send data to content script via postMessage
              window.postMessage({
                type: "TWITTER_USER_DATA",
                data: responseData,
                url: this._url,
                timestamp: Date.now(),
                source: 'xhr'
              }, "*");
              
            } catch (err) {
              console.log('❌ INJECT: XHR JSON parse failed:', err);
            }
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
  
  console.log('✅ INJECT: XHR interceptor installed in page context!');
  
})(); 