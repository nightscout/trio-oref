#!/bin/bash

# perform webpack on the nine .js files:
#
# ./lib/iob/index.js
# ./lib/meal/index.js
# ./lib/determine-basal/determine-basal.js
# ./lib/glucose-get-last.js
# ./lib/basal-set-temp.js
# ./lib/determine-basal/autosens.js
# ./lib/profile/index.js
# ./lib/autotune-prep/index.js
# ./lib/autotune/index.js

npx webpack

#
#  --- Copy and rename oref0/dist .js files to FreeAPS/Resources/javascript/bundle ---
#
# Launch this script by typing /bin/bash cpJS.sh
#
# or with rexcutable permission: ./cpJS.sh
#
# modify permission by typing chmod a+x cpJS.sh
#
# change directory variables as needed:
oref0DIR=./
apsDIR=../iAPS


bundleDIR=$apsDIR/FreeAPS/Resources/javascript/bundle

cp -p -v $oref0DIR/dist/autosens.js $bundleDIR/
cp -p -v $oref0DIR/dist/autotuneCore.js $bundleDIR/autotune-core.js
cp -p -v $oref0DIR/dist/autotunePrep.js $bundleDIR/autotune-prep.js
cp -p -v $oref0DIR/dist/basalSetTemp.js $bundleDIR/basal-set-temp.js
cp -p -v $oref0DIR/dist/determineBasal.js $bundleDIR/determine-basal.js
cp -p -v $oref0DIR/dist/glucoseGetLast.js $bundleDIR/glucose-get-last.js
cp -p -v $oref0DIR/dist/iob.js $bundleDIR/
cp -p -v $oref0DIR/dist/meal.js $bundleDIR/
cp -p -v $oref0DIR/dist/profile.js $bundleDIR/

echo ""
echo "copying oref0/lib/ source files to iAPS root"
echo ""
echo ""

cp -p -R $oref0DIR/lib $apsDIR/oref0/lib

# Retrieves version, branch, and tag information from Git
git_version=$(git log -1 --format="%h" --abbrev=7)
git_branch=$(git symbolic-ref --short -q HEAD)
git_tag=$(git describe --tags --exact-match 2>/dev/null)

# Determines branch or tag information
git_branch_or_tag="${git_branch:-${git_tag}}"
git_branch_or_tag_version="${git_branch_or_tag} - git version: ${git_version}"

echo "oref0 branch: ${git_branch_or_tag_version}" > $apsDIR/oref0_source_version.txt

exit
