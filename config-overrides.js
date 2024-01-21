const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const NAMESPACE = 'transactory';

module.exports = function override(config, _env) {
  if (config.mode !== 'production') return config;

  // https://github.com/facebook/create-react-app/discussions/11194
  config.output.filename = `static/${NAMESPACE}/js/[name].[contenthash:8].js`;
  config.output.chunkFilename = `static/${NAMESPACE}/js/[name].[contenthash:8].chunk.js`;
  config.output.assetModuleFilename = `static/${NAMESPACE}/media/[name].[hash][ext]`;
  config.plugins.forEach((plugin) => {
    if (!(plugin instanceof MiniCssExtractPlugin)) return;
    plugin.options.filename = `static/${NAMESPACE}/css/[name].[contenthash:8].css`;
    plugin.options.chunkFilename = `static/${NAMESPACE}/css/[name].[contenthash:8].chunk.css`;
  });

  // Make sure that webpack uses the correct relative paths for fonts
  config.module.rules.push({
    test: /\.(otf|ttf|woff2?)/,
    type: 'asset/resource',
    generator: {
      publicPath: '../',
    },
  });

  // Make sure that webpack sets the source code path for source maps properly
  config.devtool = false;
  config.plugins.push(new webpack.SourceMapDevToolPlugin({
    append: '\n//# sourceMappingURL=[url]',
    filename: '[file].map[query]',
    namespace: NAMESPACE,
  }));

  // Create a separate runtime chunk instead of prepending runtime to every entry chunk
  config.optimization.runtimeChunk = 'single';

  // Make sure at most one of vendor code, utils and application code are in any given chunk
  config.optimization.splitChunks = {
    chunks: 'all',
    minSize: 0,
    maxSize: 262143,
    cacheGroups: {
      vendors: false,
      default: {
        priority: -20,
        reuseExistingChunk: true,
      },
      defaultVendors: {
        test: /^(?=.*[\\/]node_modules[\\/])/,
        priority: -10,
      },
      utils: {
        test: /^(?!.*[\\/]node_modules[\\/]).*[\\/]utils[\\/]/,
      },
    },
  };

  return config;
}
