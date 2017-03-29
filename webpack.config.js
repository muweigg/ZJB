const { resolve } = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');

const env = 'development';

module.exports = {
    
    entry: {
        "tml.contractGenerator": resolve(__dirname, 'src/plugin/main.js'),
        // "index": resolve(__dirname, 'src/index.js')
    },
    output: {
        path: resolve(__dirname, 'dist'),
        filename: '[name].js'
    },

    // 内联 map 用于测试
    // devtool: 'cheap-module-eval-source-map',
    // devtool: 'inline-source-map',

    resolve: {
        extensions: ['.vue', '.js', '.json'],
        modules: [resolve(__dirname, 'src'), resolve(__dirname, 'node_modules')],
        alias: {
            'vue$': 'vue/dist/vue.min.js'
        }
    },

    devServer: {
        port: 3000,
        host: 'localhost',
        hot: true,
        // historyApiFallback: true,
        compress: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    },

    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    // 'style-loader?singleton',
                    'style-loader',
                    'raw-loader',
                    // 'css-loader',
                    'postcss-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'vue-loader',
                    options: {
                        loaders: {
                            sass: 'style-loader!raw-loader!postcss-loader!sass-loader'
                        }
                    }
                }]
            },
            {
                test: /\.json$/,
                use: ['json-loader']
            },
            {
                test: /\.html$/,
                use: ['raw-loader'],
                exclude: resolve(__dirname, 'src/index.html')
            },
            {
                test: /\.(eot|svg|ttf|woff2?)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 1000,
                        name: '[path][name].[ext]'
                    }
                }]
            },
            {
                test: /\.(png|gif|jpe?g)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 1000,
                        name: '[path][name].[ext]'
                    }
                }]
            }
        ]
    },

    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            'ENV': JSON.stringify(env),
            'HMR': true,
            'process.env': {
                'ENV': JSON.stringify(env),
                'NODE_ENV': JSON.stringify(env),
                'HMR': true,
            }
        }),
        new CleanPlugin(['dist']),
        new AssetsPlugin({
            path: resolve(__dirname, 'dist'),
            filename: 'webpack-assets.json',
            prettyPrint: true
        }),
        new CopyPlugin([
            {
                from: 'src/assets',
                to: 'assets',
                ignore: ['favicon.ico']
            },
            { from:'jquery-3.1.1.min.js' },
            { from:'data.json' },
            { from:'src/index.js' }
        ]),
        new HtmlPlugin({
            template: './src/index.html',
            // favicon: './src/assets/favicon.ico',
            inject: true,
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin()
    ],

};
