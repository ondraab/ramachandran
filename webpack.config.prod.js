const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    devtool: "inline-source-map",
    entry: "./src/RamaComponent.ts",
    mode: "production",
    output: {
        path: path.resolve(__dirname, "./build"),
        filename: "bundle.js",
        publicPath: '/',
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".html", ".css"],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.html/, loader: "html-loader" },
            { test: /\.css$/, loader:[ 'style-loader', 'css-loader' ]}
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: "public" },
            { from: "node_modules/@webcomponents", to: "node_modules/@webcomponents" },
        ]),
        new UglifyJsPlugin({
            extractComments: true,
            uglifyOptions: {
                ecma: 6,
                keep_fnames: true,
            },
        }),
    ],
    externals: {
    },
    devServer: {
        contentBase: path.resolve(__dirname, "./build"),
        compress: true,
        port: 9000,
        historyApiFallback: true,
    },
}