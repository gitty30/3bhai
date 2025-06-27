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
            let t = await fetch("https://api.uxento.io/twitter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: e }),
              credentials: "omit",
            });
            if (!t.ok) throw Error(`HTTP ${t.status}`);
            let r = await t.text(),
              o = await d(r, c);
            return (
              console.info(`[F-Analyzer] Decoded Twitter data for @${e}:`, o),
              await chrome.storage.local.set({ ["f-analyzer_twitter_" + e]: o }),
              o
            );
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

            // Gemini AI Chat Integration
            chrome.runtime.onMessage.addListener((e, t, r) => {
              if ("chatWithAI" === e.action && "string" == typeof e.message) {
                return (
                  (async () => {
                    try {
                      // Load extension context with fallback
                      let context = '';
                      try {
                        const contextResponse = await fetch(chrome.runtime.getURL('extension-context.txt'));
                        if (contextResponse.ok) {
                          context = await contextResponse.text();
                        }
                      } catch (contextError) {
                        console.warn('[NEURAL_SCAN] Could not load context file, using fallback:', contextError);
                        context = 'You are a helpful AI assistant for UxTension, a browser extension that provides security analysis and threat detection for social media profiles.';
                      }
                      
                      // Prepare the prompt with context
                      const fullPrompt = `${context}\n\nUser Query: ${e.message}\n\nPlease respond as the UxTension AI assistant, providing helpful and accurate information about the extension's features and capabilities. Keep responses concise and focused on security analysis.`;
                      
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
                        const aiResponse = data.candidates[0].content.parts[0].text;
                        r({ success: true, response: aiResponse });
                      } else if (data.error) {
                        throw new Error(`Gemini API Error: ${data.error.message || 'Unknown error'}`);
                      } else {
                        throw new Error('Invalid response format from Gemini API');
                      }
                    } catch (error) {
                      console.error('[UxTension] AI Chat error:', error);
                      r({ success: false, error: error.toString() });
                    }
                  })(),
                  true
                );
              }
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
