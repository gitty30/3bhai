var e, r;
"function" == typeof (e = globalThis.define) && ((r = e), (e = null)),
  (function (r, n, t, o, u) {
    var f =
        "undefined" != typeof globalThis
          ? globalThis
          : "undefined" != typeof self
          ? self
          : "undefined" != typeof window
          ? window
          : "undefined" != typeof global
          ? global
          : {},
      i = "function" == typeof f[o] && f[o],
      l = i.cache || {},
      d =
        "undefined" != typeof module &&
        "function" == typeof module.require &&
        module.require.bind(module);
    function c(e, n) {
      if (!l[e]) {
        if (!r[e]) {
          var t = "function" == typeof f[o] && f[o];
          if (!n && t) return t(e, !0);
          if (i) return i(e, !0);
          if (d && "string" == typeof e) return d(e);
          var u = Error("Cannot find module '" + e + "'");
          throw ((u.code = "MODULE_NOT_FOUND"), u);
        }
        (s.resolve = function (n) {
          var t = r[e][1][n];
          return null != t ? t : n;
        }),
          (s.cache = {});
        var a = (l[e] = new c.Module(e));
        r[e][0].call(a.exports, s, a, a.exports, this);
      }
      return l[e].exports;
      function s(e) {
        var r = s.resolve(e);
        return !1 === r ? {} : c(r);
      }
    }
    (c.isParcelRequire = !0),
      (c.Module = function (e) {
        (this.id = e), (this.bundle = c), (this.exports = {});
      }),
      (c.modules = r),
      (c.cache = l),
      (c.parent = i),
      (c.register = function (e, n) {
        r[e] = [
          function (e, r) {
            r.exports = n;
          },
          {},
        ];
      }),
      Object.defineProperty(c, "root", {
        get: function () {
          return f[o];
        },
      }),
      (f[o] = c);
    for (var a = 0; a < n.length; a++) c(n[a]);
    if (t) {
      var s = c(t);
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
      "6DIxd": [
        function (e, r, n) {
          var t = e("@parcel/transformer-js/src/esmodule-helpers.js");
          t.defineInteropFlag(n), t.export(n, "config", () => o);
          let o = { matches: ["<all_urls>"], run_at: "document_idle" };
          chrome.runtime.onMessage.addListener((e, r, n) => {
            if ("FIND_SOL_ADDRESS" !== e.type) return;
            let t = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
              o = Array.from(new Set(document.body.innerText.match(t) || [])),
              u = Array.from(document.querySelectorAll("[href], [src]"))
                .flatMap((e) => {
                  let r = e.href,
                    n = e.src;
                  return [r || n].filter(Boolean);
                })
                .join(" "),
              f = Array.from(new Set(u.match(t) || [])),
              i = Array.from(new Set([...o, ...f]));
            return n({ addresses: i }), !0;
          });
        },
        { "@parcel/transformer-js/src/esmodule-helpers.js": "cHUbl" },
      ],
      cHUbl: [
        function (e, r, n) {
          (n.interopDefault = function (e) {
            return e && e.__esModule ? e : { default: e };
          }),
            (n.defineInteropFlag = function (e) {
              Object.defineProperty(e, "__esModule", { value: !0 });
            }),
            (n.exportAll = function (e, r) {
              return (
                Object.keys(e).forEach(function (n) {
                  "default" === n ||
                    "__esModule" === n ||
                    r.hasOwnProperty(n) ||
                    Object.defineProperty(r, n, {
                      enumerable: !0,
                      get: function () {
                        return e[n];
                      },
                    });
                }),
                r
              );
            }),
            (n.export = function (e, r, n) {
              Object.defineProperty(e, r, { enumerable: !0, get: n });
            });
        },
        {},
      ],
    },
    ["6DIxd"],
    "6DIxd",
    "parcelRequire7905"
  ),
  (globalThis.define = r);
