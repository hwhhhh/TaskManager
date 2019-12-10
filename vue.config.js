module.exports = {
    devServer: {
        open: true,
        port: 8080,
        proxy: {
            '/apis': {
                target: 'http://localhost:8088/apis/',  // target host
                ws: true,  // proxy websockets 
                changeOrigin: true,  // needed for virtual hosted sites
                pathRewrite: {
                    '^/apis': ''  // rewrite path
                }
            },
            
        }
    } 
}
