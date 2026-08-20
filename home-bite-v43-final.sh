#!/data/data/com.termux/files/usr/bin/bash
set -e

cd ~/home-bite

echo "================================================"
echo " HOME BITE V43 — FINAL LOGO / ICON / SPLASH FIX"
echo "================================================"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-v43-backup-$STAMP"
mkdir -p "$BACKUP"

cp public/index.html "$BACKUP/" 2>/dev/null || true
cp public/final-home.css "$BACKUP/" 2>/dev/null || true
cp public/app.js "$BACKUP/" 2>/dev/null || true
cp public/logo.svg "$BACKUP/" 2>/dev/null || true
cp public/manifest.json "$BACKUP/" 2>/dev/null || true
cp android/app/src/main/res/values/styles.xml "$BACKUP/" 2>/dev/null || true
cp -r android/app/src/main/res/mipmap-anydpi-v26 "$BACKUP/" 2>/dev/null || true
cp android/app/src/main/res/drawable "$BACKUP/" 2>/dev/null || true

# 1) Transparent web logo: no red square/background.
cat > public/logo.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#FFF2A6"/>
      <stop offset=".35" stop-color="#FFC928"/>
      <stop offset="1" stop-color="#D89400"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="218" fill="none" stroke="url(#gold)" stroke-width="9"/>
  <g fill="url(#gold)" stroke="#4A3300" stroke-width="3">
    <path d="M105 178h55v58h48v-58h55v162h-55v-57h-48v57h-55z"/>
    <path d="M278 178h72q54 0 54 43 0 26-25 37 29 10 29 43 0 39-57 39h-73zm51 34v31h19q9 0 9-16 0-15-9-15zm0 63v31h23q11 0 11-16t-11-15z"/>
    <path d="M202 133q54-41 108 0l-8 20H210z"/>
    <rect x="198" y="151" width="116" height="13" rx="6"/>
  </g>
  <text x="256" y="382" text-anchor="middle" font-size="48" font-family="Arial,sans-serif" font-weight="900" fill="#fff">HOME <tspan fill="#FFC928">BITE</tspan></text>
  <text x="256" y="414" text-anchor="middle" font-size="16" font-family="Arial,sans-serif" letter-spacing="3" fill="#DDE4EE">TASTE THAT FEELS LIKE HOME</text>
</svg>
SVG

# 2) Use the transparent SVG inside the app instead of the old red PNG.
python - <<'PY'
from pathlib import Path
p=Path("public/app.js")
s=p.read_text()
s=s.replace('src="/home-bite-app-icon.png"', 'src="/logo.svg"')
p.write_text(s)
PY

# 3) Web manifest/browser theme: navy + gold, not red.
python - <<'PY'
from pathlib import Path
import json
p=Path("public/manifest.json")
d=json.loads(p.read_text())
d["background_color"]="#070B14"
d["theme_color"]="#070B14"
d["icons"]=[{"src":"/logo.svg","sizes":"any","type":"image/svg+xml","purpose":"any"}]
p.write_text(json.dumps(d, indent=2)+"\n")
PY

# 4) Remove red meta/body startup colors and cache-bust to V43.
python - <<'PY'
from pathlib import Path
import re
p=Path("public/index.html")
s=p.read_text()
s=re.sub(r'<meta name="theme-color" content="[^"]*">', '<meta name="theme-color" content="#070B14">', s)
s=s.replace('background:#650000;', 'background:#070B14;')
s=s.replace('final-home.css?v=39', 'final-home.css?v=43')
s=s.replace('app.js?v=42', 'app.js?v=43')
p.write_text(s)
PY

# 5) Final CSS overrides: navy header, bigger HOME BITE branding, no red Login.
cat >> public/final-home.css <<'CSS'

/* =========================================================
   HOME BITE V43 — FINAL BRAND / HEADER FIX
   ========================================================= */

html,body,#app,.wrap,.hb-final-page{
  background:#070B14!important;
  color:#FFFFFF!important;
}

.top{
  background:#070B14!important;
  border-bottom:2px solid #FFC928!important;
  min-height:96px!important;
  padding:10px 12px!important;
}

.brand{
  gap:12px!important;
  align-items:center!important;
}

.hb-app-logo{
  width:76px!important;
  height:76px!important;
  flex:0 0 76px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}

.hb-app-logo-img{
  width:76px!important;
  height:76px!important;
  object-fit:contain!important;
  border-radius:0!important;
  display:block!important;
}

.brand b{
  font-size:30px!important;
  line-height:1!important;
  letter-spacing:.2px!important;
}

.brand small{
  font-size:17px!important;
  margin-top:5px!important;
  color:#FFC928!important;
}

.hb-header-actions{
  gap:6px!important;
}

.hb-bell{
  color:#FFC928!important;
  font-size:29px!important;
}

.hb-header-actions .btn{
  background:#FFC928!important;
  color:#070B14!important;
  border:2px solid #FFC928!important;
  border-radius:16px!important;
  min-height:50px!important;
  padding:0 18px!important;
  font-size:17px!important;
  font-weight:900!important;
}

.hb-header-actions .btn.dark{
  background:#0B1322!important;
  color:#FFC928!important;
  border-color:#FFC928!important;
}

.hb-final-page{
  min-height:calc(100vh - 96px)!important;
}

@media(max-width:390px){
  .top{padding:8px 8px!important;min-height:90px!important}
  .hb-app-logo,.hb-app-logo-img{width:68px!important;height:68px!important;flex-basis:68px!important}
  .brand{gap:8px!important}
  .brand b{font-size:26px!important}
  .brand small{font-size:15px!important}
  .hb-header-actions .btn{padding:0 13px!important;font-size:15px!important}
  .hb-bell{font-size:26px!important}
}

CSS

# 6) Android adaptive icon background: navy.
mkdir -p android/app/src/main/res/mipmap-anydpi-v26
mkdir -p android/app/src/main/res/drawable
mkdir -p android/app/src/main/res/drawable-nodpi

cat > android/app/src/main/res/drawable/hb_icon_background.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#070B14"/>
</shape>
XML

# 7) Android foreground: transparent, gold HB mark (no red square).
cat > android/app/src/main/res/drawable/hb_icon_foreground.xml <<'XML'
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="512"
    android:viewportHeight="512">

    <path
        android:fillColor="@android:color/transparent"
        android:strokeColor="#FFC928"
        android:strokeWidth="10"
        android:pathData="M256,55 A201,201 0,1 0,256,457 A201,201 0,1 0,256,55"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M105,178 L160,178 L160,236 L208,236 L208,178 L263,178 L263,340 L208,340 L208,283 L160,283 L160,340 L105,340 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M278,178 L350,178 Q404,178 404,221 Q404,244 379,255 Q407,266 407,298 Q407,340 350,340 L278,340 Z M329,211 L329,242 L348,242 Q359,242 359,226 Q359,211 348,211 Z M329,274 L329,307 L351,307 Q362,307 362,291 Q362,274 351,274 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M202,132 Q256,90 310,132 L302,151 L210,151 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M198,153 L314,153 L314,166 L198,166 Z"/>
</vector>
XML

# 8) Adaptive launcher icons for Android 8+ / Android 12.
cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/hb_icon_background"/>
    <foreground android:drawable="@drawable/hb_icon_foreground"/>
</adaptive-icon>
XML

cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/hb_icon_background"/>
    <foreground android:drawable="@drawable/hb_icon_foreground"/>
</adaptive-icon>
XML

# 9) Native splash: same navy background + larger clean HB mark.
cat > android/app/src/main/res/drawable/home_bite_splash_final.xml <<'XML'
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="220dp"
    android:height="220dp"
    android:viewportWidth="512"
    android:viewportHeight="512">

    <path
        android:fillColor="#FFC928"
        android:pathData="M105,178 L160,178 L160,236 L208,236 L208,178 L263,178 L263,340 L208,340 L208,283 L160,283 L160,340 L105,340 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M278,178 L350,178 Q404,178 404,221 Q404,244 379,255 Q407,266 407,298 Q407,340 350,340 L278,340 Z M329,211 L329,242 L348,242 Q359,242 359,226 Q359,211 348,211 Z M329,274 L329,307 L351,307 Q362,307 362,291 Q362,274 351,274 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M202,132 Q256,90 310,132 L302,151 L210,151 Z"/>

    <path
        android:fillColor="#FFC928"
        android:pathData="M198,153 L314,153 L314,166 L198,166 Z"/>
</vector>
XML

python - <<'PY'
from pathlib import Path
import re
p=Path("android/app/src/main/res/values/styles.xml")
s=p.read_text()
s=re.sub(r'(<item name="colorPrimary">).*?(</item>)', r'\1#070B14\2', s, count=1)
s=re.sub(r'(<item name="colorPrimaryDark">).*?(</item>)', r'\1#070B14\2', s, count=1)
s=re.sub(r'(<item name="windowActionBar">false</item>\s*<item name="windowNoTitle">true</item>\s*<item name="android:windowBackground">).*?(</item>)',
         r'\1#070B14\2', s, count=1, flags=re.S)
s=re.sub(r'(<item name="windowSplashScreenBackground">).*?(</item>)',
         r'\1#070B14\2', s, count=1)
s=re.sub(r'(<item name="windowSplashScreenAnimatedIcon">).*?(</item>)',
         r'\1@drawable/home_bite_splash_final\2', s, count=1)
p.write_text(s.rstrip()+"\n")
PY

# 10) Copy web changes into Android.
node --check public/app.js
npx cap copy android

# 11) Final checks.
echo "===== HOME BITE V43 VALIDATION ====="
grep -q 'src="/logo.svg"' public/app.js
grep -q 'theme-color" content="#070B14"' public/index.html
grep -q 'final-home.css?v=43' public/index.html
grep -q 'app.js?v=43' public/index.html
grep -q 'background:#070B14' public/final-home.css
test -f android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
test -f android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
test -f android/app/src/main/res/drawable/hb_icon_foreground.xml
test -f android/app/src/main/res/drawable/home_bite_splash_final.xml
grep -q 'home_bite_splash_final' android/app/src/main/res/values/styles.xml
grep -q '#070B14' android/app/src/main/res/values/styles.xml
grep -q 'src="/logo.svg"' android/app/src/main/assets/public/app.js

echo "LOGO: TRANSPARENT"
echo "HEADER: NAVY/GOLD + BIGGER HOME BITE"
echo "LOGIN: NAVY/GOLD (NO RED)"
echo "LAUNCHER: ADAPTIVE NAVY/GOLD"
echo "SPLASH: NAVY + LARGE CLEAN HB"
echo "ANDROID ASSETS: PASS"

# 12) Commit/push/build, if the configured GitHub workflow is available.
git add public/index.html public/app.js public/final-home.css public/logo.svg public/manifest.json \
  android/app/src/main/res/values/styles.xml \
  android/app/src/main/res/drawable/hb_icon_background.xml \
  android/app/src/main/res/drawable/hb_icon_foreground.xml \
  android/app/src/main/res/drawable/home_bite_splash_final.xml \
  android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml \
  android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml

git commit -m "HOME BITE v43 final transparent branding and icon fix" || true
git push origin main

if command -v gh >/dev/null 2>&1; then
  gh workflow run android.yml --ref main
  sleep 6
  RUN="$(gh run list --workflow android.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
  echo "RUN: $RUN"
  gh run watch "$RUN" --exit-status
  rm -rf "final-apk-$RUN"
  mkdir -p "final-apk-$RUN"
  gh run download "$RUN" -n home-bite-debug-apk -D "$HOME/home-bite/final-apk-$RUN"
  if [ -f "$HOME/home-bite/final-apk-$RUN/app-debug.apk" ]; then
    cp "$HOME/home-bite/final-apk-$RUN/app-debug.apk" /sdcard/Download/HOME-BITE-V43-FINAL.apk
    echo "APK: /sdcard/Download/HOME-BITE-V43-FINAL.apk"
  fi
else
  echo "GitHub CLI (gh) not found; source fix is complete."
fi

echo "================================================"
echo " HOME BITE V43 FINAL FIX COMPLETE"
echo "================================================"
