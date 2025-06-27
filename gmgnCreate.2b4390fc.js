var e, t;
"function" == typeof (e = globalThis.define) && ((t = e), (e = null)),
  (function (t, n, o, r, i) {
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
      l = "function" == typeof a[r] && a[r],
      s = l.cache || {},
      c =
        "undefined" != typeof module &&
        "function" == typeof module.require &&
        module.require.bind(module);
    function d(e, n) {
      if (!s[e]) {
        if (!t[e]) {
          var o = "function" == typeof a[r] && a[r];
          if (!n && o) return o(e, !0);
          if (l) return l(e, !0);
          if (c && "string" == typeof e) return c(e);
          var i = Error("Cannot find module '" + e + "'");
          throw ((i.code = "MODULE_NOT_FOUND"), i);
        }
        (u.resolve = function (n) {
          var o = t[e][1][n];
          return null != o ? o : n;
        }),
          (u.cache = {});
        var p = (s[e] = new d.Module(e));
        t[e][0].call(p.exports, u, p, p.exports, this);
      }
      return s[e].exports;
      function u(e) {
        var t = u.resolve(e);
        return !1 === t ? {} : d(t);
      }
    }
    (d.isParcelRequire = !0),
      (d.Module = function (e) {
        (this.id = e), (this.bundle = d), (this.exports = {});
      }),
      (d.modules = t),
      (d.cache = s),
      (d.parent = l),
      (d.register = function (e, n) {
        t[e] = [
          function (e, t) {
            t.exports = n;
          },
          {},
        ];
      }),
      Object.defineProperty(d, "root", {
        get: function () {
          return a[r];
        },
      }),
      (a[r] = d);
    for (var p = 0; p < n.length; p++) d(n[p]);
    if (o) {
      var u = d(o);
      "object" == typeof exports && "undefined" != typeof module
        ? (module.exports = u)
        : "function" == typeof e && e.amd
        ? e(function () {
            return u;
          })
        : i && (this[i] = u);
    }
  })(
    {
      "534b4": [
        function (e, t, n) {
          var o = e("@parcel/transformer-js/src/esmodule-helpers.js");
          o.defineInteropFlag(n), o.export(n, "config", () => r);
          let r = {
              matches: ["https://gmgn.ai/*", "https://www.gmgn.ai/*"],
              run_at: "document_idle",
            },
            i = (e, t) => {
              let n = "coin-overlay-force-styles";
              if (!document.getElementById(n)) {
                let e = document.createElement("style");
                (e.id = n),
                  (e.textContent =
                    "#coin-overlay-backdrop{background:rgba(0,0,0,.6)!important}#coin-wrapper{background:transparent!important}#coin-iframe-overlay{background:transparent!important;color-scheme:none!important}"),
                  document.head.appendChild(e);
              }
              (e.style.cssText =
                "position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,.6)!important;z-index:10000!important;transition:opacity .3s ease!important;opacity:1!important;"),
                t &&
                  ((t.style.cssText =
                    "position:absolute!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;border:none!important;z-index:10001!important;transition:opacity .3s ease!important;opacity:1!important;pointer-events:auto!important;background:transparent!important;color-scheme:none!important;"),
                  t.setAttribute("allowtransparency", "true"),
                  t.setAttribute("frameborder", "0"));
              let o = new MutationObserver((t) => {
                for (let n of t)
                  n.target !== e ||
                    "style" !== n.attributeName ||
                    e.style.background.includes("rgba(0, 0, 0, 0.6)") ||
                    (e.style.background = "rgba(0, 0, 0, 0.6)");
              });
              return (
                o.observe(e, { attributes: !0, attributeFilter: ["style"] }), o
              );
            },
            a = async (e) => {
              if (document.getElementById("coin-iframe-overlay")) return;
              let t = document.createElement("div");
              t.id = "coin-wrapper";
              let n = document.createElement("div");
              n.id = "coin-overlay-backdrop";
              let o = document.createElement("iframe");
              (o.id = "coin-iframe-overlay"),
                (o.src = `https://uxento.io/iframe/vamp?ca=${encodeURIComponent(
                  e
                )}`);
              let r = i(n, o),
                a = s();
              (n.onclick = (e) => {
                e.target === n && c();
              }),
                t.append(n, o, a),
                document.body.appendChild(t);
              let l = () => {
                  o.contentWindow?.postMessage(
                    {
                      type: "initData",
                      payload: { url: e, author: "User", images: [] },
                    },
                    "*"
                  ),
                    a.remove();
                },
                c = () => {
                  (n.style.opacity = "0"),
                    (o.style.opacity = "0"),
                    setTimeout(() => {
                      window.removeEventListener("message", d),
                        r.disconnect(),
                        document
                          .getElementById("coin-overlay-force-styles")
                          ?.remove(),
                        t.remove();
                    }, 300);
                },
                d = (e) => {
                  e.origin.includes("uxento.io") &&
                    (e.data?.type === "ready"
                      ? l()
                      : e.data?.type === "close" && c());
                };
              window.addEventListener("message", d);
            },
            l = () => {
              if (document.getElementById("coin-iframe-overlay")) return;
              let e = document.createElement("div");
              e.id = "coin-wrapper";
              let t = document.createElement("div");
              t.id = "coin-overlay-backdrop";
              let n = document.createElement("iframe");
              (n.id = "coin-iframe-overlay"),
                (n.src = "https://uxento.io/iframe/vamp");
              let o = i(t, n),
                r = s();
              (t.onclick = (e) => {
                e.target === t && l();
              }),
                e.append(t, n, r),
                document.body.appendChild(e);
              let a = () => {
                  n.contentWindow?.postMessage(
                    {
                      type: "initData",
                      payload: { url: "", author: "", images: [] },
                    },
                    "*"
                  ),
                    r.remove();
                },
                l = () => {
                  (t.style.opacity = "0"),
                    (n.style.opacity = "0"),
                    setTimeout(() => {
                      window.removeEventListener("message", c),
                        o.disconnect(),
                        document
                          .getElementById("coin-overlay-force-styles")
                          ?.remove(),
                        e.remove();
                    }, 300);
                },
                c = (e) => {
                  e.origin.includes("uxento.io") &&
                    (e.data?.type === "ready"
                      ? a()
                      : e.data?.type === "close" && l());
                };
              window.addEventListener("message", c);
            },
            s = () => {
              let e = document.createElement("div");
              return (
                (e.id = "coin-loading"),
                (e.innerHTML =
                  "<style>@keyframes spin{100%{transform:rotate(360deg)}}</style><svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='animation:spin 1s linear infinite;display:block;'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 6l0 -3'/><path d='M16.25 7.75l2.15 -2.15'/><path d='M18 12l3 0'/><path d='M16.25 16.25l2.15 2.15'/><path d='M12 18l0 3'/><path d='M7.75 16.25l-2.15 2.15'/><path d='M6 12l-3 0'/><path d='M7.75 7.75l-2.15 -2.15'/></svg>"),
                Object.assign(e.style, {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: "10002",
                  pointerEvents: "auto",
                }),
                (e.onclick = (e) => e.stopPropagation()),
                e
              );
            },
            c = (e = 5e3) =>
              new Promise((t) => {
                let n = setInterval(() => {
                  let e = Array.from(
                    document.querySelectorAll(
                      "div.flex.flex-row.items-center.gap-x-2"
                    )
                  );
                  for (let o of e) {
                    let e = o.querySelector(
                      "h2.text-nowrap.font-geistSemiBold.text-\\[20px\\].text-fontColorPrimary.mb-0"
                    );
                    if (e) {
                      clearInterval(n), t(o);
                      return;
                    }
                  }
                }, 300);
                setTimeout(() => {
                  clearInterval(n), t(null);
                }, e);
              }),
            d = async () => {
              let e = await c();
              if (!e || e.querySelector("#create-coin-btn-wrapper")) return;
              let t = document.createElement("div");
              (t.id = "create-coin-btn-wrapper"),
                (t.className = "flex flex-row gap-2");
              let n = (e, t, n = "", o = "text-fontColorPrimary") => {
                  let r = document.createElement("button");
                  return (
                    (r.id = e),
                    (r.className = `${n} h-[32px] px-[12px] flex-row justify-start items-center rounded-full transition-color duration-[150ms] ease-in-out sm:flex hidden`),
                    (r.innerHTML = `<span class='text-[14px] font-bold ${o}'>${t}</span>`),
                    r
                  );
                },
                o = n(
                  "create-coin-btn",
                  "Create Coin",
                  "hover:bg-secondaryStroke/80 transition-color bg-primaryStroke"
                ),
                r = n(
                  "search-push-btn",
                  "Vamp a Coin",
                  "hover:bg-secondaryStroke/80 transition-color bg-primaryStroke"
                );
              (o.onclick = l),
                (r.onclick = async () => {
                  let e = prompt("Enter Contract Address (CA)");
                  if (!e || e.length < 5) return alert("Invalid CA");
                  await a(e);
                }),
                t.append(o, r),
                e.appendChild(t);
            };
          (() => {
            let e = document.body,
              t = location.pathname;
            new MutationObserver(() => {
              let e = location.pathname;
              e !== t &&
                ((t = e),
                console.debug(
                  "[NEURAL_SCAN] GMGN route change \u2013 reinserting buttons\u2026"
                ),
                d().catch(console.error));
            }).observe(e, { childList: !0, subtree: !0 });
          })(),
            d().catch(console.error);
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
    ["534b4"],
    "534b4",
    "parcelRequire7905"
  ),
  (globalThis.define = t);
