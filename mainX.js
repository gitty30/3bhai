var e, t;
"function" == typeof (e = globalThis.define) && ((t = e), (e = null)),
  (function (t, n, r, o, l) {
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
      i = "function" == typeof a[o] && a[o],
      s = i.cache || {},
      d =
        "undefined" != typeof module &&
        "function" == typeof module.require &&
        module.require.bind(module);
    function c(e, n) {
      if (!s[e]) {
        if (!t[e]) {
          var r = "function" == typeof a[o] && a[o];
          if (!n && r) return r(e, !0);
          if (i) return i(e, !0);
          if (d && "string" == typeof e) return d(e);
          var l = Error("Cannot find module '" + e + "'");
          throw ((l.code = "MODULE_NOT_FOUND"), l);
        }
        (p.resolve = function (n) {
          var r = t[e][1][n];
          return null != r ? r : n;
        }),
          (p.cache = {});
        var u = (s[e] = new c.Module(e));
        t[e][0].call(u.exports, p, u, u.exports, this);
      }
      return s[e].exports;
      function p(e) {
        var t = p.resolve(e);
        return !1 === t ? {} : c(t);
      }
    }
    (c.isParcelRequire = !0),
      (c.Module = function (e) {
        (this.id = e), (this.bundle = c), (this.exports = {});
      }),
      (c.modules = t),
      (c.cache = s),
      (c.parent = i),
      (c.register = function (e, n) {
        t[e] = [
          function (e, t) {
            t.exports = n;
          },
          {},
        ];
      }),
      Object.defineProperty(c, "root", {
        get: function () {
          return a[o];
        },
      }),
      (a[o] = c);
    for (var u = 0; u < n.length; u++) c(n[u]);
    if (r) {
      var p = c(r);
      "object" == typeof exports && "undefined" != typeof module
        ? (module.exports = p)
        : "function" == typeof e && e.amd
        ? e(function () {
            return p;
          })
        : l && (this[l] = p);
    }
  })(
    {
      "4zjLO": [
        function (e, t, n) {
          let r;
          var o = e("@parcel/transformer-js/src/esmodule-helpers.js");
          o.defineInteropFlag(n), o.export(n, "config", () => l);
          let l = {
              matches: ["https://twitter.com/*", "https://x.com/*"],
              run_at: "document_idle",
            },
            a = (e) => {
              let t = e.replace(/\/+$/, "");
              if (!t || "/" === t) return null;
              let n = t.split("/").filter(Boolean);
              if (0 === n.length) return null;
              let r = n[0];
              if (n.length > 1 && "status" === n[1]) return null;
              let o = new Set([
                "home",
                "explore",
                "notifications",
                "messages",
                "compose",
                "i",
                "settings",
                "search",
                "login",
                "signup",
              ]);
              return o.has(r)
                ? null
                : /^[A-Za-z0-9_]{1,15}$/.test(r)
                ? r
                : null;
            };
          async function i(e) {
            try {
              let t = await chrome.runtime.sendMessage({
                action: "fetchTwitterData",
                username: e,
              });
              if (t?.success && t.data)
                console.info(`[Uxento] Twitter data for @${e}:`, t.data),
                  (d[e] = t.data),
                  await chrome.storage.local.set({
                    [`ux_twitter_${e}`]: t.data,
                  }),
                  m(e, t.data);
              else throw Error(t?.error || "Failed in background");
            } catch (t) {
              if (t?.message?.includes("context invalidated")) return;
              console.error(
                `[Uxento] Failed to fetch Twitter data for @${e}:`,
                t
              );
            }
          }
          let s = null,
            d = {},
            c = !1,
            u =
              ((r = !1),
              () => {
                if (r) return;
                r = !0;
                let e = document.createElement("style");
                (e.textContent =
                  "@keyframes uxSpin{to{transform:rotate(360deg)}}.ux-spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:uxSpin 1s linear infinite;margin:auto}"),
                  document.head.appendChild(e);
              }),
            p = () => {
              let e = a(window.location.pathname);
              e && e !== s
                ? ((s = e), i(e).catch(console.error), setTimeout(y, 250))
                : e && (d[e] && m(e, d[e]), y());
            };
          p(),
            (() => {
              let e = history.pushState,
                t = history.replaceState,
                n = (e) =>
                  function (...t) {
                    let n = e.apply(this, t);
                    return p(), n;
                  };
              (history.pushState = n(e)),
                (history.replaceState = n(t)),
                window.addEventListener("popstate", p);
            })(),
            setInterval(p, 5e3);
          let f = "uxento-prev-handles";
          function m(e, t) {
            let n = t.length ? t : [],
              r = () =>
                n.length
                  ? "Previous: " +
                    n
                      .map(
                        (e) =>
                          `@${e.username}${
                            e.last_checked
                              ? ` (${(function (e) {
                                  let t = Date.now() - new Date(e).getTime(),
                                    n = Math.floor(t / 1e3),
                                    r = Math.floor(n / 60),
                                    o = Math.floor(r / 60),
                                    l = Math.floor(o / 24);
                                  return l > 0
                                    ? `${l}d ago`
                                    : o > 0
                                    ? `${o}h ago`
                                    : r > 0
                                    ? `${r}m ago`
                                    : `${n}s ago`;
                                })(e.last_checked)})`
                              : ""
                          }`
                      )
                      .join(", ")
                  : "Previous: None",
              o = (t = 0) => {
                let n = Array.from(document.querySelectorAll("span")).find(
                  (t) => t.textContent?.trim().toLowerCase() === `@${e}`.toLowerCase()
                );
                if (!n) {
                  t < 40 && setTimeout(() => o(t + 1), 250);
                  return;
                }
                document.getElementById(f)?.remove();
                let l = document.createElement("div");
                (l.id = f),
                  (l.textContent = r()),
                  (l.style.fontSize = "13px"),
                  (l.style.color = "#FFD700"),
                  (l.style.fontWeight = "500"),
                  (l.style.display = "block");
                let a = !1,
                  i = [
                    n.parentElement?.parentElement,
                    n.parentElement?.parentElement?.parentElement,
                    n.parentElement?.parentElement?.parentElement
                      ?.parentElement,
                    n.closest('[data-testid="UserName"]'),
                  ];
                for (let e of i)
                  if (e && e.parentElement) {
                    e.insertAdjacentElement("afterend", l), (a = !0);
                    break;
                  }
                a || n.insertAdjacentElement("afterend", l), y();
              };
            o(), window._uxHeaderObs && window._uxHeaderObs.disconnect();
            let l = new MutationObserver(() => {
              let e = document.querySelector('div[data-testid="UserName"]');
              e && (o(40), l.disconnect(), (window._uxHeaderObs = null));
            });
            l.observe(document.body, { subtree: !0, childList: !0 }),
              (window._uxHeaderObs = l);
          }
          function y() {
            if (document.getElementById("uxento-profile-btn")) return;
            let e = document.querySelector('button[data-testid="userActions"]');
            if (!e) {
              setTimeout(y, 500);
              return;
            }
            let t = e.parentElement;
            if (!t || t.querySelector("#uxento-profile-btn")) return;
            let n = document.createElement("button");
            (n.id = "uxento-profile-btn"),
              (n.type = "button"),
              n.setAttribute("aria-label", "Uxento"),
              (n.className = e.className),
              (n.style.borderColor = e.style.borderColor),
              (n.style.backgroundColor = e.style.backgroundColor);
            let r = document.createElement("div"),
              o = e.querySelector("div");
            (r.className = o?.className || ""),
              r.setAttribute("dir", "ltr"),
              (r.style.color = o?.style.color || "rgb(239,243,244)");
            let l = document.createElement("img");
            (l.src = chrome.runtime.getURL("assets/icon.png")),
              (l.style.width = "20px"),
              (l.style.height = "20px"),
              (l.style.borderRadius = "50%"),
              r.appendChild(l),
              n.appendChild(r),
              n.addEventListener("click", async (e) => {
                if ((e.preventDefault(), e.stopPropagation(), !s || c)) return;
                c = !0;
                let { overlay: t, modal: n } = (function () {
                  if ((u(), document.getElementById("uxento-modal-overlay")))
                    return;
                  let e = document.createElement("div");
                  (e.id = "uxento-modal-overlay"),
                    Object.assign(e.style, {
                      position: "fixed",
                      inset: "0",
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: "9999",
                    });
                  let t = document.createElement("div");
                  Object.assign(t.style, {
                    width: "520px",
                    maxWidth: "95%",
                    background: "#15202b",
                    color: "#e7e9ea",
                    borderRadius: "8px",
                    padding: "20px",
                    fontFamily: "sans-serif",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    position: "relative",
                  });
                  let n = document.createElement("button");
                  (n.textContent = "\xd7"),
                    Object.assign(n.style, {
                      position: "absolute",
                      top: "8px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#8899a6",
                      fontSize: "24px",
                      cursor: "pointer",
                    }),
                    n.addEventListener("click", () => e.remove());
                  let r = document.createElement("h2");
                  (r.textContent = "Uxtension Alpha"),
                    Object.assign(r.style, {
                      margin: "0 0 12px",
                      fontSize: "20px",
                      textAlign: "center",
                    });
                  let o = document.createElement("div");
                  o.className = "ux-spinner";
                  let l = document.createElement("div");
                  return (
                    (l.textContent =
                      "Fetching data\u2026 this can take up to 30 seconds"),
                    (l.style.textAlign = "center"),
                    (l.style.marginTop = "10px"),
                    (l.style.fontSize = "14px"),
                    (l.id = "ux-load-msg"),
                    t.appendChild(n),
                    t.appendChild(r),
                    t.appendChild(o),
                    t.appendChild(l),
                    e.appendChild(t),
                    document.body.appendChild(e),
                    { overlay: e, modal: t }
                  );
                })();
                try {
                  let e = await chrome.runtime.sendMessage({
                    action: "fetchX2Data",
                    username: s,
                  });
                  e?.success
                    ? (console.info("[Uxento] X2 data for @" + s, e.data),
                      (function (e, t) {
                        if (
                          (e.querySelector(".ux-spinner")?.remove(),
                          e.querySelector("#ux-load-msg")?.remove(),
                          !t || 0 === t.length)
                        ) {
                          let t = document.createElement("div");
                          (t.textContent = "No Contract Addresses Found."),
                            (t.style.textAlign = "center"),
                            (t.style.fontSize = "14px"),
                            e.appendChild(t);
                          return;
                        }
                        let n = document.createElement("div");
                        (n.style.display = "flex"),
                          (n.style.flexDirection = "column"),
                          (n.style.gap = "8px");
                        let r = (t || []).slice(0, 8);
                        r.forEach((e) => {
                          let t = e.sol_addresses?.[0] || "",
                            r = document.createElement("div");
                          (r.style.display = "flex"),
                            (r.style.justifyContent = "space-between"),
                            (r.style.alignItems = "center"),
                            (r.style.flexWrap = "wrap"),
                            (r.style.padding = "8px 12px"),
                            (r.style.background = "#192734"),
                            (r.style.borderRadius = "4px");
                          let o = document.createElement("span");
                          (o.textContent = t),
                            (o.style.fontFamily = "monospace");
                          let l = document.createElement("div");
                          (l.style.display = "flex"), (l.style.gap = "8px");
                          let a = document.createElement("a");
                          (a.href = `https://axiom.trade/t/${t}`),
                            (a.target = "_blank"),
                            (a.rel = "noopener noreferrer");
                          let i = document.createElement("img");
                          (i.src = chrome.runtime.getURL("assets/axiom.png")),
                            (i.style.width = "24px"),
                            (i.style.height = "24px"),
                            (i.style.borderRadius = "50%"),
                            a.appendChild(i);
                          let s = document.createElement("button");
                          (s.textContent = "\u2139\ufe0f"),
                            (s.style.background = "transparent"),
                            (s.style.border = "none"),
                            (s.style.cursor = "pointer"),
                            (s.style.fontSize = "20px"),
                            (s.style.lineHeight = "20px"),
                            (s.style.color = "#e7e9ea");
                          let d = document.createElement("div");
                          (d.textContent = e.full_text),
                            (d.style.display = "none"),
                            (d.style.whiteSpace = "pre-wrap"),
                            (d.style.marginTop = "6px"),
                            (d.style.fontSize = "13px"),
                            (d.style.flexBasis = "100%"),
                            s.addEventListener("click", () => {
                              d.style.display =
                                "none" === d.style.display ? "block" : "none";
                            }),
                            l.appendChild(a),
                            l.appendChild(s),
                            r.appendChild(o),
                            r.appendChild(l),
                            r.appendChild(d),
                            n.appendChild(r);
                        }),
                          e.appendChild(n);
                      })(n, e.data))
                    : (n.textContent = `Error: ${e?.error || "Failed"}`);
                } catch (e) {
                  if (e?.message?.includes("context invalidated")) return;
                  console.error("[Uxento] X2 fetch error:", e),
                    (n.textContent = "Error fetching data");
                } finally {
                  c = !1;
                }
              }),
              t.insertBefore(n, t.firstChild);
          }
        },
        { "@parcel/transformer-js/src/esmodule-helpers.js": "cHUbl" },
      ],
      cHUbl: [
        function (e, t, n) {
          (n.interopDefault = function (e) {
            return e && e.__esModule ? e : { default: e };
          }),
            (n.defineInteropFlag = function (e) {
              Object.defineProperty(e, "__esModule", { value: !0 });
            }),
            (n.exportAll = function (e, t) {
              return (
                Object.keys(e).forEach(function (n) {
                  "default" === n ||
                    "__esModule" === n ||
                    t.hasOwnProperty(n) ||
                    Object.defineProperty(t, n, {
                      enumerable: !0,
                      get: function () {
                        return e[n];
                      },
                    });
                }),
                t
              );
            }),
            (n.export = function (e, t, n) {
              Object.defineProperty(e, t, { enumerable: !0, get: n });
            });
        },
        {},
      ],
    },
    ["4zjLO"],
    "4zjLO",
    "parcelRequire7905"
  ),
  (globalThis.define = t);
