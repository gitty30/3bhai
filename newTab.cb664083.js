var e, t;
"function" == typeof (e = globalThis.define) && ((t = e), (e = null)),
  (function (t, n, o, r, u) {
    var i =
        "undefined" != typeof globalThis
          ? globalThis
          : "undefined" != typeof self
          ? self
          : "undefined" != typeof window
          ? window
          : "undefined" != typeof global
          ? global
          : {},
      l = "function" == typeof i[r] && i[r],
      c = l.cache || {},
      a =
        "undefined" != typeof module &&
        "function" == typeof module.require &&
        module.require.bind(module);
    function f(e, n) {
      if (!c[e]) {
        if (!t[e]) {
          var o = "function" == typeof i[r] && i[r];
          if (!n && o) return o(e, !0);
          if (l) return l(e, !0);
          if (a && "string" == typeof e) return a(e);
          var u = Error("Cannot find module '" + e + "'");
          throw ((u.code = "MODULE_NOT_FOUND"), u);
        }
        (s.resolve = function (n) {
          var o = t[e][1][n];
          return null != o ? o : n;
        }),
          (s.cache = {});
        var d = (c[e] = new f.Module(e));
        t[e][0].call(d.exports, s, d, d.exports, this);
      }
      return c[e].exports;
      function s(e) {
        var t = s.resolve(e);
        return !1 === t ? {} : f(t);
      }
    }
    (f.isParcelRequire = !0),
      (f.Module = function (e) {
        (this.id = e), (this.bundle = f), (this.exports = {});
      }),
      (f.modules = t),
      (f.cache = c),
      (f.parent = l),
      (f.register = function (e, n) {
        t[e] = [
          function (e, t) {
            t.exports = n;
          },
          {},
        ];
      }),
      Object.defineProperty(f, "root", {
        get: function () {
          return i[r];
        },
      }),
      (i[r] = f);
    for (var d = 0; d < n.length; d++) f(n[d]);
    if (o) {
      var s = f(o);
      "object" == typeof exports && "undefined" != typeof module
        ? (module.exports = s)
        : "function" == typeof e && e.amd
        ? e(function () {
            return s;
          })
        : u && (this[u] = s);
    }
  })(
    {
      gHvub: [
        function (e, t, n) {
          var o = e("@parcel/transformer-js/src/esmodule-helpers.js");
          o.defineInteropFlag(n), o.export(n, "config", () => r);
          let r = {
              matches: ["https://axiom.trade/*"],
              run_at: "document_idle",
            },
            u = new WeakSet();
          function i(e) {
            u.has(e) ||
              (u.add(e),
              e.addEventListener(
                "click",
                (t) => {
                  !(
                    !t.ctrlKey &&
                    !t.metaKey &&
                    !t.shiftKey &&
                    !t.altKey &&
                    location.pathname.startsWith("/pulse")
                  ) ||
                    chrome.storage.local.get("openQuickBuyNewTab", (t) => {
                      if (!t.openQuickBuyNewTab) return;
                      let n = e.closest(
                        "div.bg-backgroundSecondary, div.group"
                      );
                      n &&
                        n.dispatchEvent(
                          new MouseEvent("click", {
                            bubbles: !0,
                            cancelable: !0,
                            view: window,
                            ctrlKey: !0,
                            metaKey: !0,
                          })
                        );
                    });
                },
                !0
              ));
          }
          document.querySelectorAll("button.bg-primaryBlue").forEach(i),
            new MutationObserver((e) => {
              e.forEach((e) => {
                e.addedNodes.forEach((e) => {
                  e instanceof HTMLElement &&
                    (e.matches("button.bg-primaryBlue")
                      ? i(e)
                      : e.querySelectorAll("button.bg-primaryBlue").forEach(i));
                });
              });
            }).observe(document.body, { childList: !0, subtree: !0 });
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
    ["gHvub"],
    "gHvub",
    "parcelRequire7905"
  ),
  (globalThis.define = t);
