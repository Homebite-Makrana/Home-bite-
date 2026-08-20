#!/data/data/com.termux/files/usr/bin/bash
set -e

cd ~/home-bite

echo "================================================"
echo " HOME BITE v42 — V39 BASE + CLEAN BLUE/GOLD"
echo "================================================"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-v42-backup-$STAMP"
mkdir -p "$BACKUP"

cp public/index.html "$BACKUP/" 2>/dev/null || true
cp public/final-home.css "$BACKUP/" 2>/dev/null || true
cp public/app.js "$BACKUP/" 2>/dev/null || true
cp android/app/src/main/res/values/styles.xml "$BACKUP/" 2>/dev/null || true

# 1) Return ONLY the known-good V39 web/native source.
git checkout c236894 -- \
  public/index.html \
  public/final-home.css \
  public/app.js \
  android/app/src/main/res/values/styles.xml

# 2) Remove the old WEB splash completely.
python - <<'PY'
from pathlib import Path
import re

p=Path("public/index.html")
s=p.read_text()

# Remove the V39 web splash container.
s=re.sub(r'\s*<div id="hb-boot-splash">.*?</div>\s*(?=<div id="app"></div>)',
         '\n', s, flags=re.I|re.S)

# Remove the inline hideBoot() script.
s=re.sub(r'\s*<script>\s*\(function\(\)\{\s*function hideBoot\(\).*?</script>\s*',
         '\n', s, flags=re.I|re.S)

# Remove any old boot-splash CSS include if present.
s=re.sub(r'<link[^>]+(?:boot|splash)[^>]*>\s*', '', s, flags=re.I)

# Keep the app script only once and cache-busted.
s=re.sub(r'<script[^>]+src=["\']app\.js[^"\']*["\'][^>]*></script>',
         '<script defer src="app.js?v=42"></script>', s, count=1, flags=re.I)

# If no app script survived, add it before body close.
if 'app.js?v=42' not in s:
    s=s.replace('</body>', '<script defer src="app.js?v=42"></script>\n</body>')

p.write_text(s.rstrip()+"\n")
PY

# 3) Make ONE clean Blue/Gold theme.
cat >> public/final-home.css <<'CSS'

/* =========================================================
   HOME BITE v42 — CLEAN BLUE/GOLD THEME
   V39 layout preserved. No red/cream theme.
   ========================================================= */

:root{
  --hb-bg:#070B14;
  --hb-panel:#0B1322;
  --hb-panel2:#0E1B2E;
  --hb-gold:#FFC928;
  --hb-gold2:#E9A900;
  --hb-white:#FFFFFF;
  --hb-muted:#B9C1CC;
}

html,body,#app{
  background:#070B14!important;
  color:#FFFFFF!important;
}

body{
  background:#070B14!important;
}

/* Main V39 surface */
.hb-final-page{
  background:#070B14!important;
  color:#FFFFFF!important;
}

/* Location / header */
.hb-final-location{
  color:#FFFFFF!important;
}
.hb-final-location b{
  color:#FFC928!important;
}
.hb-final-location .hb-live{
  color:#FF3030!important;
}

/* Search */
.hb-final-search{
  background:#0B1322!important;
  border-color:#FFC928!important;
}
.hb-final-search input{
  color:#FFFFFF!important;
  background:transparent!important;
}
.hb-final-search input::placeholder{
  color:#9FA9B7!important;
}

/* Hero */
.hb-final-hero{
  background:linear-gradient(135deg,#0B2340,#07162A 55%,#0B1322)!important;
  border-color:#FFC928!important;
  color:#FFFFFF!important;
}
.hb-final-hero h1,
.hb-final-hero h1 em,
.hb-final-hero p,
.hb-final-hero small{
  color:#FFFFFF!important;
}
.hb-final-hero h1 em{
  color:#FFC928!important;
}

/* Category buttons */
.hb-final-cats button{
  background:#0B1322!important;
  border-color:#C99A00!important;
  color:#FFFFFF!important;
}
.hb-final-cats button *{
  color:#FFFFFF!important;
}
.hb-final-cats button .hb-svg{
  color:#FFC928!important;
}
.hb-final-cats button.active,
.hb-final-cats button.selected{
  background:linear-gradient(180deg,#FFC928,#E9A900)!important;
  border-color:#FFC928!important;
}
.hb-final-cats button.active *,
.hb-final-cats button.selected *{
  color:#070B14!important;
}
.hb-final-cats button.active .hb-svg,
.hb-final-cats button.selected .hb-svg{
  color:#070B14!important;
}

/* Restaurant cards */
.hb-final-card{
  background:linear-gradient(145deg,#0B2340,#070B14)!important;
  border-color:#FFC928!important;
  color:#FFFFFF!important;
}
.hb-final-card *{
  color:inherit;
}
.hb-final-card small,
.hb-final-card p{
  color:#B9C1CC!important;
}
.hb-final-card .hb-svg{
  color:#FFC928!important;
}

/* Any old red/brown card backgrounds inside the V39 card */
.hb-final-card [style*="#6C2500"],
.hb-final-card [style*="#210000"]{
  background:#0B1322!important;
}

/* Navigation */
.hb-final-nav{
  background:#0B1322!important;
  border-color:#FFC928!important;
}
.hb-final-nav button{
  background:transparent!important;
  color:#FFFFFF!important;
}
.hb-final-nav button .hb-svg{
  color:#FFC928!important;
}
.hb-final-nav button.active,
.hb-final-nav button.selected{
  background:linear-gradient(180deg,#FFC928,#E9A900)!important;
}
.hb-final-nav button.active *,
.hb-final-nav button.selected *{
  color:#070B14!important;
}
.hb-final-nav button.active .hb-svg,
.hb-final-nav button.selected .hb-svg{
  color:#070B14!important;
}

/* Remove the old V39 boot surface if it is still present in DOM */
#hb-boot-splash,
.hb-boot{
  display:none!important;
  visibility:hidden!important;
}

/* Hard-stop old red/cream surfaces */
[style*="#650000"],
[style*="#8A0000"],
[style*="#6C2500"],
[style*="#210000"]{
  background:#0B1322!important;
}

CSS

# 4) Native splash: BLUE background + current blue launcher logo.
mkdir -p android/app/src/main/res/drawable

# Use the already-generated V41 blue launcher artwork as the splash artwork.
if [ -f android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png ]; then
  cp android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png \
    android/app/src/main/res/drawable/home_bite_blue_splash.png
else
  echo "ERROR: blue launcher icon not found"
  exit 1
fi

python - <<'PY'
from pathlib import Path
import re
p=Path("android/app/src/main/res/values/styles.xml")
s=p.read_text()

s=re.sub(
    r'(<item name="windowSplashScreenBackground">).*?(</item>)',
    r'\1#070B14\2',
    s, count=1
)

s=re.sub(
    r'(<item name="windowSplashScreenAnimatedIcon">).*?(</item>)',
    r'\1@drawable/home_bite_blue_splash\2',
    s, count=1
)

p.write_text(s.rstrip()+"\n")
PY

# 5) Validation BEFORE build.
echo "===== V42 SOURCE VALIDATION ====="
node --check public/app.js
git diff --check -- \
  public/index.html \
  public/final-home.css \
  public/app.js \
  android/app/src/main/res/values/styles.xml

grep -q 'app.js?v=42' public/index.html
grep -q '#070B14' public/final-home.css
grep -q '#FFC928' public/final-home.css
grep -q 'windowSplashScreenBackground.*#070B14' android/app/src/main/res/values/styles.xml
grep -q '@drawable/home_bite_blue_splash' android/app/src/main/res/values/styles.xml
test -f android/app/src/main/res/drawable/home_bite_blue_splash.png

# No web splash markup should remain.
if grep -q 'id="hb-boot-splash"' public/index.html; then
  echo "ERROR: WEB SPLASH STILL PRESENT"
  exit 1
fi

echo "BLUE/GOLD: PASS"
echo "WEB SPLASH: REMOVED"
echo "NATIVE SPLASH: BLUE"
echo "===== V42 SOURCE PASS ====="

# 6) Copy to Android and validate.
npx cap copy android

grep -q 'app.js?v=42' android/app/src/main/assets/public/index.html
grep -q '#070B14' android/app/src/main/assets/public/final-home.css

echo "===== V42 ANDROID ASSET PASS ====="

# 7) Commit.
git add \
  public/index.html \
  public/final-home.css \
  public/app.js \
  android/app/src/main/res/values/styles.xml \
  android/app/src/main/res/drawable/home_bite_blue_splash.png

git commit -m "HOME BITE v42 clean blue gold final"
git push origin main

COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"

# 8) ONE build.
gh workflow run android.yml --ref main
sleep 6

RUN="$(gh run list \
  --workflow android.yml \
  --branch main \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')"

echo "RUN: $RUN"
gh run watch "$RUN" --exit-status

# 9) Download APK.
rm -rf "final-apk-$COMMIT"
mkdir -p "final-apk-$COMMIT"

gh run download "$RUN" \
  -n home-bite-debug-apk \
  -D "$HOME/home-bite/final-apk-$COMMIT"

cp "$HOME/home-bite/final-apk-$COMMIT/app-debug.apk" \
  /sdcard/Download/HOME-BITE-V42-FINAL.apk

echo "================================================"
echo " HOME BITE v42 FINAL APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-V42-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-V42-FINAL.apk"
echo "================================================"
