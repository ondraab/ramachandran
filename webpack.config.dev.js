const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    devtool: "inline-source-map",
    entry: "./src/RamachandranComponent.ts",
    mode: "development",
    output: {
        path: path.resolve(__dirname, "./build"),
        filename: "ramachandran-component.js",
        publicPath: '/',
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".html"],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.html?$/, loader: "dom-loader?tag=template!html-loader" },
            { test: /\.css$/, use: [ 'style-loader', 'css-loader' ]}
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: "public" },
            { from: "node_modules/@webcomponents", to: "node_modules/@webcomponents" },
        ]),
    ],
    externals: {
    },
    devServer: {
        // contentBase: path.resolve(__dirname, "./build"),
        compress: true,
        port: 9000,
        historyApiFallback: true,
    },
}