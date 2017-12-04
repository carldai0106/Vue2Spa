const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const bundleOutputDir = './wwwroot/dist';

function cssLoaders(options) {
    options = options || {}

    const cssLoader = {
        loader: 'css-loader',
        options: {
            // minimize: process.env.NODE_ENV === 'production',
            minimize: options.sourceMap,
            sourceMap: options.sourceMap
        }
    }

    // generate loader string to be used with extract text plugin
    function generateLoaders(loader, loaderOptions) {
        const loaders = [cssLoader];
        if (loader) {
            loaders.push({
                loader: loader + '-loader',
                options: Object.assign({},
                    loaderOptions,
                    {
                        sourceMap: options.sourceMap
                    })
            });
        }

        // Extract CSS when that option is specified
        // (which is the case during production build)
        if (options.extract) {
            return ExtractTextPlugin.extract({
                use: loaders,
                fallback: 'vue-style-loader'
            });
        } else {
            return ['vue-style-loader'].concat(loaders);
        }
    }

    // https://vue-loader.vuejs.org/en/configurations/extract-css.html
    return {
        css: generateLoaders(),
        postcss: generateLoaders(),
        less: generateLoaders('less'),
        sass: generateLoaders('sass', { indentedSyntax: true }),
        scss: generateLoaders('sass')
        // ,
        // stylus: generateLoaders('stylus'),
        // styl: generateLoaders('stylus')
    }
}

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);
    return [{
        stats: { modules: false },
        entry: { 'main': './ClientApp/boot-app.js' },
        resolve: {
            extensions: ['.js', '.vue'],
            alias: {
                'vue$': 'vue/dist/vue',
                'components': path.resolve(__dirname, './ClientApp/components'),
                'views': path.resolve(__dirname, './ClientApp/views'),
                'utils': path.resolve(__dirname, './ClientApp/utils'),
                'api': path.resolve(__dirname, './ClientApp/store/api')
            }
        },
        output: {
            path: path.join(__dirname, bundleOutputDir),
            filename: '[name].js',
            publicPath: '/dist/'
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    include: /ClientApp/,
                    // use: 'vue-loader',
                    loader: 'vue-loader',
                    options: {
                        loaders: cssLoaders({
                            sourceMap: !isDevBuild
                                ? true
                                : false,
                            extract: !isDevBuild
                        })
                    }
                },
                { test: /\.js$/, include: /ClientApp/, use: 'babel-loader' },
                { test: /\.css$/, use: isDevBuild ? ['style-loader', 'css-loader'] : ExtractTextPlugin.extract({ use: 'css-loader' }) },
                { test: /\.(png|jpg|jpeg|gif|svg)$/, use: 'url-loader?limit=25000' }
            ]
        },
        plugins: [
            new webpack.DllReferencePlugin({
                context: __dirname,
                manifest: require('./wwwroot/dist/vendor-manifest.json')
            })
        ].concat(isDevBuild ? [
            // Plugins that apply in development builds only
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map', // Remove this line if you prefer inline source maps
                moduleFilenameTemplate: path.relative(bundleOutputDir, '[resourcePath]') // Point sourcemap entries to the original file locations on disk
            })
        ] : [
                // Plugins that apply in production builds only
                new webpack.optimize.UglifyJsPlugin(),
                new ExtractTextPlugin('site.css')
            ])
    }];
};
