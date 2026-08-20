#!/usr/bin/env bash
set -e

echo "================================================"
echo " HOME BITE v39 — SEAMLESS LAUNCH FINAL"
echo "================================================"

ROOT="$HOME/home-bite"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-v39-backup-$STAMP"
mkdir -p "$BACKUP"

cp public/index.html "$BACKUP/"
cp public/app.js "$BACKUP/"
cp public/final-home.css "$BACKUP/"
cp android/app/src/main/res/values/styles.xml "$BACKUP/"

echo "BACKUP: $BACKUP"

python - <<'PY'
from pathlib import Path
import re

p = Path("public/index.html")
s = p.read_text()

head = re.search(r"<head\b.*?</head>", s, re.I | re.S)
if not head:
    raise SystemExit("ERROR: HEAD NOT FOUND")

body = r'''<body style="margin:0;background:#650000;">
  <div id="hb-boot-splash" aria-label="HOME BITE loading">
    <div class="hb-boot-inner">
      <img src="home-bite-app-icon.png" alt="HOME BITE">
      <div class="hb-boot-title"><span>HOME</span> <b>BITE</b></div>
      <div class="hb-boot-city">Makrana City</div>
      <div class="hb-boot-loading">Loading<span class="hb-dots">...</span></div>
    </div>
  </div>
  <div id="app"></div>
  <script defer src="app.js?v=39"></script>
</body>'''

s = s[:head.end()] + "\n" + body + "\n</html>\n"

s = re.sub(r'<link[^>]+final-home\.css[^>]*>\s*', '', s, flags=re.I)
s = re.sub(r'<link[^>]+home-bite-app-icon\.png[^>]*>\s*', '', s, flags=re.I)
insert = (
    '<link rel="preload" as="image" href="home-bite-app-icon.png">\n'
    '<link rel="stylesheet" href="final-home.css?v=39">\n'
)
s = s.replace("</head>", insert + "</head>", 1)

p.write_text(s.rstrip() + "\n")
print("INDEX: SINGLE WEB BOOT SPLASH + APP MOUNT")
PY

python - <<'PY'
from pathlib import Path
import re

p = Path("public/app.js")
s = p.read_text()

old = re.search(
    r'function layout\(c\)\{\s*A\.innerHTML\s*=\s*c;\s*\}',
    s
)

if not old:
    raise SystemExit("ERROR: expected simple layout() not found")

new = '''function layout(c){
  const boot = document.getElementById("hb-boot-splash");
  if(boot) boot.remove();
  A.innerHTML = c;
}'''

s = s[:old.start()] + new + s[old.end():]
p.write_text(s.rstrip() + "\n")
print("LAYOUT: BOOT -> REAL HOME HANDOFF LOCKED")
PY

cat >> public/final-home.css <<'CSS'

/* =========================================================
   HOME BITE v39 — SEAMLESS BOOT SURFACE
   ========================================================= */

html,body{
  background:#650000!important;
}

#hb-boot-splash{
  position:fixed!important;
  inset:0!important;
  z-index:2147483647!important;
  width:100%!important;
  height:100vh!important;
  min-height:100vh!important;
  background:#650000!important;
  color:#fff!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  overflow:hidden!important;
}

.hb-boot-inner{
  width:100%!important;
  text-align:center!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  padding:24px!important;
}

.hb-boot-inner img{
  width:min(230px,58vw)!important;
  height:min(230px,58vw)!important;
  object-fit:contain!important;
  display:block!important;
  border-radius:42px!important;
}

.hb-boot-title{
  margin-top:18px!important;
  color:#fff!important;
  font-size:38px!important;
  line-height:1!important;
  font-weight:900!important;
}

.hb-boot-title b{
  color:#FFD000!important;
}

.hb-boot-city{
  margin-top:8px!important;
  color:#FFD000!important;
  font-size:22px!important;
  font-weight:700!important;
}

.hb-boot-loading{
  margin-top:78px!important;
  color:#FFD000!important;
  font-size:22px!important;
  font-weight:500!important;
}

.hb-dots{
  display:inline-block!important;
  min-width:30px!important;
  text-align:left!important;
}

@media(max-width:380px){
  .hb-boot-inner img{
    width:190px!important;
    height:190px!important;
  }
  .hb-boot-title{font-size:33px!important}
  .hb-boot-city{font-size:20px!important}
  .hb-boot-loading{margin-top:62px!important;font-size:20px!important}
}
CSS

mkdir -p android/app/src/main/res/drawable

if [ ! -f public/home-bite-app-icon.png ]; then
  echo "ERROR: public/home-bite-app-icon.png not found"
  exit 1
fi

cp public/home-bite-app-icon.png   android/app/src/main/res/drawable/home_bite_splash.png

python - <<'PY'
from pathlib import Path
import re

p=Path("android/app/src/main/res/values/styles.xml")
s=p.read_text()

s = re.sub(
    r'(<item name="windowSplashScreenBackground">).*?(</item>)',
    r'\1#650000\2',
    s,
    count=1
)

s = re.sub(
    r'(<item name="windowSplashScreenAnimatedIcon">).*?(</item>)',
    r'\1@drawable/home_bite_splash\2',
    s,
    count=1
)

p.write_text(s.rstrip()+"\n")
print("NATIVE SPLASH: RED + REAL HOME BITE ICON")
PY

node --check public/app.js

python - <<'PY'
from pathlib import Path
for f in [
    "public/index.html",
    "public/app.js",
    "public/final-home.css",
    "android/app/src/main/res/values/styles.xml",
]:
    p=Path(f)
    p.write_text(p.read_text().rstrip()+"\n")
print("EOF: CLEAN")
PY

git diff --check --   public/index.html   public/app.js   public/final-home.css   android/app/src/main/res/values/styles.xml

grep -q 'id="hb-boot-splash"' public/index.html
grep -q 'app.js?v=39' public/index.html
grep -q 'final-home.css?v=39' public/index.html
grep -q 'hb-boot-splash' public/final-home.css
grep -q 'home_bite_splash' android/app/src/main/res/values/styles.xml

if grep -q 'splash_transparent' android/app/src/main/res/values/styles.xml; then
  echo "ERROR: transparent native splash is still referenced"
  exit 1
fi

echo "===== V39 SOURCE VALIDATION: PASS ====="

npx cap copy android

grep -q 'app.js?v=39'   android/app/src/main/assets/public/index.html
grep -q 'final-home.css?v=39'   android/app/src/main/assets/public/index.html
grep -q 'id="hb-boot-splash"'   android/app/src/main/assets/public/index.html

echo "===== V39 ANDROID ASSET VALIDATION: PASS ====="

git add   public/index.html   public/app.js   public/final-home.css   android/app/src/main/res/values/styles.xml   android/app/src/main/res/drawable/home_bite_splash.png

git commit -m "HOME BITE seamless native and web launch"
git push origin main

COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"

gh workflow run android.yml --ref main
sleep 6

RUN="$(gh run list   --workflow android.yml   --branch main   --limit 1   --json databaseId   --jq '.[0].databaseId')"

echo "RUN: $RUN"
gh run watch "$RUN" --exit-status

rm -rf "$ROOT/final-apk-$COMMIT"
mkdir -p "$ROOT/final-apk-$COMMIT"

gh run download "$RUN"   -n home-bite-debug-apk   -D "$ROOT/final-apk-$COMMIT"

cp "$ROOT/final-apk-$COMMIT/app-debug.apk"   /sdcard/Download/HOME-BITE-FINAL.apk

echo
echo "================================================"
echo " HOME BITE v39 APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-FINAL.apk"
echo "================================================"
