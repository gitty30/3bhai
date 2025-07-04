var e, t;
"function" == typeof (e = globalThis.define) && ((t = e), (e = null)),
  (function (t, r, o, n, s) {
    var a =
        "undefined" != typeof globalThis
          ? globalThis
          : "undefined" != typeof self
          ? self
          : "undefined" != typeof window
          ? window
          : "undefined" != typeof global
          ? global
          : {},
      i = "function" == typeof a[n] && a[n],
      c = i.cache || {},
      d =
        "undefined" != typeof module &&
        "function" == typeof module.require &&
        module.require.bind(module);
    function l(e, r) {
      if (!c[e]) {
        if (!t[e]) {
          var o = "function" == typeof a[n] && a[n];
          if (!r && o) return o(e, !0);
          if (i) return i(e, !0);
          if (d && "string" == typeof e) return d(e);
          var s = Error("Cannot find module '" + e + "'");
          throw ((s.code = "MODULE_NOT_FOUND"), s);
        }
        (f.resolve = function (r) {
          var o = t[e][1][r];
          return null != o ? o : r;
        }),
          (f.cache = {});
        var u = (c[e] = new l.Module(e));
        t[e][0].call(u.exports, f, u, u.exports, this);
      }
      return c[e].exports;
      function f(e) {
        var t = f.resolve(e);
        return !1 === t ? {} : l(t);
      }
    }
    (l.isParcelRequire = !0),
      (l.Module = function (e) {
        (this.id = e), (this.bundle = l), (this.exports = {});
      }),
      (l.modules = t),
      (l.cache = c),
      (l.parent = i),
      (l.register = function (e, r) {
        t[e] = [
          function (e, t) {
            t.exports = r;
          },
          {},
        ];
      }),
      Object.defineProperty(l, "root", {
        get: function () {
          return a[n];
        },
      }),
      (a[n] = l);
    for (var u = 0; u < r.length; u++) l(r[u]);
    if (o) {
      var f = l(o);
      "object" == typeof exports && "undefined" != typeof module
        ? (module.exports = f)
        : "function" == typeof e && e.amd
        ? e(function () {
            return f;
          })
        : s && (this[s] = f);
    }
  })(
    {
      kgW6q: [
        function (e, t, r) {
          e("../../../src/background");
        },
        { "../../../src/background": "fx8Od" },
      ],
      fx8Od: [
        function (e, t, r) {
          e("@parcel/transformer-js/src/esmodule-helpers.js").defineInteropFlag(
            r
          );
          let o = "f-analyzerReports",
            n = "f-analyzerReportsLastFetch",
            s = "fetchReportsHourly",
            keepAliveAlarm = "keepAliveAlarm",
            healthCheckAlarm = "healthCheckAlarm";
          
          // Keep alive alarm to prevent background script from becoming inactive
          function createKeepAliveAlarm() {
            chrome.alarms.create(keepAliveAlarm, {
              delayInMinutes: 1/12, // Run every 5 seconds (1/12 of a minute)
              periodInMinutes: 1/12
            });
          }
          
          // Health check alarm to monitor extension health
          function createHealthCheckAlarm() {
            chrome.alarms.create(healthCheckAlarm, {
              delayInMinutes: 5, // Run every 5 minutes
              periodInMinutes: 5
            });
          }
          
          // Initialize all alarms
          function initializeAlarms() {
            try {
              createKeepAliveAlarm();
              createHealthCheckAlarm();
            } catch (error) {
              // Silent error handling
            }
          }
          
          // Keep alive function to maintain background script activity
          function keepAlive() {
            try {
              // Update last activity timestamp silently
              chrome.storage.local.set({ 
                lastBackgroundActivity: Date.now() 
              }).catch(() => {
                // Silent error handling
              });
            } catch (error) {
              // Silent error handling
            }
          }
          
          // Health check function
          function healthCheck() {
            try {
              // Check if we can access storage
              chrome.storage.local.get(['lastBackgroundActivity'], (result) => {
                if (chrome.runtime.lastError) {
                  // Silent error handling
                }
              });
              
              // Verify alarms are still active
              chrome.alarms.getAll((alarms) => {
                if (chrome.runtime.lastError) {
                  // Recreate alarms if needed
                  initializeAlarms();
                }
              });
            } catch (error) {
              // Silent error handling
            }
          }
          
          function a() {
            chrome.alarms.create(s, {
              when:
                Date.now() +
                (function () {
                  let e = new Date(),
                    t = new Date(e);
                  return (
                    t.setUTCSeconds(0, 0),
                    t.setUTCMinutes(1),
                    t.setUTCHours(t.getUTCHours() + 1),
                    t.getTime() - e.getTime()
                  );
                })(),
            });
          }
          async function i() {
            try {
              let e = await fetch("https://api.uxento.io/reports", {
                cache: "no-store",
                credentials: "omit",
              });
              if (!e.ok) throw Error(`HTTP ${e.status}`);
              let t = await e.text(),
                r = await d(t, c);
              await chrome.storage.local.set({ [o]: r, [n]: Date.now() });
            } catch (e) {
              console.error("[F-Analyzer] reports fetch failed:", e);
            } finally {
              a();
            }
          }
          (async function () {
            let e = await chrome.storage.local.get([o, n]),
              t = e[n],
              r = !t || Date.now() - t > 36e5;
            !e[o] || r ? await i() : a();
            
            // Initialize all alarms to keep background script active
            initializeAlarms();
          })().catch(console.error),
            chrome.alarms.onAlarm.addListener((e) => {
              if (e.name === s) {
                i().catch(console.error);
              } else if (e.name === keepAliveAlarm) {
                keepAlive();
              } else if (e.name === healthCheckAlarm) {
                healthCheck();
              }
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if (e?.action === "ensureReports")
                return (
                  chrome.storage.local.get(o, (e) => {
                    e[o]
                      ? r({ success: !0, cached: !0 })
                      : i()
                          .then(() => r({ success: !0, cached: !1 }))
                          .catch((e) =>
                            r({ success: !1, error: e.toString() })
                          );
                  }),
                  !0
                );
            }),
            chrome.commands?.onCommand.addListener((e) => {
              "open-extension" === e && chrome.action.openPopup();
            }),
            chrome.runtime.onInstalled.addListener((e) => {
              "install" === e.reason &&
                chrome.tabs.create({
                  url: chrome.runtime.getURL("options.html"),
                });
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("fetchBalance" === e.action) {
                if (!e.wallet) {
                  r({ success: !1, error: "No wallet address provided." });
                  return;
                }
                let t = {
                  name: "nativeBalances",
                  data: { walletAddresses: [e.wallet], chainIds: [1399811149] },
                };
                return (
                  fetch("https://api-neo.bullx.io/v2/api/nativeBalances", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    },
                    body: JSON.stringify(t),
                  })
                    .then((e) => {
                      if (!e.ok) throw Error(`HTTP error ${e.status}`);
                      return e.json();
                    })
                    .then((t) => {
                      let o = t.nativeBalances?.[e.wallet]?.["1399811149"];
                      null != o
                        ? r({ success: !0, balance: o / 1e9 })
                        : r({
                            success: !1,
                            error: "Balance not found in response.",
                          });
                    })
                    .catch((e) => r({ success: !1, error: e.toString() })),
                  !0
                );
              }
              if (e.action === 'get_storage') {
                chrome.storage.local.get(e.key, (result) => {
                  if (chrome.runtime.lastError) {
                    r({ success: false, error: chrome.runtime.lastError.message });
                  } else {
                    r({ success: true, data: result[e.key] });
                  }
                });
                return true; // Keep the message channel open for async response
              }
              return !1;
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("fetchRepoData" === e.action)
                return (
                  fetch(
                    `https://www.uxento.io/api/health?repo=${encodeURIComponent(
                      e.repo
                    )}`
                  )
                    .then((e) => e.json())
                    .then((e) => r({ success: !0, data: e }))
                    .catch((e) => r({ success: !1, error: e.toString() })),
                  !0
                );
            });
          let c = "EyG2k4jGF0FVYGi8urLnuxgq183VkE1m";
          function d(e, t) {
            try {
              let r = e.slice(0, 32),
                o = e.slice(32),
                n = Uint8Array.from(r.match(/../g).map((e) => parseInt(e, 16))),
                s = Uint8Array.from(o.match(/../g).map((e) => parseInt(e, 16))),
                a = new TextEncoder().encode(t);
              return crypto.subtle
                .importKey("raw", a, { name: "AES-CBC", length: 256 }, !1, [
                  "decrypt",
                ])
                .then((e) =>
                  crypto.subtle.decrypt({ name: "AES-CBC", iv: n }, e, s)
                )
                .then((e) => JSON.parse(new TextDecoder().decode(e)));
            } catch (e) {
              throw (
                (console.error("decrypt-error:", e), Error("Decrypt failed"))
              );
            }
          }
          async function l(e) {
            let t = await fetch("https://api.uxento.io/pulse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tokens: e }),
              credentials: "omit",
            });
            if (!t.ok) throw Error(`HTTP ${t.status}: ${t.statusText}`);
            let r = await t.text();
            return await d(r, c);
          }
          async function u(e) {
            try {
              let t = await fetch("https://api.uxento.io/twitter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: e }),
                credentials: "omit",
              });
              if (!t.ok) throw Error(`HTTP ${t.status}`);
              let r = await t.text(),
                o = await d(r, c);
              
              console.info(`[F-Analyzer] Decoded Twitter data for @${e}:`, o);
              
              // Check if the response indicates no data or error
              let hasValidData = true;
              if (Array.isArray(o) && o.length > 0 && o[0].error && o[0].error.includes('no data')) {
                hasValidData = false;
                console.info(`[F-Analyzer] Primary API returned no data for @${e}, trying fallback...`);
              } else if (!o || (Array.isArray(o) && o.length === 0)) {
                hasValidData = false;
                console.info(`[F-Analyzer] Primary API returned empty data for @${e}, trying fallback...`);
              }
              
              if (hasValidData) {
                await chrome.storage.local.set({ ["f-analyzer_twitter_" + e]: o });
                return o;
              }
              
              // Try fallback API
              return await uFallback(e);
              
            } catch (error) {
              console.error(`[F-Analyzer] Primary Twitter API failed for @${e}:`, error);
              console.info(`[F-Analyzer] Trying fallback API for @${e}...`);
              return await uFallback(e);
            }
          }
          
          async function uFallback(e) {
            try {
              let fallbackResponse = await fetch(`https://api.memory.lol/v1/tw/${e}`, {
                method: "GET",
                credentials: "omit",
              });
              
              if (!fallbackResponse.ok) {
                throw Error(`Fallback HTTP ${fallbackResponse.status}`);
              }
              
              let fallbackData = await fallbackResponse.json();
              console.info(`[F-Analyzer] Fallback API response for @${e}:`, fallbackData);
              
              // Check if we have account data
              if (fallbackData.accounts && fallbackData.accounts.length > 0) {
                let account = fallbackData.accounts[0];
                let formattedData = {
                  id: account.id_str || account.id?.toString(),
                  username: e,
                  screen_names: account.screen_names || {},
                  source: 'memory.lol',
                  timestamp: new Date().toISOString()
                };
                
                console.info(`[F-Analyzer] Fallback data formatted for @${e}:`, formattedData);
                await chrome.storage.local.set({ ["f-analyzer_twitter_" + e]: [formattedData] });
                return [formattedData];
              } else {
                // No data found in fallback either
                let noDataResponse = {
                  error: 'No data found in primary or fallback APIs',
                  username: e,
                  source: 'memory.lol',
                  timestamp: new Date().toISOString()
                };
                
                console.info(`[F-Analyzer] No data found in fallback API for @${e}`);
                await chrome.storage.local.set({ ["f-analyzer_twitter_" + e]: [noDataResponse] });
                return [noDataResponse];
              }
              
            } catch (fallbackError) {
              console.error(`[F-Analyzer] Fallback API also failed for @${e}:`, fallbackError);
              let errorResponse = {
                error: `Both primary and fallback APIs failed: ${fallbackError.message}`,
                username: e,
                source: 'fallback_failed',
                timestamp: new Date().toISOString()
              };
              
              await chrome.storage.local.set({ ["f-analyzer_twitter_" + e]: [errorResponse] });
              return [errorResponse];
            }
          }
          async function f(e) {
            let t = await fetch("https://api.uxento.io/x2", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: e }),
              credentials: "omit",
            });
            if (!t.ok) throw Error(`HTTP ${t.status}`);
            let r = await t.text(),
              o = await d(r, c);
            return (
              console.info(`[F-Analyzer] Decoded X2 data for @${e}:`, o),
              await chrome.storage.local.set({ ["f-analyzer_twitter_x2_" + e]: o }),
              o
            );
          }
          chrome.runtime.onMessage.addListener((e, t, r) => {
            if ("fetchAlphaData" === e.type)
              return (
                (function (e, t) {
                  let r;
                  if (e.tokens && Array.isArray(e.tokens)) r = e.tokens;
                  else if (e.tokenAddress && "string" == typeof e.tokenAddress)
                    r = [e.tokenAddress];
                  else {
                    t({
                      success: !1,
                      error:
                        "Invalid parameters: tokens array or tokenAddress required",
                    });
                    return;
                  }
                  l(r)
                    .then((e) => t({ success: !0, data: e }))
                    .catch((e) => {
                      console.error("[F-Analyzer] Pulse data fetch error:", e),
                        t({ success: !1, error: e.toString() });
                    });
                })(e, r),
                !0
              );
          }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("setAddress" === e.action)
                return (
                  chrome.storage.local.set({ storedAddress: e.address }, () =>
                    r({ success: !0 })
                  ),
                  !0
                );
              if ("getAddress" === e.action)
                return (
                  chrome.storage.local.get("storedAddress", (e) =>
                    r({ address: e.storedAddress || "" })
                  ),
                  !0
                );
              if ("linksFound" === e.action)
                return (
                  chrome.storage.local.set(
                    {
                      storedTwitterLink: e.twitterLink || "",
                      storedWebsiteLink: e.websiteLink || "",
                    },
                    () => r({ success: !0 })
                  ),
                  !0
                );
              if ("getTwitterLink" === e.action)
                return (
                  chrome.storage.local.get("storedTwitterLink", (e) =>
                    r({ twitterLink: e.storedTwitterLink || "" })
                  ),
                  !0
                );
              if ("getWebsiteLink" === e.action)
                return (
                  chrome.storage.local.get("storedWebsiteLink", (e) =>
                    r({ websiteLink: e.storedWebsiteLink || "" })
                  ),
                  !0
                );
              if ("axiomDataFound" === e.action) {
                let t = {
                  tokenAddress: e.tokenAddress || "",
                  twitterLink: e.twitterLink || "",
                  websiteLink: e.websiteLink || "",
                  tokenName: e.tokenName || "",
                  tokenTicker: e.tokenTicker || "",
                  deployerAddress: e.deployerAddress || "",
                };
                return (
                  chrome.storage.local.set({ storedAxiomData: t }, () =>
                    r({ success: !0 })
                  ),
                  !0
                );
              }
              if ("getAxiomData" === e.action)
                return (
                  chrome.storage.local.get("storedAxiomData", (e) =>
                    r(e.storedAxiomData || {})
                  ),
                  !0
                );
              if ("tokenDataFound" === e.action) {
                let t = {
                  symbol: e.symbol || "",
                  deployerAddress: e.deployerAddress || "",
                };
                return (
                  chrome.storage.local.set({ storedTokenData: t }, () =>
                    r({ success: !0 })
                  ),
                  !0
                );
              }
              return (
                "getTokenData" === e.action &&
                (chrome.storage.local.get("storedTokenData", (e) =>
                  r(e.storedTokenData || {})
                ),
                !0)
              );
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("OPEN_BACKGROUND_TAB" === e.type && e.url)
                return (
                  chrome.tabs
                    .create({ url: e.url, active: !1 })
                    .then((e) => {
                      console.log("Tab opened in background:", e.id),
                        r({ success: !0, tabId: e.id });
                    })
                    .catch((e) => {
                      console.error("Error opening tab:", e),
                        r({ success: !1, error: e.message });
                    }),
                  !0
                );
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if (
                "fetchTwitterData" === e.action &&
                "string" == typeof e.username
              )
                return (
                  u(e.username.trim())
                    .then((t) => {
                      r({ success: !0, data: t }),
                        chrome.runtime
                          .sendMessage({
                            action: "twitterDataFetched",
                            username: e.username.trim(),
                            data: t,
                          })
                          .catch(() => {});
                    })
                    .catch((e) => r({ success: !1, error: e.toString() })),
                  !0
                );
            }),
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("fetchX2Data" === e.action && "string" == typeof e.username) {
                let t = `f-analyzer_x2_${e.username}`;
                return (
                  chrome.storage.local.get(t, (o) => {
                    let n = o[t];
                    n && Date.now() - n.ts < 6048e5
                      ? r({ success: !0, data: n.data, cached: !0 })
                      : f(e.username.trim())
                          .then((e) => {
                            chrome.storage.local.set({
                              [t]: { ts: Date.now(), data: e },
                            }),
                              r({ success: !0, data: e, cached: !1 });
                          })
                          .catch((e) =>
                            r({ success: !1, error: e.toString() })
                          );
                  }),
                  !0
                );
              }
            });

            // Session management for chat context
            const chatSessions = new Map(); // tabId -> session data

            // Format AI response for better readability
            function formatAIResponse(text) {
              if (!text || typeof text !== 'string') {
                return text;
              }
              
              let formattedText = text;
              
              // Convert **text** to <strong>text</strong> for bold formatting
              formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              
              // Handle bullet points with • symbols - ensure they start on new lines
              formattedText = formattedText.replace(/([^•\n])\s*•\s*/g, '$1\n\n• ');
              
              // Also handle bullet points that might already be at the start of lines
              formattedText = formattedText.replace(/(\n|^)\s*•\s*/g, '\n\n• ');
              
              // Convert * bullet points to proper line breaks (fallback)
              formattedText = formattedText.replace(/\s*\*\s*/g, '\n\n• ');
              
              // Ensure proper line breaks after sentences that end with periods
              formattedText = formattedText.replace(/\.\s+/g, '.\n\n');
              
              // Clean up multiple consecutive line breaks
              formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
              
              // Add line break before "Overall:" or similar section headers
              formattedText = formattedText.replace(/(\n|^)(\*\*Overall:\*\*)/g, '\n\n$2');
              formattedText = formattedText.replace(/(\n|^)(Overall:)/g, '\n\n$2');
              
              // Add line break before "Want me to" or similar action prompts
              formattedText = formattedText.replace(/(\n|^)(Want me to)/g, '\n\n$2');
              
              // Add line break before "Recommendation:" or similar section headers
              formattedText = formattedText.replace(/(\n|^)(\*\*Recommendation:\*\*)/g, '\n\n$2');
              formattedText = formattedText.replace(/(\n|^)(Recommendation:)/g, '\n\n$2');
              
              // Add line break before "AutoSnipe Analysis Summary:" or similar
              formattedText = formattedText.replace(/(\n|^)(\*\*AutoSnipe Analysis Summary:\*\*)/g, '\n\n$2');
              formattedText = formattedText.replace(/(\n|^)(AutoSnipe Analysis Summary:)/g, '\n\n$2');
              
              // Trim extra whitespace
              formattedText = formattedText.trim();
              
              return formattedText;
            }

            // Gemini AI Chat Integration
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("chatWithAI" === e.action && "string" == typeof e.message) {
                return (
                  (async () => {
                    try {
                      // Get current tab information
                      const [currentTab] = await chrome.tabs.query({
                        active: true,
                        currentWindow: true,
                      });
                      
                      if (!currentTab) {
                        throw new Error('No active tab found');
                      }
                      
                      const tabId = currentTab.id;
                      console.log('[Deceptix] Current tab:', currentTab?.url, 'Tab ID:', tabId);
                      
                      // Check if we have an existing session for this tab
                      let session = chatSessions.get(tabId);
                      let isNewSession = false;
                      
                      if (!session) {
                        // Create new session
                        isNewSession = true;
                        session = {
                          tabId: tabId,
                          url: currentTab.url,
                          context: null,
                          userData: null,
                          messageCount: 0
                        };
                        chatSessions.set(tabId, session);
                        console.log('[Deceptix] Created new chat session for tab:', tabId);
                      }
                      
                      // Extract username and get user data only for new sessions
                      let currentUsername = null;
                      let profileData = null;
                      
                      if (isNewSession && currentTab?.url) {
                        try {
                          // Extract username from URL patterns like:
                          // https://twitter.com/username
                          // https://x.com/username
                          const urlMatch = currentTab.url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
                          if (urlMatch && urlMatch[1] && !urlMatch[1].includes('.')) {
                            currentUsername = urlMatch[1];
                            console.log('[Deceptix] Extracted username from URL:', currentUsername);
                            
                            // Try to get profile data from localhost API
                            try {
                              const profileResponse = await fetch(`http://localhost:3000/user/${currentUsername}`);
                              if (profileResponse.ok) {
                                profileData = await profileResponse.json();
                                console.log('[Deceptix] Retrieved profile data from API:', profileData);
                                session.userData = profileData;
                              } else {
                                console.log('[Deceptix] No profile data found in API for username:', currentUsername);
                              }
                            } catch (apiError) {
                              console.log('[Deceptix] Could not fetch from API, trying local storage:', apiError.message);
                              
                              // Fallback to local storage
                              const localData = await chrome.storage.local.get(`profile_data_${currentUsername}`);
                              if (localData[`profile_data_${currentUsername}`]) {
                                profileData = localData[`profile_data_${currentUsername}`].data;
                                console.log('[Deceptix] Retrieved profile data from local storage:', profileData);
                                session.userData = profileData;
                              }
                            }
                          }
                        } catch (urlError) {
                          console.log('[Deceptix] Could not extract username from URL:', urlError.message);
                        }
                      } else {
                        // Use existing session data
                        profileData = session.userData;
                        currentUsername = session.userData?.username;
                      }
                      
                      // Load extension context only for new sessions
                      let context = '';
                      if (isNewSession) {
                        try {
                          const contextResponse = await fetch(chrome.runtime.getURL('extension-context.txt'));
                          if (contextResponse.ok) {
                            context = await contextResponse.text();
                            session.context = context;
                            console.log('[Deceptix] Loaded extension context for new session');
                          }
                        } catch (contextError) {
                          console.warn('[NEURAL_SCAN] Could not load context file, using fallback:', contextError);
                          context = 'You are a helpful AI assistant for AutoSnipe, a browser extension that provides wallet analytics and copy trading insights for social media profiles.';
                          session.context = context;
                        }
                      } else {
                        // Use existing context from session
                        context = session.context;
                      }
                      
                      // Build prompt based on session state
                      let fullPrompt = '';
                      
                      if (isNewSession) {
                        // For new sessions, include full context
                        let enhancedContext = context;
                        
                        if (currentUsername && profileData) {
                          enhancedContext += `\n\nCURRENT USER CONTEXT:
You are analyzing the profile of @${currentUsername} (${profileData.name || 'Unknown Name'}).

Profile Information:
- Username: @${currentUsername}
- Display Name: ${profileData.name || 'Unknown'}
- Account Created: ${profileData.created_at || 'Unknown'}
- Followers: ${profileData.followers || 0}
- Following: ${profileData.friends || 0}
- Posts: ${profileData.statuses || 0}
- Media Count: ${profileData.media || 0}
- Verified: ${profileData.verified ? 'Yes' : 'No'}
- Blue Verified: ${profileData.blue_verified ? 'Yes' : 'No'}
- Phone Verified: ${profileData.phone_verified ? 'Yes' : 'No'}
- Identity Verified: ${profileData.identity_verified ? 'Yes' : 'No'}
- Tipjar Enabled: ${profileData.tipjar_enabled ? 'Yes' : 'No'}
- Subscriptions: ${profileData.subscriptions || 0}
- Website: ${profileData.website || 'None'}
- Birthdate: ${profileData.birthdate || 'Not provided'}
- Suspicious Flags: ${profileData.suspicious_flags?.length > 0 ? profileData.suspicious_flags.join(', ') : 'None detected'}

Current Page: ${currentTab?.url || 'Unknown'}

Please provide analysis and insights specific to this user's profile when relevant to the user's query.`;
                        } else if (currentUsername) {
                          enhancedContext += `\n\nCURRENT USER CONTEXT:
You are analyzing the profile of @${currentUsername}.

Current Page: ${currentTab?.url || 'Unknown'}

Note: Detailed profile data is not available for this user, but you can still provide general security analysis and guidance.`;
                        } else {
                          enhancedContext += `\n\nCURRENT CONTEXT:
No specific user profile is currently being analyzed.

Current Page: ${currentTab?.url || 'Unknown'}

Please provide general security analysis and guidance.`;
                        }
                        
                        fullPrompt = `${enhancedContext}\n\nUser Query: ${e.message}\n\nPlease respond as the AutoSnipe AI assistant. Provide comprehensive wallet analysis and trading insights using all available profile data. Be friendly and helpful - explain what each metric means for trading performance and wallet activity. Focus on actionable insights for copy trading and portfolio analysis.`;
                        console.log('[AutoSnipe] New session - full context included');
                      } else {
                        // For existing sessions, just send the user query
                        fullPrompt = `User Query: ${e.message}\n\nPlease respond as the AutoSnipe AI assistant. Provide comprehensive wallet analysis and trading insights using all available profile data. Be friendly and helpful - explain what each metric means for trading performance and wallet activity. Focus on actionable insights for copy trading and portfolio analysis.`;
                        console.log('[AutoSnipe] Existing session - user query only');
                      }
                      
                      // Update session message count
                      session.messageCount++;
                      
                      // Call Gemini API
                      const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=[]`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            contents: [
                              {
                                parts: [
                                  {
                                    text: fullPrompt
                                  }
                                ]
                              }
                            ],
                            generationConfig: {
                              temperature: 0.7,
                              maxOutputTokens: 500,
                              topP: 0.8,
                              topK: 40
                            }
                          })
                        }
                      );

                      if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                      }

                      const data = await response.json();
                      
                      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        let aiResponse = data.candidates[0].content.parts[0].text;
                        
                        // Format the response for better readability
                        aiResponse = formatAIResponse(aiResponse);
                        
                        r({ success: true, response: aiResponse });
                      } else if (data.error) {
                        throw new Error(`Gemini API Error: ${data.error.message || 'Unknown error'}`);
                      } else {
                        throw new Error('Invalid response format from Gemini API');
                      }
                    } catch (error) {
                      console.error('[Deceptix] AI Chat error:', error);
                      r({ success: false, error: error.toString() });
                    }
                  })(),
                  true
                );
              }
            });

            // Clean up chat sessions when tabs are closed
            chrome.tabs.onRemoved.addListener((tabId) => {
              if (chatSessions.has(tabId)) {
                chatSessions.delete(tabId);
                console.log('[Deceptix] Cleaned up chat session for closed tab:', tabId);
              }
            });

            // Clean up chat sessions when tabs are updated (URL changes)
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
              if (changeInfo.status === 'complete' && chatSessions.has(tabId)) {
                const session = chatSessions.get(tabId);
                if (session.url !== tab.url) {
                  // URL changed, remove old session
                  chatSessions.delete(tabId);
                  console.log('[Deceptix] Cleaned up chat session due to URL change:', tabId, 'Old URL:', session.url, 'New URL:', tab.url);
                }
              }
            });

            // Close Sidebar Handler
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("closeSidebar" === e.action) {
                return (
                  (async () => {
                    try {
                      const [tab] = await chrome.tabs.query({
                        active: true,
                        currentWindow: true,
                      });
                      
                      if (tab) {
                        await chrome.sidePanel.setOptions({
                          tabId: tab.id,
                          enabled: false,
                        });
                        r({ success: true });
                      } else {
                        r({ success: false, error: 'No active tab found' });
                      }
                    } catch (error) {
                      console.error('[Deceptix] Close sidebar error:', error);
                      r({ success: false, error: error.toString() });
                    }
                  })(),
                  true
                );
              }
            });

            // Wallet and Token Data Handlers
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("getWalletData" === e.action) {
                const username = e.username;
                if (!username) {
                  r({ success: false, error: 'Username required' });
                  return true;
                }
                
                chrome.storage.local.get(`wallet_list_${username}`, (result) => {
                  const walletData = result[`wallet_list_${username}`];
                  if (walletData) {
                    r({ success: true, data: walletData });
                  } else {
                    r({ success: false, error: 'No wallet data found' });
                  }
                });
                return true;
              }
            });

            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("getTokenData" === e.action) {
                const username = e.username;
                if (!username) {
                  r({ success: false, error: 'Username required' });
                  return true;
                }
                
                chrome.storage.local.get(`token_list_${username}`, (result) => {
                  const tokenData = result[`token_list_${username}`];
                  if (tokenData) {
                    r({ success: true, data: tokenData });
                  } else {
                    r({ success: false, error: 'No token data found' });
                  }
                });
                return true;
              }
            });

            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("refreshWalletPnL" === e.action) {
                const { username, walletAddress } = e;
                if (!username || !walletAddress) {
                  r({ success: false, error: 'Username and wallet address required' });
                  return true;
                }
                
                (async () => {
                  try {
                    console.log(`🔄 Refreshing PnL for wallet: ${walletAddress}`);
                    const pnlData = await fetchWalletPnL(walletAddress);
                    
                    // Update the stored data
                    const storageKey = `wallet_list_${username}`;
                    chrome.storage.local.get(storageKey, (result) => {
                      const existingData = result[storageKey];
                      if (existingData && existingData.data) {
                        // Find and update the specific wallet
                        for (const [date, wallets] of Object.entries(existingData.data)) {
                          const walletIndex = wallets.findIndex(w => w.address === walletAddress);
                          if (walletIndex !== -1) {
                            existingData.data[date][walletIndex] = {
                              address: walletAddress,
                              pnlData: pnlData,
                              lastUpdated: Date.now()
                            };
                            break;
                          }
                        }
                        
                        // Save updated data
                        chrome.storage.local.set({ [storageKey]: existingData }, () => {
                          r({ success: true, pnlData: pnlData });
                        });
                      } else {
                        r({ success: false, error: 'Wallet data not found' });
                      }
                    });
                  } catch (error) {
                    console.error(`❌ Failed to refresh PnL for ${walletAddress}:`, error);
                    r({ success: false, error: error.message });
                  }
                })();
                return true;
              }
            });

            // Profile Data Interceptor Handler
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("PROFILE_DATA_EXTRACTED" === e.type && e.data) {
                return (
                  (async () => {
                    try {
                      console.log('📨 Received intercepted profile data in background script!');
                      console.log('Data:', e.data);
                      console.log('Timestamp:', e.timestamp);
                      console.log('URL:', e.url);
                      console.log('Source:', e.source);
                      console.log('Sender tab:', t.tab?.id);
                      
                      // Log the extracted profile data in a readable format
                      console.log('📊 Extracted Profile Summary:');
                      console.log(`   ID: ${e.data.id}`);
                      console.log(`   Username: ${e.data.username}`);
                      console.log(`   Name: ${e.data.name}`);
                      console.log(`   Created: ${e.data.created_at}`);
                      console.log(`   Followers: ${e.data.followers}`);
                      console.log(`   Friends: ${e.data.friends}`);
                      console.log(`   Statuses: ${e.data.statuses}`);
                      console.log(`   Media: ${e.data.media}`);
                      console.log(`   Verified: ${e.data.verified}`);
                      console.log(`   Blue Verified: ${e.data.blue_verified}`);
                      console.log(`   Phone Verified: ${e.data.phone_verified}`);
                      console.log(`   Identity Verified: ${e.data.identity_verified}`);
                      console.log(`   Tipjar: ${e.data.tipjar_enabled}`);
                      console.log(`   Subscriptions: ${e.data.subscriptions}`);
                      console.log(`   Website: ${e.data.website}`);
                      console.log(`   Birthdate: ${e.data.birthdate}`);
                      console.log(`   Suspicious Flags: ${e.data.suspicious_flags?.join(', ') || 'None'}`);
                      
                      // Store the data locally
                      await chrome.storage.local.set({
                        [`profile_data_${e.data.username}`]: {
                          data: e.data,
                          timestamp: e.timestamp,
                          url: e.url,
                          source: e.source
                        }
                      });
                      
                      console.log('✅ Profile data stored locally');
                      
                      // Send to database (placeholder - replace CHANGE_URL with actual endpoint)
                      const CHANGE_URL = 'http://localhost:3000/save';
                      
                      try {
                        console.log('📤 Sending data to database...');
                        
                        // Prepare data in the format expected by the Express API
                        const apiData = {
                          id: e.data.id,
                          username: e.data.username,
                          name: e.data.name,
                          created_at: e.data.created_at,
                          followers: parseInt(e.data.followers) || 0,
                          friends: parseInt(e.data.friends) || 0,
                          statuses: parseInt(e.data.statuses) || 0,
                          media: parseInt(e.data.media) || 0,
                          verified: Boolean(e.data.verified),
                          blue_verified: Boolean(e.data.blue_verified),
                          phone_verified: Boolean(e.data.phone_verified),
                          identity_verified: Boolean(e.data.identity_verified),
                          tipjar_enabled: Boolean(e.data.tipjar_enabled),
                          subscriptions: parseInt(e.data.subscriptions) || 0,
                          profile_url: e.data.profile_url,
                          banner_url: e.data.banner_url,
                          website: e.data.website,
                          birthdate: e.data.birthdate,
                          ffr: parseInt(e.data.ffr) || 0,
                          affiliation: e.data.affiliation,
                          business_label: Boolean(e.data.business_label),
                          creator_subscriptions: parseInt(e.data.creator_subscriptions) || 0,
                          suspicious_flags: e.data.suspicious_flags || [],
                          username_switches: 1 // Default value as expected by API
                        };
                        
                        console.log('📦 Prepared API data:', apiData);
                        
                        const response = await fetch(CHANGE_URL, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(apiData)
                        });
                        
                        if (response.ok) {
                          const result = await response.text();
                          console.log('✅ Profile data sent to database:', result);
                          r({ success: true, databaseResult: result });
                        } else {
                          const errorText = await response.text();
                          console.warn('⚠️ Database request failed:', response.status, errorText);
                          r({ success: false, error: `HTTP ${response.status}: ${errorText}` });
                        }
                      } catch (dbError) {
                        console.error('❌ Database error:', dbError);
                        // Don't fail the whole operation if database is down
                        r({ success: true, databaseError: dbError.toString() });
                      }
                      
                    } catch (error) {
                      console.error('[Deceptix] Profile data handler error:', error);
                      r({ success: false, error: error.toString() });
                    }
                  })(),
                  true
                );
              }
            });
            
            // Helper function to create message hash for deduplication
            function createMessageHash(message) {
              const key = message.type || message.action;
              const dataStr = JSON.stringify(message.data || message.username || message.walletAddress || '');
              return `${key}_${dataStr}`;
            }

            // Helper function to check if message should be throttled
            function shouldThrottleMessage(messageType) {
              const throttledTypes = ['profileData', 'scrapedData'];
              return throttledTypes.includes(messageType);
            }

            // Helper function to check if message should be logged
            function shouldLogMessage(messageType) {
              const silentTypes = ['profileData', 'scrapedData']; // These are filtered silently
              return !silentTypes.includes(messageType);
            }

            // Helper function to report message stats periodically
            function reportMessageStats() {
              const now = Date.now();
              if (now - messageStats.lastStatsReport > STATS_REPORT_INTERVAL) {
                if (messageStats.duplicatesFiltered > 0 || messageStats.throttledMessages > 0) {
                  console.log(`📊 Message Filter Stats (last 30s): ${messageStats.processedMessages} processed, ${messageStats.duplicatesFiltered} duplicates filtered, ${messageStats.throttledMessages} throttled`);
                }
                
                // Reset stats
                messageStats.duplicatesFiltered = 0;
                messageStats.throttledMessages = 0;
                messageStats.processedMessages = 0;
                messageStats.lastStatsReport = now;
              }
            }

            // Helper function to clean up old cache entries
            function cleanupMessageCache() {
              const now = Date.now();
              for (const [hash, timestamp] of messageCache.entries()) {
                if (now - timestamp > MESSAGE_CACHE_DURATION) {
                  messageCache.delete(hash);
                }
              }
              for (const [type, timestamp] of messageThrottles.entries()) {
                if (now - timestamp > MESSAGE_THROTTLE_DURATION) {
                  messageThrottles.delete(type);
                }
              }
            }

            // Cleanup cache every minute
            setInterval(cleanupMessageCache, 60000);

            // =================================================================
            // UNIFIED MESSAGE HANDLER
            // =================================================================
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              const messageType = message.type || message.action;
              const messageHash = createMessageHash(message);
              const now = Date.now();
              
              reportMessageStats();
              
              // if (messageCache.has(messageHash)) {
              //   const lastSeen = messageCache.get(messageHash);
              //   if (now - lastSeen < MESSAGE_CACHE_DURATION) {
              //     messageStats.duplicatesFiltered++;
              //     if (shouldLogMessage(messageType)) {
              //       console.log(`🚫 Duplicate filtered: ${messageType}`);
              //     }
              //     return false;
              //   }
              // }
              
              if (shouldThrottleMessage(messageType)) {
                if (messageThrottles.has(messageType)) {
                  const lastProcessed = messageThrottles.get(messageType);
                  if (now - lastProcessed < MESSAGE_THROTTLE_DURATION) {
                    messageStats.throttledMessages++;
                    return false;
                  }
                }
                messageThrottles.set(messageType, now);
              }
              
              messageCache.set(messageHash, now);
              messageStats.processedMessages++;
              
              if (shouldLogMessage(messageType)) {
                console.log('📬 Processing message:', messageType);
              }
              
              // Handle async responses correctly
              (async () => {
                try {
                  switch (messageType) {
                    case "PROCESS_TWEETS":
                      const result = await processTweets(message.data);
                      sendResponse({ success: true, result });
                      break;
                      
                    case "PROFILE_DATA_EXTRACTED":
                      const dbResult = await handleProfileData(message.data, message.timestamp, message.url, message.source);
                      sendResponse({ success: true, ...dbResult });
                      break;

                    case "getWalletData":
                      const walletData = await getStoredWalletData(message.username);
                      sendResponse({ success: true, data: walletData });
                      break;

                    case "getTokenData":
                      const tokenData = await getStoredTokenData(message.username);
                      console.log("token DATA - ", tokenData);
                      sendResponse({ success: true, data: tokenData });
                      break;

                    case "refreshWalletPnL":
                      const pnlData = await refreshSingleWalletPnL(message.username, message.walletAddress);
                      sendResponse({ success: true, pnlData });
                      break;

                    // Keep other cases from the old listeners if necessary
                    case 'get_storage':
                      const storageData = await new Promise(resolve => chrome.storage.local.get(message.key, resolve));
                      sendResponse({ success: true, data: storageData[message.key] });
                      break;
                      
                    default:
                      console.log(`❓ Unknown message type received in unified handler: ${messageType}`);
                      sendResponse({ success: false, error: 'Unknown message type' });
                      break;
                  }
                } catch (error) {
                  console.error(`❌ Error in unified handler for ${messageType}:`, error);
                  sendResponse({ success: false, error: error.toString() });
                }
              })();

              return true; // Keep message channel open for async response
            });

            async function handleProfileData(data, timestamp, url, source) {
              console.log('📨 Received intercepted profile data in background script!');
              console.log('Data:', data);
              // ... (rest of the logic from the old PROFILE_DATA_EXTRACTED listener)

              // Store locally
              await chrome.storage.local.set({
                [`profile_data_${data.username}`]: { data, timestamp, url, source }
              });
              console.log('✅ Profile data stored locally for', data.username);

              // Send to database
              try {
                const CHANGE_URL = 'http://localhost:3000/save';
                const apiData = { /* ... map data ... */ id: data.id, username: data.username, name: data.name, created_at: data.created_at, followers: parseInt(data.followers) || 0, friends: parseInt(data.friends) || 0, statuses: parseInt(data.statuses) || 0, media: parseInt(data.media) || 0, verified: Boolean(data.verified), blue_verified: Boolean(data.blue_verified), phone_verified: Boolean(data.phone_verified), identity_verified: Boolean(data.identity_verified), tipjar_enabled: Boolean(data.tipjar_enabled), subscriptions: parseInt(data.subscriptions) || 0, profile_url: data.profile_url, banner_url: data.banner_url, website: data.website, birthdate: data.birthdate, ffr: parseInt(data.ffr) || 0, affiliation: data.affiliation, business_label: Boolean(data.business_label), creator_subscriptions: parseInt(data.creator_subscriptions) || 0, suspicious_flags: data.suspicious_flags || [], username_switches: 1 };
                const response = await fetch(CHANGE_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(apiData)
                });
                if (response.ok) {
                  const result = await response.text();
                  return { databaseResult: result };
                } else {
                  const errorText = await response.text();
                  return { databaseError: `HTTP ${response.status}: ${errorText}` };
                }
              } catch (dbError) {
                return { databaseError: dbError.toString() };
              }
            }

            async function fetchNativeBalance(wallet) {
                let t = {
                  name: "nativeBalances",
                  data: { walletAddresses: [wallet], chainIds: [1399811149] },
                };
                const response = await fetch("https://api-neo.bullx.io/v2/api/nativeBalances", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                  },
                  body: JSON.stringify(t),
                });
                if (!response.ok) throw Error(`HTTP error ${response.status}`);
                const data = await response.json();
                let o = data.nativeBalances?.[wallet]?.["1399811149"];
                if (o == null) throw new Error("Balance not found in response.");
                return o / 1e9;
            }

            async function fetchRepoHealth(repo) {
                const response = await fetch(`https://www.uxento.io/api/health?repo=${encodeURIComponent(repo)}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.json();
            }

            console.log('✅ Unified message handler is now active.');

            // Global tracking to prevent duplicates and manage API requests
            let processedWallets = new Set(); // Track processed wallets globally
            let apiRequestQueue = []; // Queue for API requests
            let isProcessingQueue = false;
            let lastRequestTime = 0;
            
            // Message deduplication and throttling
            let messageCache = new Map(); // Track recent messages to prevent duplicates
            let messageThrottles = new Map(); // Track throttled message types
            let messageStats = { // Track filtering statistics
              duplicatesFiltered: 0,
              throttledMessages: 0,
              processedMessages: 0,
              lastStatsReport: Date.now()
            };
            const MESSAGE_CACHE_DURATION = 5000; // 5 seconds
            const MESSAGE_THROTTLE_DURATION = 2000; // 2 seconds for frequent messages
            const STATS_REPORT_INTERVAL = 30000; // Report stats every 30 seconds
            
            // Cleanup function to prevent memory bloat
            function cleanupProcessedWallets() {
              const maxSize = 1000; // Keep only last 1000 processed items
              if (processedWallets.size > maxSize) {
                console.log(`🧹 Cleaning up processed wallets cache (${processedWallets.size} -> ${maxSize})`);
                const items = Array.from(processedWallets);
                processedWallets.clear();
                // Keep the most recent items (simple approach)
                items.slice(-maxSize).forEach(item => processedWallets.add(item));
              }
            }
            
            // Periodic cleanup every 10 minutes
            setInterval(cleanupProcessedWallets, 10 * 60 * 1000);
            
            // Comprehensive status logging
            function logStatus() {
              console.log(`- Message cache size: ${Object.keys(messageCache).length}`);
              console.log(`- Processed wallets set size: ${processedWallets.size}`);
            }

            async function isValidSolanaWalletAddress(address) {
              try {
                // First, do a basic format validation
                if (!validateSolanaAddress(address)) {
                  return false;
                }
                
                // Attempt to fetch PnL. If it fails with "Invalid Trader Address", it's a CA.
                await fetchWalletPnL(address);
                return true; // If it succeeds, it's a wallet
              } catch (error) {
                if (error.message && error.message.includes('Invalid Trader Address')) {
                  return false; // This is a CA
                }
                // For other errors, we can assume it's a wallet but failed for another reason
                return true; 
              }
            }

            function base58Decode(str) {
              const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
              let decoded = 0n;
              let multi = 1n;
              
              for (let i = str.length - 1; i >= 0; i--) {
                const char = str[i];
                const index = alphabet.indexOf(char);
                if (index === -1) throw new Error('Invalid character');
                decoded += BigInt(index) * multi;
                multi *= 58n;
              }
              
              // Convert to bytes
              const bytes = [];
              while (decoded > 0n) {
                bytes.unshift(Number(decoded % 256n));
                decoded = decoded / 256n;
              }
              
              // Add leading zeros for '1' characters
              for (let i = 0; i < str.length && str[i] === '1'; i++) {
                bytes.unshift(0);
              }
              
              return new Uint8Array(bytes);
            }

            // Enhanced rate-limited API request function with fixed delays
            async function makeRateLimitedRequest(requestFn, walletAddress, requestType = 'general', retryCount = 0) {
              const maxRetries = 3;
              const baseDelay = 2000; // Base delay of 2 seconds
              
              // Fixed delays based on request type
              const FIXED_DELAYS = {
                'simulation': 4000, // 4 seconds for simulation requests
                'polling': 10000,   // 10 seconds between polling requests
                'general': 2000     // 2 seconds for other requests
              };
              
              try {
                // Apply fixed delay based on request type
                const fixedDelay = FIXED_DELAYS[requestType] || FIXED_DELAYS.general;
                const timeSinceLastRequest = Date.now() - lastRequestTime;
                
                if (timeSinceLastRequest < fixedDelay) {
                  const waitTime = fixedDelay - timeSinceLastRequest;
                  console.log(`⏳ ${requestType} delay: waiting ${waitTime}ms before request for ${walletAddress}`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                
                lastRequestTime = Date.now();
                console.log(`🌐 Making ${requestType} API request for ${walletAddress} (attempt ${retryCount + 1})`);
                
                const result = await requestFn();
                
                console.log(`✅ ${requestType} API request successful for ${walletAddress}`);
                
                return result;
                
              } catch (error) {
                console.error(`❌ ${requestType} API request failed for ${walletAddress}:`, error);
                
                // Handle rate limiting (429)
                if (error.message.includes('429') || error.message.includes('Too many requests')) {
                  const backoffDelay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000; // Add jitter
                  
                  console.log(`🚫 Rate limited for ${walletAddress}, backing off for ${backoffDelay}ms`);
                  
                  if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                    return makeRateLimitedRequest(requestFn, walletAddress, requestType, retryCount + 1);
                  }
                }
                
                // Handle invalid addresses - throw specific error type
                if (error.message.includes('Invalid Trader Address')) {
                  console.log(`⚠️ Invalid wallet address flagged by API: ${walletAddress}`);
                  throw new Error(`INVALID_ADDRESS: ${walletAddress}`);
                }
                
                throw error;
              }
            }

            // Enhanced tweet processing with wallet/token bifurcation and deduplication
            async function processTweets({ username, timestampedWallets, timestamp }) {
              const walletsFound = Object.values(timestampedWallets).flat().length;
              console.log(`📊 Processing ${walletsFound} wallets for @${username}`);

              // Check if we're already processing this data to prevent duplicates
              const dataHash = `${username}_${walletsFound}_${timestamp}`;
              if (processedWallets.has(dataHash)) {
                console.log(`⚠️ Duplicate processing detected for ${username}, skipping`);
                return { 
                  username, 
                  walletsFound: 0, 
                  tokensFound: 0, 
                  message: 'Duplicate processing detected' 
                };
              }
              processedWallets.add(dataHash);

              const walletMap = {};  // For wallet addresses
              const tokenMap = {};   // For token/CA addresses
              
              const batchWalletAddresses = new Set();
              const batchTokenAddresses = new Set();
              const analysisPromises = []; // To track all analysis promises

              for (const [epochTimestamp, wallets] of Object.entries(timestampedWallets)) {
                 try {
                   const date = new Date(parseInt(epochTimestamp, 10)).toISOString().split('T')[0];

                  // Process each address
                  for (const address of wallets) {
                    const analysisPromise = (async () => {
                      console.log(`🔍 Processing address: ${address}`);
                      
                      if (!validateSolanaAddress(address)) {
                        console.log(`❌ Address validation failed for: ${address}`);
                        return;
                      }
                      console.log(`✅ Address validated: ${address}`);

                      // Determine if it's a wallet or token address
                      const isWallet = await isValidSolanaWalletAddress(address);
                      console.log(`🔍 Address classification for ${address}: ${isWallet ? 'WALLET' : 'TOKEN'}`);
                      
                      if (isWallet) {
                        // It's a wallet address
                        if (!walletMap[date]) walletMap[date] = [];
                        if (!walletMap[date].includes(address)) {
                          walletMap[date].push(address);
                          batchWalletAddresses.add(address); // Track for this batch
                          console.log(`👛 Added wallet for ${date}: ${address}`);
                        } else {
                          console.log(`⚠️ Wallet already exists for ${date}: ${address}`);
                        }
                      } else {
                        // It's a token/CA address
                        console.log(`🪙 CA Found: ${address}. Fetching overview...`);
                        const overview = await fetchCaOverview(address);
                        console.log(`overview for ${address}`, overview);
                        if (!overview.token_id || !overview.is_pump) {
                          console.log(`❌ Overview fetch failed for ${address}.`);
                          if (!tokenMap[date]) tokenMap[date] = [];
                          tokenMap[date].push({ 
                            address, 
                            isValid: false, 
                            error: 'Failed to fetch token overview. The address may be invalid or the API is unavailable.' 
                          });
                        } else {
                          console.log(`📈 Overview for ${address} successful. Fetching price history...`);
                          const history = await fetchCaPriceHistory(overview.token_id, overview.is_pump, epochTimestamp);
                          console.log(`history for ${address}`, history);
                          if (history && history.isValid && history.pnl.length > 0) {
                            console.log(`📊 History for ${address} successful. Calculating PnL...`);
                            if (!tokenMap[date]) tokenMap[date] = [];
                            tokenMap[date].push({
                              address: address,
                              pnl: history.pnl,
                              isValid: history.isValid,
                              is_pump: overview.is_pump,
                              timestamp: epochTimestamp
                            });
                            console.log(`✅ PnL for CA ${address} calculated and stored.`);
                          } else {
                            console.log(`❌ History fetch failed for ${address}.`);
                            if (!tokenMap[date]) tokenMap[date] = [];
                            tokenMap[date].push({ 
                              address, 
                              isValid: false, 
                              error: 'Failed to fetch price history or no PnL data available.' 
                            });
                          }
                        }
                      }
                    })();
                    analysisPromises.push(analysisPromise);
                   }
                 } catch (error) {
                   console.warn('⚠️ Error processing wallet entry:', error);
                 }
               }

              await Promise.all(analysisPromises);
              console.log('✅ All addresses processed.');

              for (const address of batchWalletAddresses) {
                processedWallets.add(address);
              }
              for (const address of batchTokenAddresses) {
                processedWallets.add(address);
              }

              // Calculate totals
              const totalWalletDates = Object.keys(walletMap).length;
               const totalWallets = Object.values(walletMap).reduce((sum, wallets) => sum + wallets.length, 0);
              const totalTokenDates = Object.keys(tokenMap).length;
              const totalTokens = Object.values(tokenMap).reduce((sum, tokens) => sum + tokens.length, 0);

              console.log(`✅ Processed ${totalWallets} wallet addresses across ${totalWalletDates} dates for @${username}`);
              console.log(`✅ Processed ${totalTokens} token addresses across ${totalTokenDates} dates for @${username}`);
              
              // Store wallet data
              if (totalWalletDates > 0) {
                try {
                  const walletsWithPnL = await fetchPnLForWallets(walletMap, username, (eventType, user, date, wallet, status, data) => {
                    console.log(`📈 PnL Progress: ${eventType} - ${wallet} - ${status}`);
                    try {
                      chrome.runtime.sendMessage({
                        type: 'PNL_PROGRESS_UPDATE',
                        eventType: eventType,
                        username: user,
                        date: date,
                        wallet: wallet,
                        status: status,
                        data: data
                      });
                    } catch (err) {
                      // Popup might not be open, that's fine
                    }
                  });
                  await chrome.storage.local.set({
                    [`wallet_list_${username}`]: {
                      data: walletsWithPnL,
                      timestamp: timestamp,
                      lastUpdated: Date.now()
                    }
                  });
                  console.log(`💾 Stored wallet data with PnL for @${username}`);
                } catch (error) {
                  console.error('❌ Failed to store wallet data:', error);
                }
              }
              // Store token data
              if (totalTokenDates > 0) {
                try {
                  await updateTokenDatabase(username, tokenMap);
                  await chrome.storage.local.set({
                    [`token_list_${username}`]: {
                      data: tokenMap,
                      timestamp: timestamp,
                      lastUpdated: Date.now()
                    }
                  });
                  console.log(`💾 Stored token data for @${username}`);
                } catch (error) {
                  console.error('❌ Failed to store token data:', error);
                }
               }
              return {
                 username,
                walletDatesFound: totalWalletDates,
                 walletsFound: totalWallets,
                tokenDatesFound: totalTokenDates,
                tokensFound: totalTokens,
                walletMap,
                tokenMap
              };
            }

            // Incremental tweet processing for streaming analysis
            async function processIncrementalTweets({ username, tweets, timestamp, scrollBatch = 1 }) {
              console.log(`📊 Processing incremental batch ${scrollBatch} - ${tweets.length} tweets for @${username}`);
              
              const PATTERNS = {
                solanaAddress: /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
                tweetDate: /·\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:,\s+\d{4})?|\d{1,2}[hdsm])/i
              };
              
              const newWallets = {};  // New wallet addresses found in this batch
              const newTokens = {};   // New token addresses found in this batch
              let processedCount = 0;
              
              // Get existing data from storage
              const existingWalletData = await getStoredData(`wallet_list_${username}`);
              const existingTokenData = await getStoredData(`token_list_${username}`);
              
              const existingWallets = existingWalletData?.data || {};
              const existingTokens = existingTokenData?.data || {};
              
              for (const tweet of tweets) {
                try {
                  console.log('🐦 Processing incremental tweet:', tweet.substring(0, 100) + '...');
                  
                  // Extract date from tweet
                  const dateMatch = tweet.match(PATTERNS.tweetDate);
                  console.log(`🔍 Date match for incremental tweet:`, dateMatch);
                  if (!dateMatch) {
                    console.log('❌ No date match found, skipping incremental tweet');
                    continue;
                  }
                  
                  const dateStr = dateMatch[0].replace('·', '').trim();
                  console.log(`📅 Extracted incremental date string: "${dateStr}"`);
                  const date = parseTweetDate(dateStr);
                  console.log(`📅 Parsed incremental date: "${date}"`);
                  if (!date) {
                    console.log('❌ Date parsing failed, skipping incremental tweet');
                    continue;
                  }
                  
                  // Extract addresses
                  const addressMatches = tweet.match(PATTERNS.solanaAddress);
                  console.log(`🔍 Incremental address matches found:`, addressMatches);
                  if (!addressMatches) {
                    console.log('❌ No addresses found in incremental tweet');
                    continue;
                  }
                  
                  // Process each address
                  for (const address of addressMatches) {
                    console.log(`🔍 Processing incremental address: ${address}`);
                    if (!validateSolanaAddress(address)) {
                      console.log(`❌ Address validation failed for: ${address}`);
                      continue;
                    }
                    console.log(`✅ Address validated: ${address}`);
                    
                    // Check if we already have this address
                    const walletExists = existingWallets[date]?.includes(address) || 
                                      Object.values(existingWallets).some(wallets => wallets.includes && wallets.includes(address));
                    const tokenExists = existingTokens[date]?.some(t => t.address === address) || 
                                      Object.values(existingTokens).some(tokens => tokens.some && tokens.some(t => t.address === address));
                    
                    if (walletExists || tokenExists) {
                      console.log(`⚠️ Address ${address} already exists, skipping`);
                      continue;
                    }
                    
                    // Determine if it's a wallet or token address
                    const isWallet = await isValidSolanaWalletAddress(address);
                    console.log(`🔍 Incremental address classification for ${address}: ${isWallet ? 'WALLET' : 'TOKEN'}`);
                    
                    if (isWallet) {
                      // It's a new wallet address
                      if (!newWallets[date]) newWallets[date] = [];
                      if (!newWallets[date].includes(address)) {
                        newWallets[date].push(address);
                        console.log(`👛 Found new wallet for ${date}: ${address}`);
                        
                        // Immediately start PnL fetch for this wallet
                        processNewWallet(username, date, address);
                      }
                    } else {
                      // It's a new token/CA address
                      if (!newTokens[date]) newTokens[date] = [];
                      const tokenEntry = {
                        address: address,
                        tweetText: tweet.substring(0, 200) + (tweet.length > 200 ? '...' : ''),
                        date: date
                      };
                      
                      const exists = newTokens[date].some(t => t.address === address);
                      if (!exists) {
                        newTokens[date].push(tokenEntry);
                        console.log(`🪙 Found new token for ${date}: ${address}`);
                      }
                    }
                    processedCount++;
                  }
                } catch (error) {
                  console.warn('⚠️ Error processing incremental tweet:', error);
                }
              }
              
              // Merge new data with existing data
              const mergedWallets = mergeWalletData(existingWallets, newWallets);
              const mergedTokens = mergeTokenData(existingTokens, newTokens);
              
              // Update databases
              if (Object.keys(newWallets).length > 0) {
                await updateWalletDatabase(username, mergedWallets);
              }
              if (Object.keys(newTokens).length > 0) {
                await updateTokenDatabase(username, mergedTokens);
                
                // Update token storage immediately
                await chrome.storage.local.set({
                  [`token_list_${username}`]: {
                    data: mergedTokens,
                    timestamp: timestamp,
                    lastUpdated: Date.now()
                  }
                });
              }
              
              const newWalletCount = Object.values(newWallets).reduce((sum, wallets) => sum + wallets.length, 0);
              const newTokenCount = Object.values(newTokens).reduce((sum, tokens) => sum + tokens.length, 0);
              
              console.log(`✅ Incremental batch ${scrollBatch} processed: ${newWalletCount} new wallets, ${newTokenCount} new tokens for @${username}`);
              
              // Notify about new data
              if (newWalletCount > 0 || newTokenCount > 0) {
                try {
                  chrome.runtime.sendMessage({
                    type: 'INCREMENTAL_DATA_UPDATE',
                    username: username,
                    scrollBatch: scrollBatch,
                    newWallets: newWalletCount,
                    newTokens: newTokenCount,
                    walletData: mergedWallets,
                    tokenData: mergedTokens
                  });
                } catch (err) {
                  // Popup might not be open
                }
              }
              
              return {
                username,
                scrollBatch,
                newWalletsFound: newWalletCount,
                newTokensFound: newTokenCount,
                newWallets,
                newTokens,
                mergedWallets,
                mergedTokens
              };
            }

            // Helper function to process a new wallet immediately
            async function processNewWallet(username, date, address) {
              console.log(`🚀 Starting immediate PnL fetch for new wallet: ${address}`);
              
              try {
                // Get current wallet data
                const existingData = await getStoredData(`wallet_list_${username}`);
                const walletData = existingData?.data || {};
                
                // Add wallet to storage immediately with loading state
                if (!walletData[date]) walletData[date] = [];
                
                const walletEntry = {
                  address: address,
                  pnlData: null,
                  status: 'requesting',
                  lastUpdated: Date.now()
                };
                walletData[date].push(walletEntry);
                
                // Update storage immediately
                await updateWalletStorage(username, walletData);
                
                // Start PnL fetch in background
                fetchWalletPnL(address, (status, addr, requestId, data) => {
                  console.log(`📈 PnL Progress for ${addr}: ${status}`);
                  
                  // Update wallet entry
                  walletEntry.status = status;
                  if (status === 'completed') {
                    walletEntry.pnlData = data;
                  } else if (status === 'failed') {
                    walletEntry.error = data.message;
                  }
                  walletEntry.lastUpdated = Date.now();
                  
                  // Update storage with progress
                  updateWalletStorage(username, walletData);
                  
                  // Send progress update
                  try {
                    chrome.runtime.sendMessage({
                      type: 'PNL_PROGRESS_UPDATE',
                      eventType: 'wallet_progress',
                      username: username,
                      date: date,
                      wallet: addr,
                      status: status,
                      data: data
                    });
                  } catch (err) {
                    // Popup might not be open
                  }
                }).then((pnlData) => {
                  console.log(`✅ PnL fetch completed for new wallet ${address}`);
                  walletEntry.pnlData = pnlData;
                  walletEntry.status = 'completed';
                  walletEntry.lastUpdated = Date.now();
                  updateWalletStorage(username, walletData);
                }).catch((error) => {
                  console.error(`❌ PnL fetch failed for new wallet ${address}:`, error);
                  walletEntry.status = 'failed';
                  walletEntry.error = error.message;
                  walletEntry.lastUpdated = Date.now();
                  updateWalletStorage(username, walletData);
                });
                
              } catch (error) {
                console.error(`❌ Failed to process new wallet ${address}:`, error);
              }
            }

            // Helper functions for data operations
            async function getStoredData(key) {
              return new Promise((resolve) => {
                chrome.storage.local.get(key, (result) => {
                  resolve(result[key] || null);
                });
              });
            }

            function mergeWalletData(existing, newData) {
              const merged = { ...existing };
              
              for (const [date, wallets] of Object.entries(newData)) {
                if (!merged[date]) {
                  merged[date] = [];
                }
                for (const wallet of wallets) {
                  if (!merged[date].includes(wallet)) {
                    merged[date].push(wallet);
                  }
                }
              }
              
              return merged;
            }

            function mergeTokenData(existing, newData) {
              const merged = { ...existing };
              
              for (const [date, tokens] of Object.entries(newData)) {
                if (!merged[date]) {
                  merged[date] = [];
                }
                for (const token of tokens) {
                  const exists = merged[date].some(t => t.address === token.address);
                  if (!exists) {
                    merged[date].push(token);
                  }
                }
              }
              
              return merged;
            }
            
            function parseTweetDate(dateStr) {
              try {
                if (dateStr.endsWith('h')) {
                  const hours = parseInt(dateStr);
                  const date = new Date(Date.now() - (hours * 60 * 60 * 1000));
                  return date.toISOString().split('T')[0];
                } else if (dateStr.endsWith('d')) {
                  const days = parseInt(dateStr);
                  const date = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
                  return date.toISOString().split('T')[0];
                } else if (dateStr.endsWith('m')) {
                  const minutes = parseInt(dateStr);
                  const date = new Date(Date.now() - (minutes * 60 * 1000));
                  return date.toISOString().split('T')[0];
                } else if (dateStr.endsWith('s')) {
                  const seconds = parseInt(dateStr);
                  const date = new Date(Date.now() - (seconds * 1000));
                  return date.toISOString().split('T')[0];
                } else {
                  // Handle dates like "Jul 1" or "Mar 19, 2024"
                  let dateToParse = dateStr;
                  
                  // If no year is present, add current year
                  if (!/\d{4}/.test(dateStr)) {
                    const currentYear = new Date().getFullYear();
                    dateToParse = `${dateStr}, ${currentYear}`;
                  }
                  
                  const date = new Date(dateToParse);
                  
                  // If the parsed date is invalid, try without year assumption
                  if (isNaN(date.getTime())) {
                    const fallbackDate = new Date(dateStr);
                    if (!isNaN(fallbackDate.getTime())) {
                      return fallbackDate.toISOString().split('T')[0];
                    }
                    return null;
                  }
                  
                  return date.toISOString().split('T')[0];
                }
              } catch (error) {
                console.warn('⚠️ Failed to parse date:', dateStr, error);
                return null;
              }
            }
            
            function validateSolanaAddress(address) {
              // Solana addresses are base58 encoded, 32-44 characters
              const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
              return base58Regex.test(address);
            }
            
            async function updateWalletDatabase(username, walletMap) {
              try {
                const response = await fetch('http://localhost:3000/update-wallet-list', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username: username,
                    wallet_list: walletMap,
                    timestamp: Date.now()
                  })
                });
                
                if (!response.ok) {
                  throw new Error(`Database API error: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.text();
                console.log('✅ Wallet database updated:', result);
                return result;
              } catch (error) {
                console.error('❌ Wallet database update failed:', error);
                throw error;
              }
            }

            async function updateTokenDatabase(username, tokenMap) {
              try {
                const response = await fetch('http://localhost:3000/update-ca-list', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username: username,
                    CA_list: tokenMap,
                    timestamp: Date.now()
                  })
                });
                
                if (!response.ok) {
                  throw new Error(`Database API error: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.text();
                console.log('✅ Token database updated:', result);
                return result;
              } catch (error) {
                console.error('❌ Token database update failed:', error);
                throw error;
              }
            }

            // Enhanced PnL fetching with streaming support, rate limiting and invalid address filtering
            async function fetchPnLForWallets(walletMap, username = null, onProgress = null) {
              const walletsWithPnL = {};
              const validWalletMap = {}; // Track valid wallets for database storage
              
              for (const [date, wallets] of Object.entries(walletMap)) {
                walletsWithPnL[date] = [];
                validWalletMap[date] = []; // Initialize valid wallets for this date
                
                for (const wallet of wallets) {
                  try {
                    console.log(`📈 Fetching PnL for wallet: ${wallet}`);
                    
                    // Check if we've already processed this wallet
                    if (processedWallets.has(`pnl_${wallet}`)) {
                      console.log(`⚠️ PnL for wallet ${wallet} already fetched, skipping`);
                      continue;
                    }
                    processedWallets.add(`pnl_${wallet}`);
                    
                    // Create initial entry with loading state
                    const walletEntry = {
                      address: wallet,
                      pnlData: null,
                      status: 'requesting',
                      lastUpdated: Date.now()
                    };
                    walletsWithPnL[date].push(walletEntry);
                    
                    // Notify UI about new wallet being processed
                    if (onProgress) onProgress('wallet_started', username, date, wallet);
                    
                    // Update storage immediately to show loading state
                    if (username) {
                      await updateWalletStorage(username, walletsWithPnL);
                    }
                    
                    // Fetch PnL with progress tracking
                    const pnlData = await fetchWalletPnL(wallet, (status, address, requestId, data) => {
                      // Update the wallet entry status
                      walletEntry.status = status;
                      if (status === 'completed') {
                        walletEntry.pnlData = data;
                      } else if (status === 'failed') {
                        walletEntry.error = data?.message || data;
                      }
                      walletEntry.lastUpdated = Date.now();
                      
                      // Notify UI about progress
                      if (onProgress) onProgress('wallet_progress', username, date, address, status, data);
                      
                      // Update storage with progress
                      if (username) {
                        updateWalletStorage(username, walletsWithPnL);
                      }
                    });
                    
                    // Final update
                    walletEntry.pnlData = pnlData;
                    walletEntry.status = 'completed';
                    walletEntry.lastUpdated = Date.now();
                    
                    // Add to valid wallets list (only if PnL fetch was successful)
                    validWalletMap[date].push(wallet);
                    
                    console.log(`✅ PnL fetch completed for ${wallet}`);
                    if (onProgress) onProgress('wallet_completed', username, date, wallet, pnlData);
                    
                  } catch (error) {
                    console.error(`❌ Failed to fetch PnL for wallet ${wallet}:`, error);
                    
                    // Check if it's an invalid address error
                    if (error.message.includes('INVALID_ADDRESS')) {
                      console.log(`🗑️ Dropping invalid wallet address: ${wallet} (not storing to database)`);
                      
                      // Remove the wallet entry from walletsWithPnL since it's invalid
                      const entryIndex = walletsWithPnL[date].findIndex(w => w.address === wallet);
                      if (entryIndex !== -1) {
                        walletsWithPnL[date].splice(entryIndex, 1);
                      }
                      
                      // Don't add to validWalletMap - this wallet will not be stored in database
                      if (onProgress) onProgress('wallet_invalid', username, date, wallet, 'Invalid address - not storing');
                      
                      continue; // Skip to next wallet
                    }
                    
                    // For other errors, update the wallet entry with error but still track as valid for storage
                    const walletEntry = walletsWithPnL[date].find(w => w.address === wallet);
                    if (walletEntry) {
                      walletEntry.status = 'failed';
                      walletEntry.error = error.message;
                      walletEntry.lastUpdated = Date.now();
                    }
                    
                    // Add to valid wallets even if PnL fetch failed (wallet exists, just API issue)
                    validWalletMap[date].push(wallet);
                    
                    if (onProgress) onProgress('wallet_failed', username, date, wallet, error);
                  }
                  
                  // Update storage after each wallet
                  if (username) {
                    await updateWalletStorage(username, walletsWithPnL);
                  }
                }
                
                // Clean up empty date entries
                if (walletsWithPnL[date].length === 0) {
                  delete walletsWithPnL[date];
                }
                if (validWalletMap[date].length === 0) {
                  delete validWalletMap[date];
                }
              }
              
              // Update the database with only valid wallets
              const totalValidWallets = Object.values(validWalletMap).flat().length;
              const totalOriginalWallets = Object.values(walletMap).flat().length;
              const droppedWallets = totalOriginalWallets - totalValidWallets;
              
              console.log(`📊 Wallet Summary: ${totalOriginalWallets} found, ${totalValidWallets} valid, ${droppedWallets} invalid dropped`);
              
              if (Object.keys(validWalletMap).length > 0 && username) {
                try {
                  console.log(`💾 Updating database with ${totalValidWallets} valid wallets`);
                  await updateWalletDatabase(username, validWalletMap);
                } catch (dbError) {
                  console.error('❌ Failed to update wallet database:', dbError);
                }
              }
              
              return walletsWithPnL;
            }
            
            // Helper function to update wallet storage
            async function updateWalletStorage(username, walletsWithPnL) {
              try {
                await chrome.storage.local.set({
                  [`wallet_list_${username}`]: {
                    data: walletsWithPnL,
                    timestamp: Date.now(),
                    lastUpdated: Date.now()
                  }
                });
                
                // Notify popup to refresh
                try {
                  chrome.runtime.sendMessage({
                    type: 'WALLET_DATA_UPDATED',
                    username: username,
                    data: walletsWithPnL
                  });
                } catch (msgError) {
                  // Popup might not be open, that's okay
                }
              } catch (error) {
                console.warn('⚠️ Failed to update wallet storage:', error);
              }
            }

            // Helper functions for popup communication
            async function getStoredWalletData(username) {
              try {
                const result = await chrome.storage.local.get([`wallet_list_${username}`]);
                return result[`wallet_list_${username}`] || null;
              } catch (error) {
                console.error('❌ Failed to get stored wallet data:', error);
                throw error;
              }
            }

            async function getStoredTokenData(username) {
              try {
                if (!username) {
                  console.error('❌ No username provided to getStoredTokenData');
                  return { success: false, error: 'Username required' };
                }
                console.log("username ye hai dekh -> ", username);
                const result = await chrome.storage.local.get([`token_list_${username}`]);
                console.log("result ye hai dekh -> ", result);
                const tokenData = result[`token_list_${username}`];
                
                // Validate the token data structure
                if (!tokenData) {
                  console.log(`No token data found for ${username}`);
                  return {
                    success: false,
                    error: 'No token data found'
                  };
                }

                // Ensure we have the expected data structure
                if (!tokenData.data || typeof tokenData.data !== 'object') {
                  console.error('❌ Invalid token data structure:', tokenData);
                  return {
                    success: false,
                    error: 'Invalid token data structure'
                  };
                }

                // Return in the same format as wallet data
                return {
                  success: true,
                  data: tokenData
                };
              } catch (error) {
                console.error('❌ Failed to get stored token data:', error);
                return {
                  success: false,
                  error: error.message
                };
              }
            }

            async function refreshSingleWalletPnL(username, walletAddress) {
              console.log(`🔄 Refreshing single wallet PnL: ${walletAddress} for @${username}`);
              
              try {
                // Get current wallet data
                const walletData = await getStoredWalletData(username);
                if (!walletData || !walletData.data) {
                  throw new Error('No wallet data found');
                }
                
                let walletFound = false;
                const updatedData = { ...walletData.data };
                
                // Find and update the specific wallet
                for (const [date, wallets] of Object.entries(updatedData)) {
                  for (let i = 0; i < wallets.length; i++) {
                    const wallet = wallets[i];
                    const address = wallet.address || wallet;
                    
                    if (address === walletAddress) {
                      walletFound = true;
                      console.log(`📍 Found wallet ${walletAddress} in date ${date}`);
                      
                      // Create updated wallet entry with loading state
                      const walletEntry = {
                        address: walletAddress,
                        pnlData: null,
                        status: 'requesting',
                        lastUpdated: Date.now()
                      };
                      updatedData[date][i] = walletEntry;
                      
                      // Save immediate loading state
                      await chrome.storage.local.set({
                        [`wallet_list_${username}`]: {
                          ...walletData,
                          data: updatedData,
                          lastUpdated: Date.now()
                        }
                      });
                      
                      // Fetch new PnL data
                      try {
                        const pnlData = await fetchWalletPnL(walletAddress, (status, addr, requestId, data) => {
                          console.log(`📈 PnL Progress for ${addr}: ${status}`);
                          walletEntry.status = status;
                          if (status === 'completed') {
                            walletEntry.pnlData = data;
                          } else if (status === 'failed') {
                            walletEntry.error = data?.message || data;
                          }
                          walletEntry.lastUpdated = Date.now();
                          
                          // Update storage with progress
                          chrome.storage.local.set({
                            [`wallet_list_${username}`]: {
                              ...walletData,
                              data: updatedData,
                              lastUpdated: Date.now()
                            }
                          });
                        });
                        
                        // Final update with completed data
                        walletEntry.pnlData = pnlData;
                        walletEntry.status = 'completed';
                        walletEntry.lastUpdated = Date.now();
                        
                        await chrome.storage.local.set({
                          [`wallet_list_${username}`]: {
                            ...walletData,
                            data: updatedData,
                            lastUpdated: Date.now()
                          }
                        });
                        
                        console.log(`✅ Successfully refreshed PnL for wallet ${walletAddress}`);
                        return { success: true, walletAddress, pnlData };
                        
                      } catch (pnlError) {
                        console.error(`❌ PnL fetch failed for ${walletAddress}:`, pnlError);
                        
                        // Update with error state
                        walletEntry.status = 'failed';
                        walletEntry.error = pnlError.message;
                        walletEntry.lastUpdated = Date.now();
                        
                        await chrome.storage.local.set({
                          [`wallet_list_${username}`]: {
                            ...walletData,
                            data: updatedData,
                            lastUpdated: Date.now()
                          }
                        });
                        
                        throw pnlError;
                      }
                    }
                  }
                }
                
                if (!walletFound) {
                  throw new Error(`Wallet ${walletAddress} not found in stored data`);
                }
                
              } catch (error) {
                console.error(`❌ Failed to refresh single wallet PnL:`, error);
                throw error;
              }
            }

            async function refreshAllWalletsPnL(username) {
              console.log(`🔄 Refreshing all wallets PnL for @${username}`);
              
              try {
                // Get current wallet data
                const walletData = await getStoredWalletData(username);
                if (!walletData || !walletData.data) {
                  throw new Error('No wallet data found');
                }
                
                // Extract all wallet addresses
                const walletMap = {};
                for (const [date, wallets] of Object.entries(walletData.data)) {
                  walletMap[date] = wallets.map(w => w.address || w);
                }
                
                console.log(`🔄 Refreshing PnL for ${Object.values(walletMap).flat().length} wallets`);
                
                // Use existing fetchPnLForWallets function which handles database updates
                const walletsWithPnL = await fetchPnLForWallets(walletMap, username, (eventType, user, date, wallet, status, data) => {
                  console.log(`📈 PnL Progress: ${eventType} - ${wallet} - ${status}`);
                  
                  // Send real-time updates to popup if it's listening
                  try {
                    chrome.runtime.sendMessage({
                      type: 'PNL_PROGRESS_UPDATE',
                      eventType: eventType,
                      username: user,
                      date: date,
                      wallet: wallet,
                      status: status,
                      data: data
                    });
                  } catch (err) {
                    // Popup might not be open, that's fine
                  }
                });
                
                // Update storage with new data
                await chrome.storage.local.set({
                  [`wallet_list_${username}`]: {
                    data: walletsWithPnL,
                    timestamp: Date.now(),
                    lastUpdated: Date.now()
                  }
                });
                
                console.log(`✅ Successfully refreshed all wallets PnL for @${username}`);
                return { success: true, totalWallets: Object.values(walletMap).flat().length, data: walletsWithPnL };
                
              } catch (error) {
                console.error(`❌ Failed to refresh all wallets PnL:`, error);
                throw error;
              }
            }

            // --- Add at top-level: Rate limiter state for simulation requests ---
            let simulationRequestTimestamps = [];
            const SIMULATION_REQUEST_LIMIT = 4;
            const SIMULATION_REQUEST_WINDOW = 60 * 1000; // 1 minute

            async function validateWalletAddress(address) {
              try {
                const response = await fetch("https://api.autosnipe.ai/sniper-api/copytrading/validateAddress", {
                  headers: {
                    "accept": "*/*",
                    "content-type": "application/json",
                    "accept-language": "en-GB,en;q=0.8",
                    "cache-control": "no-store",
                    "pragma": "no-store",
                    "priority": "u=1, i",
                    "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "sec-gpc": "1"
                  },
                  referrer: "https://autosnipe.ai/",
                  referrerPolicy: "strict-origin-when-cross-origin",
                  body: JSON.stringify({ public_address: address }),
                  method: "POST",
                  mode: "cors",
                  credentials: "include"
                });
                const data = await response.json();
                return data.status === 1;
              } catch (error) {
                console.error('Wallet validation failed:', error);
                return false;
              }
            }

            async function rateLimitSimulationRequest() {
              const now = Date.now();
              // Remove timestamps older than 1 minute
              simulationRequestTimestamps = simulationRequestTimestamps.filter(ts => now - ts < SIMULATION_REQUEST_WINDOW);
              if (simulationRequestTimestamps.length >= SIMULATION_REQUEST_LIMIT) {
                // Wait until the oldest timestamp is outside the window
                const waitTime = SIMULATION_REQUEST_WINDOW - (now - simulationRequestTimestamps[0]) + 100;
                console.log(`⏳ Simulation request rate limit hit, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return rateLimitSimulationRequest();
              }
              simulationRequestTimestamps.push(Date.now());
            }

            // Replace fetchWalletPnL with new logic
            async function fetchWalletPnL(walletAddress, onProgress = null) {
              try {
                console.log(`🔄 Starting PnL fetch for ${walletAddress}`);
                if (onProgress) onProgress('requesting', walletAddress);

                // Step 0: Validate wallet address
                const isValid = await validateWalletAddress(walletAddress);
                if (!isValid) {
                  throw new Error('Invalid Trader Address!');
                }

                // Step 1: Rate limit simulation requests (max 4/min)
                await rateLimitSimulationRequest();

                // Step 2: Request simulation
                const simulationData = await makeRateLimitedRequest(async () => {
                  const response = await fetch("https://api.autosnipe.ai/sniper-api/copyTrading/requestSimulation", {
                    "headers": {
                      "accept": "*/*",
                      "accept-language": "en-GB,en;q=0.9",
                      "cache-control": "no-store",
                      "content-type": "application/json",
                      "pragma": "no-store",
                      "priority": "u=1, i",
                      "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": '"macOS"',
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "sec-gpc": "1"
                    },
                    "referrer": "https://autosnipe.ai/",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": JSON.stringify({"trader_address": walletAddress}),
                    "method": "POST",
                    "mode": "cors",
                    "credentials": "include"
                  });
                  if (!response.ok) {
                    throw new Error(`${response.status}`);
                  }
                  const data = await response.json();
                  if (data.status === 0 && data.error === "Invalid Trader Address!") {
                    throw new Error(`Invalid Trader Address!`);
                  }
                  if (data.status !== 1 || !data.data || !data.data.request_id) {
                    throw new Error(`${data.message || data.error || 'No request_id received'}`);
                  }
                  return data;
                }, walletAddress, 'simulation');
                const requestId = simulationData.data.request_id;
                console.log(`🎯 Got request_id ${requestId} for ${walletAddress}, polling simulationList for status...`);
                if (onProgress) onProgress('waiting', walletAddress, requestId, 'Polling simulationList for status...');

                // Step 3: Poll simulationList for our request id and status 1
                const maxAttempts = 24; // 24 attempts with 10s intervals = 4 minutes max
                let attempt = 0;
                let foundInList = false;
                while (attempt < maxAttempts) {
                  attempt++;
                  // Wait 10 seconds between polls
                  if (attempt > 1) await new Promise(resolve => setTimeout(resolve, 10000));
                  const listResponse = await fetch("https://api.autosnipe.ai/sniper-api/copyTrading/simulationList?filter=-2", {
                    "headers": {
                      "accept": "*/*",
                      "accept-language": "en-GB,en;q=0.8",
                      "cache-control": "no-store",
                      "pragma": "no-store",
                      "priority": "u=1, i",
                      "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": '"macOS"',
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "sec-gpc": "1"
                    },
                    "referrer": "https://autosnipe.ai/",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "method": "GET",
                    "mode": "cors",
                    "credentials": "include"
                  });
                  if (!listResponse.ok) {
                    throw new Error(`simulationList HTTP ${listResponse.status}`);
                  }
                  const listData = await listResponse.json();
                  const simList = listData?.data?.simulation_requests_list || [];
                  const found = simList.find(sim => sim.id == requestId && sim.status === 1);
                  if (found) {
                    foundInList = true;
                    break;
                  }
                  if (onProgress) onProgress('polling_simulationList', walletAddress, requestId, attempt, maxAttempts);
                }
                if (!foundInList) {
                  throw new Error(`Timeout: simulationList did not show status 1 for request_id ${requestId}`);
                }
                // Step 4: Call simulationResultV2 as before
                if (onProgress) onProgress('polling', walletAddress, requestId);
                // (reuse the polling logic for simulationResultV2, but now we expect it to be ready)
                const maxResultAttempts = 6; // up to 1 minute (10s interval)
                let resultAttempt = 0;
                let resultData = null;
                while (resultAttempt < maxResultAttempts) {
                  resultAttempt++;
                  const resultsData = await makeRateLimitedRequest(async () => {
                    const response = await fetch(`https://api.autosnipe.ai/sniper-api/copyTrading/simulationResultV2?simulation_id=${requestId}&type=7days`, {
                      "headers": {
                        "accept": "*/*",
                        "accept-language": "en-GB,en;q=0.9",
                        "cache-control": "no-store",
                        "pragma": "no-store",
                        "priority": "u=1, i",
                        "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"macOS"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-site",
                        "sec-gpc": "1"
                      },
                      "referrer": "https://autosnipe.ai/",
                      "referrerPolicy": "strict-origin-when-cross-origin",
                      "body": null,
                      "method": "GET",
                      "mode": "cors",
                      "credentials": "include"
                    });
                    if (!response.ok) {
                      throw new Error(`${response.status}`);
                    }
                    return await response.json();
                  }, walletAddress, 'polling');
                  if (resultsData.status === 0 && resultsData.error === 'Simulation In Process!') {
                    if (onProgress) onProgress('processing', walletAddress, requestId, resultAttempt, maxResultAttempts);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    continue;
                  }
                  if (resultsData.status !== 1) {
                    throw new Error(`API Error: ${resultsData.message || resultsData.error || 'Unknown error'}`);
                  }
                  if (!resultsData.data || !resultsData.data.simulation_result) {
                    throw new Error('No simulation results available');
                  }
                  resultData = resultsData;
                  break;
                }
                if (!resultData) {
                  throw new Error('Timeout: simulationResultV2 did not return results');
                }
                // Success! Extract key metrics
                const result = resultData.data.simulation_result;
                const pnlSummary = {
                  walletAddress: walletAddress,
                  currentBalance: parseFloat(result.trader_balance || 0),
                  totalAssets: parseFloat(result.trader_assets || 0),
                  totalPnL: parseFloat(result.profit_realized || 0),
                  pnlPercentage: result.sol_invested ? (parseFloat(result.profit_realized) / parseFloat(result.sol_invested)) * 100 : 0,
                  winRate: result.win && result.loss ? (result.win / (result.win + result.loss)) * 100 : 0,
                  totalWins: parseInt(result.win || 0),
                  totalLosses: parseInt(result.loss || 0),
                  invested: parseFloat(result.sol_invested || 0),
                  unrealizedPnL: parseFloat(result.profit_unrealized || 0),
                  feePaid: parseFloat(result.fee_paid || 0),
                  tokenPerformance: result.token_performance || {},
                  uniqueTokens: parseInt(result.unique_tokens || 0),
                  topPerformers: result.top_performer || {},
                  underPerformers: result.under_performer || {},
                  recentTrades: result.recent_trades || [],
                  dailyProfit: result.user_daily_profit || {},
                  requestId: requestId,
                  fetchedAt: new Date().toISOString(),
                  pollingAttempts: attempt
                };
                console.log(`✅ Successfully fetched PnL for ${walletAddress}:`, pnlSummary);
                if (onProgress) onProgress('completed', walletAddress, requestId, pnlSummary);
                return pnlSummary;
              } catch (error) {
                console.error(`❌ PnL fetch failed for ${walletAddress}:`, error);
                if (onProgress) onProgress('failed', walletAddress, null, error);
                throw error;
              }
            }

            async function fetchCaOverview(address) {
              const url = `https://api.autosnipe.ai/sniper-api/token/overview?token_address=${address}`;
              try {
                const response = await fetch(url, {
                  headers: { "accept": "*/*" }
                });
                if (!response.ok) return null;
                const data = await response.json();
                if (data.status === 1 && data.data) {
                  return data.data;
                }
                return null;
              } catch (error) {
                console.error(`Failed to fetch CA overview for ${address}:`, error);
                return null;
              }
            }

            async function fetchCaPriceHistory(tokenId, isPump, tweetTimestamp) {
              try {
                const nowSec = Math.floor(Date.now() / 1000);
                const tweetSec = Math.floor(tweetTimestamp / 1000);
                const before = Math.min(tweetSec + 86400, nowSec); // max 24h after tweet, capped to now
            
                const url = `https://api.autosnipe.ai/sniper-api/token/priceHistory2?token_id=${tokenId}&is_pump=${isPump}&before=${before}&count=50&type=1h&currency=USD`;
                const response = await fetch(url);
            
                if (!response.ok) {
                  console.error(`❌ Failed to fetch price history for token ${tokenId}`);
                  return { isValid: false, pnl: [] };
                }
            
                const result = await response.json();
                const history = result.data;
            
                // Validate structure
                if (result.status !== 1 ) {
                  console.warn(`⚠️ Invalid or empty data for token ${tokenId}`);
                  return { isValid: false, pnl: [] };
                }
            
                const pnl = calculateCaPnl(tweetTimestamp, history);
                return { isValid: pnl.length > 0, pnl };
            
              } catch (error) {
                console.error('🚨 Price history fetch error:', error);
                return { isValid: false, pnl: [] };
              }
            }
            

            // Helper functions for PnL calculation
            function calculateGainLoss(open, close) {
              if (!open || open === 0) return '0.00';
              return (close / open).toFixed(2);
            }
            
            function calculatePercentageChange(open, close) {
              if (!open || open === 0) return '0.00%';
              const percentage = ((close - open) / open) * 100;
              return `${percentage.toFixed(2)}%`;
            }

            function findClosestTimeIndex(targetTimestamp, timeArray) {
              if (!Array.isArray(timeArray) || timeArray.length === 0) return -1;
            
              const targetSec = Math.floor(targetTimestamp / 1000);
              let closestIndex = -1;
              let minDiff = Infinity;
            
              for (let i = 0; i < timeArray.length; i++) {
                const diff = Math.abs(timeArray[i] - targetSec);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIndex = i;
                }
              }
            
              return closestIndex;
            }
            

            function calculateCaPnl(tweetTimestamp, history) {
              const { t: timestamps, o, h, l, c, v } = history;
            
              const baseIndex = findClosestTimeIndex(tweetTimestamp, timestamps);
              if (baseIndex === -1 || !o[baseIndex]) return [];
            
              const baseOpen = h[baseIndex];
              const deltas = [1, 3, 6, 12, 24];
              const pnl = [];
            
              for (let hr of deltas) {
                const i = baseIndex + hr;
                if (i >= c.length) break;
            
                pnl.push({
                  time: `${hr}h`,
                  open: o[i],
                  close: c[i],
                  high: h[i],
                  low: l[i],
                  volume: v[i],
                  gainLoss: calculateGainLoss(baseOpen, h[i]),
                  percentage: calculatePercentageChange(baseOpen, h[i]),
                  timestamp: timestamps[i]
                });
              }
            
              return pnl;
            }
            

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              if (message.action === 'get_storage') {
                chrome.storage.local.get(message.key, (result) => {
                  sendResponse({ data: result[message.key] });
                });
                return true; // Keep the message channel open for async response
              }
              // ... other listeners
            });
        },
        { "@parcel/transformer-js/src/esmodule-helpers.js": "hbR2Q" },
      ],
      hbR2Q: [
        function (e, t, r) {
          (r.interopDefault = function (e) {
            return e && e.__esModule ? e : { default: e };
          }),
            (r.defineInteropFlag = function (e) {
              Object.defineProperty(e, "__esModule", { value: !0 });
            }),
            (r.exportAll = function (e, t) {
              return (
                Object.keys(e).forEach(function (r) {
                  "default" === r ||
                    "__esModule" === r ||
                    t.hasOwnProperty(r) ||
                    Object.defineProperty(t, r, {
                      enumerable: !0,
                      get: function () {
                        return e[r];
                      },
                    });
                }),
                t
              );
            }),
            (r.export = function (e, t, r) {
              Object.defineProperty(e, t, { enumerable: !0, get: r });
            });
        },
        {},
      ],
    },
    ["kgW6q"],
    "kgW6q",
    "parcelRequire7905"
  ),
  (globalThis.define = t);
