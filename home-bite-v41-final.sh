#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$HOME/home-bite"

echo "================================================"
echo " HOME BITE v41 — V39 BASE + BLUE/GOLD FINAL"
echo "================================================"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-v41-backup-$STAMP"
mkdir -p "$BACKUP"
for f in public/index.html public/app.js public/final-home.css android/app/src/main/res/values/styles.xml; do
  [ -f "$f" ] && cp "$f" "$BACKUP/" || true
done
echo "BACKUP: $BACKUP"

V39="c236894"
git cat-file -e "$V39^{commit}" 2>/dev/null || {
  echo "ERROR: V39 commit $V39 not found in local git history."
  exit 1
}

git checkout "$V39" -- \
  public/index.html \
  public/app.js \
  public/final-home.css \
  android/app/src/main/res/values/styles.xml
rm -f android/app/src/main/res/drawable/splash_transparent.png
echo "BASE: V39 c236894 RESTORED"

python - <<'PY'
from pathlib import Path

p = Path("public/final-home.css")
s = p.read_text()

for marker in [
    "HOME BITE FINAL WARM MAROON THEME START",
    "HOME BITE v40 BLUE/GOLD",
    "HOME BITE v40 BLUE/GOLD SINGLE-SPLASH",
]:
    pos = s.find(marker)
    if pos >= 0:
        s = s[:pos].rstrip() + "\n"

repls = {
    "#650000": "#070B14",
    "#800000": "#0B1322",
    "#8B0000": "#0B1322",
    "#900000": "#0B1322",
    "#A00000": "#0B1322",
    "#B00000": "#0B1322",
    "#C00000": "#101A2B",
    "#D00000": "#101A2B",
    "#F8F0E3": "#070B14",
    "#FFF8EA": "#0B1322",
    "#FFF7E8": "#0B1322",
    "#FAF0E0": "#070B14",
    "#FDF5E6": "#070B14",
    "#FFD000": "#F5B800",
}
for a,b in repls.items():
    s = s.replace(a,b)

theme = """
/* HOME BITE v41 — CLEAN BLUE / GOLD THEME */
:root{
  --hb-bg:#070B14;
  --hb-surface:#0B1322;
  --hb-surface-2:#101A2B;
  --hb-gold:#F5B800;
  --hb-gold-bright:#FFC928;
  --hb-white:#F7F8FA;
  --hb-muted:#B8C0CC;
  --hb-green:#20D66B;
  --hb-red:#FF3B30;
}
html,body,#app{
  background:var(--hb-bg)!important;
  color:var(--hb-white)!important;
}
body{
  background:
    radial-gradient(circle at 50% 0%,rgba(22,48,82,.30),transparent 38%),
    var(--hb-bg)!important;
}
input,.search,.search-box,.searchbar{
  background:#070B14!important;
  color:var(--hb-white)!important;
  border-color:var(--hb-gold)!important;
}
input::placeholder{color:#9CA6B5!important}
button{border-color:var(--hb-gold)!important}
.hero,.banner,.hero-card{
  background:
    radial-gradient(circle at 78% 50%,rgba(27,66,110,.48),transparent 40%),
    linear-gradient(135deg,#08101D,#10223A)!important;
  border-color:var(--hb-gold)!important;
}
.category,.category-card,.filter,.tab,.option,.restaurant-tab,.home-food-tab{
  background:#0B1322!important;
  color:var(--hb-white)!important;
  border-color:var(--hb-gold)!important;
}
.category.active,.category-card.active,.filter.active,.tab.active,.option.active{
  background:linear-gradient(180deg,#FFC928,#E9A900)!important;
  color:#070B14!important;
  border-color:#FFC928!important;
}
.card,.restaurant-card,.shop-card,.menu-card,.food-card{
  background:linear-gradient(145deg,#0B1322,#070B14)!important;
  color:var(--hb-white)!important;
  border-color:var(--hb-gold)!important;
}
h1,h2,h3,h4,.section-title,.title{color:var(--hb-white)!important}
.muted,.subtitle,.location,.description{color:var(--hb-muted)!important}
.gold,.price,.rating,.view-all,.accent{color:var(--hb-gold-bright)!important}
.bottom-nav,.bottom-navigation,nav.bottom,.app-bottom-nav{
  background:linear-gradient(180deg,#0B1322,#070B14)!important;
  border-color:var(--hb-gold)!important;
}
.bottom-nav .active,.bottom-navigation .active,nav.bottom .active,.app-bottom-nav .active{
  background:linear-gradient(180deg,#FFC928,#E9A900)!important;
  color:#070B14!important;
  border-color:#FFC928!important;
}
.icon,.category-icon,.action-icon{
  color:var(--hb-gold-bright)!important;
  opacity:1!important;
}
.restaurant-card .open,.shop-card .open{color:var(--hb-green)!important}
"""
p.write_text(s.rstrip() + "\n" + theme + "\n")
print("THEME: V41 CLEAN BLUE/GOLD")
PY

python - <<'PY'
from pathlib import Path
import re

p=Path("public/index.html")
s=p.read_text()
head=re.search(r"<head\b.*?</head>",s,re.I|re.S)
if not head:
    raise SystemExit("HEAD NOT FOUND")

h=head.group(0)
h=re.sub(r'<link[^>]+final-home\.css[^>]*>\s*',"",h,flags=re.I)
h=re.sub(r'<link[^>]+home-bite-app-icon\.png[^>]*>\s*',"",h,flags=re.I)
h=h.replace(
    "</head>",
    '<link rel="preload" as="image" href="home-bite-app-icon.png">\n'
    '<link rel="stylesheet" href="final-home.css?v=41">\n'
    "</head>", 1
)

body="""<body style="margin:0;background:#070B14;">
<div id="hb-boot-splash">
  <div class="hb-boot-inner">
    <img src="home-bite-app-icon.png" alt="HOME BITE">
  </div>
</div>
<div id="app"></div>
<script>
(function(){
  function finish(){
    var b=document.getElementById("hb-boot-splash");
    var a=document.getElementById("app");
    if(!b||!a)return;
    if(a.children.length){
      b.style.opacity="0";
      b.style.transition="opacity 100ms linear";
      setTimeout(function(){
        if(b.parentNode)b.parentNode.removeChild(b);
      },110);
    }else{
      requestAnimationFrame(finish);
    }
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",finish,{once:true});
  }else{
    finish();
  }
})();
</script>
<script defer src="app.js?v=41"></script>
</body>"""

s=s[:head.start()]+h+"\n"+body+"\n</html>\n"
p.write_text(s)
print("INDEX: V41 SINGLE WEB SPLASH")
PY

cat >> public/final-home.css <<'CSS'

/* V41 single launch surface */
#hb-boot-splash{
  position:fixed!important;
  inset:0!important;
  z-index:2147483647!important;
  width:100%!important;
  height:100dvh!important;
  min-height:100vh!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:#070B14!important;
  opacity:1;
}
#hb-boot-splash .hb-boot-inner{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
}
#hb-boot-splash img{
  width:min(220px,52vw)!important;
  height:min(220px,52vw)!important;
  object-fit:contain!important;
  display:block!important;
  border-radius:50%!important;
}
CSS

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
    r'\1@drawable/splash_transparent\2',
    s, count=1
)
p.write_text(s.rstrip()+"\n")
print("NATIVE SPLASH: BLUE #070B14 + SINGLE DRAWABLE")
PY

python - <<'PY'
from pathlib import Path
import shutil

src=Path("public/home-bite-app-icon.png")
if not src.exists():
    raise SystemExit("ERROR: public/home-bite-app-icon.png not found")
try:
    from PIL import Image
except Exception:
    raise SystemExit("ERROR: Pillow is required. Run: pip install pillow")

img=Image.open(src).convert("RGBA")
side=max(img.size)
canvas=Image.new("RGBA",(side,side),(7,11,20,255))
img.thumbnail((int(side*.90),int(side*.90)),Image.LANCZOS)
canvas.alpha_composite(img,((side-img.width)//2,(side-img.height)//2))

out=Path("public/home-bite-app-icon-v41.png")
canvas.save(out,optimize=True)
shutil.copy2(out, src)

for f in Path("android/app/src/main/res").rglob("*.png"):
    if f.name.lower() in {
        "home-bite-app-icon.png",
        "ic_launcher.png",
        "ic_launcher_foreground.png",
        "ic_launcher_round.png",
    }:
        try:
            shutil.copy2(out,f)
            print("ICON UPDATED:",f)
        except Exception:
            pass
print("ICON: BLUE/DARK BACKGROUND GENERATED")
PY

node --check public/app.js
git diff --check -- \
  public/index.html public/app.js public/final-home.css \
  android/app/src/main/res/values/styles.xml

grep -q 'final-home.css?v=41' public/index.html
grep -q 'app.js?v=41' public/index.html
grep -q 'hb-boot-splash' public/index.html
grep -q '#070B14' public/index.html
grep -q '#070B14' public/final-home.css
grep -q '#070B14' android/app/src/main/res/values/styles.xml
grep -q '@drawable/splash_transparent' android/app/src/main/res/values/styles.xml
test ! -e android/app/src/main/res/drawable/splash_transparent.png
test -e android/app/src/main/res/drawable/splash_transparent.xml

echo "===== V41 SOURCE VALIDATION: PASS ====="
echo "BLUE/GOLD THEME: 1"
echo "OLD SPLASH PNG: 0"
echo "DUPLICATE SPLASH: 0"

npx cap copy android

grep -q 'final-home.css?v=41' android/app/src/main/assets/public/index.html
grep -q 'app.js?v=41' android/app/src/main/assets/public/index.html
grep -q 'hb-boot-splash' android/app/src/main/assets/public/index.html
echo "===== V41 ANDROID ASSET VALIDATION: PASS ====="

git add \
  public/index.html public/app.js public/final-home.css \
  public/home-bite-app-icon.png public/home-bite-app-icon-v41.png \
  android/app/src/main/res android/app/src/main/assets/public

git commit -m "HOME BITE v41 clean V39 base blue gold final"
git push origin main

COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"

gh workflow run android.yml --ref main
sleep 6
RUN="$(gh run list --workflow android.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
echo "RUN: $RUN"
gh run watch "$RUN" --exit-status

rm -rf "final-apk-$COMMIT"
mkdir -p "final-apk-$COMMIT"
gh run download "$RUN" -n home-bite-debug-apk -D "$HOME/home-bite/final-apk-$COMMIT"

cp "$HOME/home-bite/final-apk-$COMMIT/app-debug.apk" \
  /sdcard/Download/HOME-BITE-V41-FINAL.apk

echo "================================================"
echo " HOME BITE v41 FINAL APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-V41-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-V41-FINAL.apk"
echo "================================================"
