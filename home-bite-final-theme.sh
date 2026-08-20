#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/home-bite"

echo "================================================"
echo " HOME BITE — FINAL WARM MAROON THEME"
echo "================================================"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".final-theme-backup-$STAMP"
mkdir -p "$BACKUP"
cp public/final-home.css "$BACKUP/final-home.css"
cp public/index.html "$BACKUP/index.html"
cp public/app.js "$BACKUP/app.js"
cp android/app/src/main/res/values/styles.xml "$BACKUP/styles.xml"
echo "BACKUP: $BACKUP"

python - <<'PY'
from pathlib import Path
import re
p=Path("public/final-home.css")
s=p.read_text()
s=re.sub(r'\n/\* HOME BITE FINAL WARM MAROON THEME START \*/.*?/\* HOME BITE FINAL WARM MAROON THEME END \*/\s*','\n',s,flags=re.S)
theme = """
/* HOME BITE FINAL WARM MAROON THEME START */
:root{
  --hb-cream:#F7F0E3;
  --hb-cream-2:#FFF9EE;
  --hb-maroon:#650F12;
  --hb-maroon-2:#7A1418;
  --hb-maroon-3:#4B080B;
  --hb-gold:#D9A800;
  --hb-gold-bright:#F2C230;
  --hb-text:#3A1718;
  --hb-muted:#6B5550;
  --hb-green:#159447;
}
html,body,#app{
  background:var(--hb-cream)!important;
  color:var(--hb-text)!important;
}
.top{
  background:linear-gradient(135deg,var(--hb-maroon-3),var(--hb-maroon))!important;
  border-bottom:2px solid var(--hb-gold)!important;
  color:#fff!important;
}
.top .brand,.top .brand b,.top .brand small,.hb-hi{color:#fff!important}
.top .brand small{color:var(--hb-gold-bright)!important}
.hb-header-actions .btn,.top .btn{
  background:var(--hb-gold)!important;
  color:var(--hb-maroon-3)!important;
  border-color:var(--hb-gold-bright)!important;
}
.hb-final-page,.hb-reference-home{
  background:var(--hb-cream)!important;
  color:var(--hb-text)!important;
}
.hb-final-location,.hb-reference-home .hb-final-location{color:var(--hb-text)!important}
.hb-final-location b{color:var(--hb-maroon)!important}
.hb-pin{color:var(--hb-maroon)!important}
.hb-live{color:#D51F2A!important}
.hb-final-search,.hb-reference-search{
  background:var(--hb-cream-2)!important;
  border-color:var(--hb-gold)!important;
  color:var(--hb-text)!important;
}
.hb-final-search input,.hb-reference-search input{
  background:transparent!important;color:var(--hb-text)!important;
}
.hb-final-search input::placeholder{color:#8A7770!important}
.hb-search-icon,.hb-search-go,.hb-search-clear{color:var(--hb-maroon)!important}
.hb-final-hero,.hb-reference-hero{
  background:
    radial-gradient(circle at 88% 50%,rgba(242,194,48,.12),transparent 28%),
    linear-gradient(135deg,var(--hb-maroon-3),var(--hb-maroon-2))!important;
  border-color:var(--hb-gold)!important;color:#fff!important;
}
.hb-hero-copy small{color:var(--hb-gold-bright)!important}
.hb-hero-copy h1{color:#fff!important}
.hb-hero-copy h1 em{color:var(--hb-gold-bright)!important}
.hb-hero-copy p{color:#FFF8ED!important}
.hb-hero-dish{color:var(--hb-gold-bright)!important}
.hb-final-cats,.hb-reference-cats{background:transparent!important}
.hb-final-cats button,.hb-reference-cats button{
  background:var(--hb-cream-2)!important;
  color:var(--hb-maroon)!important;
  border-color:var(--hb-gold)!important;
}
.hb-final-cats button span,.hb-reference-cats button span{color:var(--hb-maroon)!important}
.hb-final-cats button.active,.hb-reference-cats button.active{
  background:linear-gradient(135deg,var(--hb-gold-bright),var(--hb-gold))!important;
  color:var(--hb-maroon-3)!important;border-color:var(--hb-gold)!important;
}
.hb-final-cats button.active span{color:var(--hb-maroon-3)!important}
.hb-final-heading,.hb-reference-heading{color:var(--hb-text)!important}
.hb-final-heading small,.hb-reference-heading small{color:var(--hb-maroon)!important}
.hb-final-heading h2,.hb-reference-heading h2{color:var(--hb-text)!important}
.hb-final-heading>span,.hb-reference-heading>span{color:var(--hb-maroon)!important}
.hb-final-card,.hb-reference-card{
  background:var(--hb-cream-2)!important;
  border-color:var(--hb-gold)!important;color:var(--hb-text)!important;
}
.hb-card-body,.hb-card-title,.hb-card-title h3,.hb-address{color:var(--hb-text)!important}
.hb-rating{color:var(--hb-gold)!important}
.hb-food-image{
  background:linear-gradient(145deg,var(--hb-maroon),var(--hb-maroon-3))!important;
  border-color:var(--hb-gold)!important;
}
.hb-food-image span{
  background:rgba(101,15,18,.88)!important;
  color:var(--hb-gold-bright)!important;
}
.hb-open{color:var(--hb-green)!important}
.hb-card-bottom button{
  background:var(--hb-maroon)!important;color:#fff!important;border-color:var(--hb-gold)!important;
}
.hb-card-bottom button span{color:var(--hb-gold-bright)!important}
.hb-final-empty,.hb-reference-empty{
  background:var(--hb-cream-2)!important;
  border-color:var(--hb-gold)!important;color:var(--hb-text)!important;
}
.hb-final-empty h3,.hb-reference-empty h3,.hb-final-empty p,.hb-reference-empty p{
  color:var(--hb-text)!important;
}
.hb-final-benefits{color:var(--hb-text)!important}
.hb-final-benefits b{color:var(--hb-maroon)!important}
.hb-final-benefits small{color:var(--hb-muted)!important}
.hb-final-benefits span{color:var(--hb-gold)!important}
.hb-final-nav,.hb-reference-nav{
  background:var(--hb-cream-2)!important;border-color:var(--hb-gold)!important;
}
.hb-final-nav button{background:transparent!important;color:var(--hb-maroon)!important}
.hb-final-nav button span,.hb-final-nav button b{color:inherit!important}
.hb-final-nav button.selected{
  background:var(--hb-maroon)!important;color:var(--hb-gold-bright)!important;
}
.hb-final-nav button.selected span,.hb-final-nav button.selected b{color:var(--hb-gold-bright)!important}
.hb-final-role-actions button{
  background:var(--hb-maroon)!important;color:#fff!important;border-color:var(--hb-gold)!important;
}
/* Preserve v39 launch structure; palette only. */
#hb-boot-splash{background:var(--hb-maroon)!important}
.hb-boot-title b,.hb-boot-city,.hb-boot-loading{color:var(--hb-gold-bright)!important}
/* HOME BITE FINAL WARM MAROON THEME END */
"""
p.write_text(s.rstrip()+theme+"\n")
print("THEME: FINAL WARM MAROON/CREAM/GOLD OVERRIDES WRITTEN")
PY

grep -q 'hb-boot-splash' public/index.html
grep -q 'app.js?v=39' public/index.html
grep -q 'final-home.css?v=39' public/index.html
grep -q 'HOME BITE FINAL WARM MAROON THEME START' public/final-home.css

node --check public/app.js
git diff --check -- public/final-home.css public/index.html public/app.js android/app/src/main/res/values/styles.xml
echo "===== SOURCE VALIDATION: PASS ====="

npx cap copy android

grep -q 'hb-boot-splash' android/app/src/main/assets/public/index.html
grep -q 'app.js?v=39' android/app/src/main/assets/public/index.html
grep -q 'HOME BITE FINAL WARM MAROON THEME START' android/app/src/main/assets/public/final-home.css
echo "===== ANDROID ASSET VALIDATION: PASS ====="

git add public/final-home.css public/index.html public/app.js android/app/src/main/res/values/styles.xml
if git diff --cached --quiet; then
  echo "NO NEW SOURCE CHANGES — NOTHING TO COMMIT"
else
  git commit -m "HOME BITE final warm maroon cream gold theme"
  git push origin main
fi

COMMIT="$(git rev-parse --short HEAD)"
echo "COMMIT: $COMMIT"
echo "===== STARTING ONE FINAL APK BUILD ====="

gh workflow run android.yml --ref main
sleep 6
RUN="$(gh run list --workflow android.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
echo "RUN: $RUN"
gh run watch "$RUN" --exit-status

rm -rf "final-apk-$COMMIT"
mkdir -p "final-apk-$COMMIT"
gh run download "$RUN" -n home-bite-debug-apk -D "$HOME/home-bite/final-apk-$COMMIT"
cp "$HOME/home-bite/final-apk-$COMMIT/app-debug.apk" /sdcard/Download/HOME-BITE-FINAL.apk

echo
echo "================================================"
echo " HOME BITE FINAL THEME APK READY"
echo "================================================"
ls -lh /sdcard/Download/HOME-BITE-FINAL.apk
echo "COMMIT: $COMMIT"
echo "RUN:    $RUN"
echo "FILE:   /sdcard/Download/HOME-BITE-FINAL.apk"
echo "================================================"
