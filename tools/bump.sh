#!/bin/zsh
# 把 index.html 裡所有 ?v= 的數字一起加一（避免瀏覽器／手機吃舊快取）
cd "$(dirname $0)/.."
v=$(grep -o '?v=[0-9]*' index.html | head -1 | cut -d= -f2); n=$((v + 1))
sed -i '' "s/?v=$v\"/?v=$n\"/g" index.html && echo "v=$n"
