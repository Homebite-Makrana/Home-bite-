#!/data/data/com.termux/files/usr/bin/bash
set -e
ROOT="$HOME/home-bite"
cd "$ROOT"
echo "================================================"
echo " HOME BITE v38 — FINAL VISUAL LOCK"
echo "================================================"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-v38-backup-$STAMP"
mkdir -p "$BACKUP"
cp public/index.html public/app.js public/final-home.css android/app/src/main/res/values/styles.xml "$BACKUP/"
echo "BACKUP: $BACKUP"

python - <<'PY'
from pathlib import Path
import re

p = Path("public/index.html")
s = p.read_text()
head = re.search(r'<head\b.*?</head>', s, re.I | re.S)
if not head:
    raise SystemExit("HEAD NOT FOUND")
head_html = head.group(0)
head_html = re.sub(r'<link[^>]+final-home\.css[^>]*>\s*', '', head_html, flags=re.I)
head_html = re.sub(r'<script[^>]+app\.js[^>]*>\s*</script>\s*', '', head_html, flags=re.I)
head_html = head_html.replace('</head>', '<link rel="stylesheet" href="final-home.css?v=38"></head>', 1)

boot = r"""
<body>
<div id="app">
  <div class="hb-boot">
    <header class="top">
      <div class="brand">
        <div class="logo hb-app-logo"><img class="hb-app-logo-img" src="/home-bite-app-icon.png" alt="HOME BITE"></div>
        <div><b>HOME BITE</b><small>Makrana City</small></div>
      </div>
      <div class="hb-header-actions">
        <span class="hb-boot-bell">♧</span>
        <button class="btn" type="button">Login</button>
      </div>
    </header>
    <main class="hb-final-page">
      <div class="hb-final-location"><span class="hb-pin">●</span><div><small>DELIVERING IN</small> <b>Makrana City</b></div><span class="hb-live">● LIVE</span></div>
      <div class="hb-final-search"><span class="hb-search-icon">⌕</span><input type="search" placeholder="Search restaurant or kitchen"><span class="hb-search-go">⌕</span></div>
      <section class="hb-final-hero">
        <div><small>HOME BITE</small><h1>रेस्टोरेंट का स्वाद<br><em>अब आपके घर.</em></h1><p>Restaurant food + homemade food</p></div>
        <div class="hb-hero-dish">🍽</div>
      </section>
      <div class="hb-final-cats">
        <button class="active"><span>▦</span><b>All</b></button>
        <button><span>🏪</span><b>Restaurants</b></button>
        <button><span>🏠</span><b>Home Food</b></button>
      </div>
      <div class="hb-final-heading"><div><small>NEAR YOU</small><h2>Popular Restaurants</h2></div><span>View all ›</span></div>
      <div class="hb-final-empty"><div>🍽</div><h3>Loading restaurants...</h3></div>
    </main>
  </div>
</div>
<script defer src="app.js?v=38"></script>
</body>
"""
p.write_text(head_html + "\n" + boot + "\n</html>\n")

p = Path("public/app.js")
s = p.read_text()
layout_pat = re.compile(r'function layout\(c\)\{\s*A\.innerHTML\s*=\s*c;\s*\}', re.S)
layout_new = r"""function layout(c){
  A.innerHTML=`<header class="top">
    <div class="brand">
      <div class="logo hb-app-logo">
        <img class="hb-app-logo-img" src="/home-bite-app-icon.png" alt="HOME BITE">
      </div>
      <div><b>HOME BITE</b><small>Makrana City</small></div>
    </div>
    <div class="hb-header-actions">
      ${U
        ? `<button class="hb-bell" onclick="notifications()">${hbIcon("bell")}</button><span class="hb-hi">Hi, ${U.name}</span><button class="btn dark" onclick="changePassword()">🔐 Password</button><button class="btn dark" onclick="logout()">Logout</button>`
        : `<button class="hb-bell" onclick="notifications()">${hbIcon("bell")}</button><button class="btn" onclick="login()">Login</button>`
      }
    </div>
  </header><main class="wrap">${c}</main>`;
}"""
if not layout_pat.search(s):
    raise SystemExit("layout() v37 block not found")
s = layout_pat.sub(layout_new, s, count=1)

if "function hbIcon(" not in s:
    marker = "function layout(c){"
    icons = r"""function hbIcon(name){
  const a={
    grid:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    restaurant:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16M5 10v9M19 10v9M3 19h18M6 10l2-5h8l2 5M8 14h8"/></svg>`,
    homefood:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M9 20v-5h6v5"/></svg>`,
    hero:`<svg class="hb-svg hb-svg-hero" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 36h44M14 36c0-13 8-22 18-22s18 9 18 22M8 40h48M18 40v8h28v-8M23 50h18M29 14h6M32 9v5"/></svg>`,
    bell:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>`,
    user:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6"/></svg>`,
    cart:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M18 21h.01"/></svg>`,
    orders:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/></svg>`
  };
  return a[name]||"";
}

"""
    s = s.replace(marker, icons + marker, 1)

repls = {
    '<span>▦</span><b>All</b>':'${hbIcon("grid")}<b>All</b>',
    '<span>🏪</span><b>Restaurants</b>':'${hbIcon("restaurant")}<b>Restaurants</b>',
    '<span>🏠</span><b>Home Food</b>':'${hbIcon("homefood")}<b>Home Food</b>',
    '<div class="hb-hero-dish">🍽</div>':'<div class="hb-hero-dish">${hbIcon("hero")}</div>',
    '<div>🍽</div>':'<div>${hbIcon("hero")}</div>',
    '<span>⌂</span><b>Home</b>':'${hbIcon("homefood")}<b>Home</b>',
    '<span>▤</span><b>Orders</b>':'${hbIcon("orders")}<b>Orders</b>',
    '<span>🛒</span><b>Cart</b>':'${hbIcon("cart")}<b>Cart</b>',
    '<span>♙</span><b>Account</b>':'${hbIcon("user")}<b>Account</b>',
}
for old,new in repls.items():
    s=s.replace(old,new)
p.write_text(s.rstrip()+"\n")

p = Path("public/final-home.css")
s = p.read_text().rstrip()+"\n"
s += r"""
/* v38 deterministic visual lock */
.hb-svg{width:28px!important;height:28px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.hb-svg-hero{width:76px!important;height:76px!important;stroke-width:1.7!important}
.hb-final-cats button .hb-svg{color:#FFD000!important;width:31px!important;height:31px!important}
.hb-final-cats button.active .hb-svg,.hb-final-cats button.selected .hb-svg{color:#111!important}
.hb-hero-dish{color:#FFD000!important;display:flex!important;align-items:center!important;justify-content:center!important}
.hb-final-empty .hb-svg{color:#FFD000!important;margin:0 auto 10px!important}
.hb-final-nav button .hb-svg{color:#FFD000!important;width:28px!important;height:28px!important}
.hb-final-nav button.active .hb-svg,.hb-final-nav button.selected .hb-svg{color:#111!important}
.hb-bell .hb-svg{width:29px!important;height:29px!important;color:#FFD000!important}
.hb-final-search input[type="search"]::-webkit-search-cancel-button{-webkit-appearance:none!important;appearance:none!important;display:none!important}
.hb-final-search input[type="search"]::-webkit-search-decoration{-webkit-appearance:none!important}
.hb-search-clear{display:none!important}
.hb-boot{min-height:100vh!important;background:#000!important}
.hb-boot .top{display:flex!important}
.hb-boot .hb-final-page{display:block!important}
.hb-boot-bell{color:#FFD000!important;font-size:28px!important}
"""
p.write_text(s)

print("PATCH: V38 VISUAL LOCK WRITTEN")
PY

node --check public/app.js
git diff --check -- public/index.html public/app.js public/final-home.css android/app/src/main/res/values/styles.xml
grep -q 'final-home.css?v=38' public/index.html
grep -q 'app.js?v=38' public/index.html
grep -q 'function hbIcon' public/app.js
grep -q 'function layout(c)' public/app.js
grep -q 'hb-svg' public/final-home.css
echo "===== SOURCE VALIDATION: PASS ====="

npx cap copy android
grep -q 'final-home.css?v=38' android/app/src/main/assets/public/index.html
grep -q 'app.js?v=38' android/app/src/main/assets/public/index.html
grep -q '<div id="app">' android/app/src/main/assets/public/index.html
echo "===== ANDROID ASSET VALIDATION: PASS ====="

git add public/index.html public/app.js public/final-home.css android/app/src/main/res/values/styles.xml
git commit -m "HOME BITE v38 deterministic reference UI and boot render"
git push origin main
COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"

gh workflow run android.yml --ref main
sleep 5
RUN="$(gh run list --workflow android.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
echo "RUN: $RUN"
gh run watch "$RUN" --exit-status

rm -rf "$ROOT/final-apk-$COMMIT"
mkdir -p "$ROOT/final-apk-$COMMIT"
gh run download "$RUN" -n home-bite-debug-apk -D "$ROOT/final-apk-$COMMIT"
cp "$ROOT/final-apk-$COMMIT/app-debug.apk" /sdcard/Download/HOME-BITE-FINAL.apk
echo "================================================"
echo " HOME BITE v38 APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-FINAL.apk"
echo "================================================"
