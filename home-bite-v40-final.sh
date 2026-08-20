#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "================================================"
echo " HOME BITE v40 — BLUE/GOLD SINGLE-SPLASH LOCK"
echo "================================================"

cd ~/home-bite

STAMP="$(date +%Y%m%d-%H%M%S)"
B=".final-v40-backup-$STAMP"
mkdir -p "$B"

cp public/index.html "$B/"
cp public/app.js "$B/"
cp public/final-home.css "$B/"
cp android/app/src/main/res/values/styles.xml "$B/" 2>/dev/null || true

echo "BACKUP: $B"

cat >> public/final-home.css <<'CSS'

/* HOME BITE v40 — REFERENCE BLUE / GOLD THEME */

:root{
  --hb-bg:#07080C;
  --hb-panel:#0B1018;
  --hb-blue:#06182A;
  --hb-blue2:#0A2036;
  --hb-gold:#FFC400;
  --hb-gold2:#E6A900;
  --hb-white:#F7F7F5;
  --hb-muted:#B9BBC1;
  --hb-green:#18C84B;
}

html,body{
  background:var(--hb-bg)!important;
  color:var(--hb-white)!important;
}
body{min-height:100vh!important;overflow-x:hidden!important}
.top{background:#07080C!important;border-bottom:1px solid var(--hb-gold)!important}
.wrap{background:#07080C!important}
input,textarea,select{background:#07080C!important;color:#F7F7F5!important}

.hb-hero,.hero,.hero-card{
  background:
    radial-gradient(circle at 78% 45%,rgba(17,48,78,.55),transparent 34%),
    linear-gradient(135deg,#071321,#020912)!important;
  border-color:var(--hb-gold)!important;
}

.hb-category,.category,.filter-btn{
  background:#071321!important;color:#F7F7F5!important;
  border-color:var(--hb-gold)!important;
}
.hb-category.active,.category.active,.filter-btn.active{
  background:linear-gradient(135deg,#FFC400,#E8A900)!important;
  color:#090A0D!important;border-color:#FFC400!important;
}

.card,.restaurant-card,.shop-card{
  background:#070B11!important;color:#F7F7F5!important;
  border-color:var(--hb-gold)!important;
}
.card small,.restaurant-card small,.shop-card small{color:#B9BBC1!important}
.card .rating,.restaurant-card .rating,.shop-card .rating{color:#FFC400!important}

.btn{
  background:#071321!important;color:#FFC400!important;
  border-color:#FFC400!important;
}
.btn.primary,.btn.gold,button.primary{
  background:linear-gradient(135deg,#FFC400,#E8A900)!important;
  color:#090A0D!important;border-color:#FFC400!important;
}

.bottom-nav,.bottom,nav.bottom{
  background:#071321!important;border-color:#FFC400!important;
}
.bottom-nav .active,.bottom .active,nav.bottom .active{
  background:linear-gradient(135deg,#FFC400,#E8A900)!important;
  color:#090A0D!important;
}

h1,h2,h3,h4,b,strong{color:#F7F7F5}
.gold,.text-gold{color:#FFC400!important}

#app{background:#07080C!important;min-height:100vh!important}

#hb-boot-splash{
  background:#07080C!important;color:#F7F7F5!important;
}
#hb-boot-splash .hb-boot-inner{background:#07080C!important}
#hb-boot-splash .hb-boot-inner img{
  width:min(250px,62vw)!important;
  height:min(250px,62vw)!important;
  object-fit:contain!important;
}
#hb-boot-splash .hb-boot-title{color:#F7F7F5!important}
#hb-boot-splash .hb-boot-title b{color:#FFC400!important}
#hb-boot-splash .hb-boot-city,
#hb-boot-splash .hb-boot-loading{color:#FFC400!important}

CSS

python - <<'PY'
from pathlib import Path
p=Path("public/final-home.css")
p.write_text(p.read_text().rstrip()+"\n")
PY

# INDEX: BLUE/GOLD SURFACE
python - <<'PY'
from pathlib import Path
import re

p=Path("public/index.html")
s=p.read_text()

s=re.sub(r'<meta\s+name="theme-color"[^>]*>',
         '<meta name="theme-color" content="#07080C">',s,flags=re.I)
s=re.sub(r'<body\b[^>]*>',
         '<body style="margin:0;background:#07080C;">',
         s,count=1,flags=re.I)

if 'id="hb-boot-splash"' not in s:
    splash = """<div id="hb-boot-splash">
  <div class="hb-boot-inner">
    <img src="home-bite-app-icon.png" alt="HOME BITE">
    <div class="hb-boot-title"><span>HOME</span> <b>BITE</b></div>
    <div class="hb-boot-city">Makrana City</div>
    <div class="hb-boot-loading">Loading<span class="hb-dots">...</span></div>
  </div>
</div>
<div id="app"></div>"""
    s=s.replace('<div id="app"></div>',splash,1)

if 'function hideBoot' not in s:
    helper = """<script>
(function(){
  function hideBoot(){
    var b=document.getElementById("hb-boot-splash");
    var a=document.getElementById("app");
    if(!b||!a)return;
    if(a.children.length){
      b.style.opacity="0";
      b.style.transition="opacity 120ms ease";
      setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b);},130);
    }else{
      requestAnimationFrame(hideBoot);
    }
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",hideBoot,{once:true});
  }else{
    hideBoot();
  }
})();
</script>"""
    s=s.replace('<div id="app"></div>','<div id="app"></div>\n'+helper,1)

s=re.sub(r'final-home\.css\?v=\d+','final-home.css?v=40',s)
s=re.sub(r'app\.js\?v=\d+','app.js?v=40',s)

p.write_text(s.rstrip()+"\n")
print("INDEX: BLUE/GOLD + SINGLE WEB SPLASH LOCKED")
PY

# NATIVE ANDROID SPLASH: NO LOGO, SAME BLUE
mkdir -p android/app/src/main/res/drawable
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' | base64 -d \
  > android/app/src/main/res/drawable/splash_transparent.png

python - <<'PY'
from pathlib import Path
import re

p=Path("android/app/src/main/res/values/styles.xml")
s=p.read_text()

s=re.sub(r'(<item name="windowSplashScreenAnimatedIcon">).*?(</item>)',
         r'\1@drawable/splash_transparent\2',s,count=1)
s=re.sub(r'(<item name="windowSplashScreenBackground">).*?(</item>)',
         r'\1#07080C\2',s,count=1)
s=s.replace('@drawable/home_bite_splash','@drawable/splash_transparent')

p.write_text(s.rstrip()+"\n")
print("NATIVE SPLASH: TRANSPARENT ICON + #07080C")
PY

# VALIDATION
node --check public/app.js
git diff --check -- public/index.html public/app.js public/final-home.css android/app/src/main/res/values/styles.xml
grep -q 'hb-boot-splash' public/index.html
grep -q 'final-home.css?v=40' public/index.html
grep -q 'app.js?v=40' public/index.html
grep -q '#07080C' public/final-home.css
grep -q '@drawable/splash_transparent' android/app/src/main/res/values/styles.xml
test -s android/app/src/main/res/drawable/splash_transparent.png

if grep -q 'background:#650000' public/index.html; then
  echo "ERROR: RED BODY BACKGROUND STILL PRESENT"
  exit 1
fi

echo "===== V40 SOURCE VALIDATION: PASS ====="

npx cap copy android
grep -q 'hb-boot-splash' android/app/src/main/assets/public/index.html
grep -q 'final-home.css?v=40' android/app/src/main/assets/public/index.html
grep -q 'app.js?v=40' android/app/src/main/assets/public/index.html
echo "===== V40 ANDROID ASSET VALIDATION: PASS ====="

git add public/index.html public/app.js public/final-home.css \
  android/app/src/main/res/values/styles.xml \
  android/app/src/main/res/drawable/splash_transparent.png

git commit -m "HOME BITE v40 blue gold single splash final"
git push origin main

COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"

gh workflow run android.yml --ref main
sleep 6

RUN="$(gh run list --workflow android.yml --branch main --limit 1 \
  --json databaseId --jq '.[0].databaseId')"
echo "RUN: $RUN"

gh run watch "$RUN" --exit-status

rm -rf "final-apk-$COMMIT"
mkdir -p "final-apk-$COMMIT"

gh run download "$RUN" -n home-bite-debug-apk \
  -D "$HOME/home-bite/final-apk-$COMMIT"

cp "$HOME/home-bite/final-apk-$COMMIT/app-debug.apk" \
  /sdcard/Download/HOME-BITE-FINAL.apk

echo
echo "================================================"
echo " HOME BITE v40 APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-FINAL.apk"
echo "================================================"
