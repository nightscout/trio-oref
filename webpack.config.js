const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const CopyRenameWebpackPlugin = require("copy-rename-webpack-plugin");


module.exports = {
  mode: 'production',
  entry: {
    iob: './lib/iob/index.js',
    meal: './lib/meal/index.js',
    "determineBasal": './lib/determine-basal/determine-basal.js',
    "glucoseGetLast": './lib/glucose-get-last.js',
    "basalSetTemp": './lib/basal-set-temp.js',
    autosens: './lib/determine-basal/autosens.js',
    profile: './lib/profile/index.js',
    "autotunePrep": './lib/autotune-prep/index.js',
    "autotuneCore": './lib/autotune/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'var',
    library: 'freeaps_[name]'
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new CopyRenameWebpackPlugin({
      entry: "determineBasal.js",
      output: [
        "bundle/determine-basal.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "glucoseGetLast.js",
      output: [
        "bundle/glucose-get-last.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "basalSetTemp.js",
      output: [
        "bundle/basal-set-temp.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "iob.js",
      output: [
        "bundle/iob.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "meal.js",
      output: [
        "bundle/meal.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "autosens.js",
      output: [
        "bundle/autosens.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "profile.js",
      output: [
        "bundle/profile.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "autotunePrep.js",
      output: [
        "bundle/autotune-prep.js"
      ],
    }),
    new CopyRenameWebpackPlugin({
      entry: "autotuneCore.js",
      output: [
        "bundle/autotune-core.js"
      ],
    }),
  ],
};
