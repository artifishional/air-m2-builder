export default ({input, mode, output, name = `[name]`, debug = false }) => {

    const entry = {
        [ name ]: [ input ],
    };

    if(debug) {
        entry.debug = [ "./debug/" + input ]
    }

    return ({
        devtool: "(none)",
        mode,
        entry,
        externals: { m2: '__M2' },
        output: {
            path: output,
            filename: `[name]/index.js`,
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