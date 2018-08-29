export default ({input, mode, output, name = `[name]`}) => {
    return ({
        devtool: "(none)",
        mode,
        entry: {
            'index': [input]
        },
        externals: { m2: 'M2' },
        output: {
            path: output,
            filename: `${name}.js`,
            library: "m2unit",
            libraryTarget: "this"
        },/*
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/, /\.loader$/],
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },*/
    })
}