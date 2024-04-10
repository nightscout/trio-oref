#!/bin/bash

# Launch this script by typing /bin/bash webpack-cp.sh
#
# or with rexcutable permission: ./webpack-cp.sh
#
# modify permission by typing chmod a+x webpack-cp.sh
#
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
# change directory variables as needed:
oref0DIR=./
apsDIR=../Open-iAPS


bundleDIR=$apsDIR/FreeAPS/Resources/javascript/bundle

cp -p -v $oref0DIR/dist/bundle/*.js $bundleDIR/

echo ""
echo "copying /lib/ source files to Open-iAPS/open-iaps-oref"
echo ""
echo ""

cp -p -R $oref0DIR/lib $apsDIR/open-iaps-oref/
echo "These source files are copied from open-iaps-oref, and are for information purposes only." > $apsDIR/open-iaps-oref/oref_source_file_info.txt
echo "The algorithm is run based on minimised files in FreeAPS/Resources/javascript/bundle." >> $apsDIR/open-iaps-oref/oref_source_file_info.txt

# Retrieves version, branch, and tag information from Git
git_version=$(git log -1 --format="%h" --abbrev=7)
git_branch=$(git symbolic-ref --short -q HEAD)
git_tag=$(git describe --tags --exact-match 2>/dev/null)

# Determines branch or tag information
git_branch_or_tag="${git_branch:-${git_tag}}"
git_branch_or_tag_version="${git_branch_or_tag} - git version: ${git_version}"

echo "oref0 branch: ${git_branch_or_tag_version}" > $apsDIR/oref0_source_version.txt
echo "" >> $apsDIR/oref0_source_version.txt
echo "Last commits:" >> $apsDIR/oref0_source_version.txt
git log --since=2024-01-01 --oneline --abbrev=7 >> $apsDIR/oref0_source_version.txt

exit
