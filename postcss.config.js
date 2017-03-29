// const precss = require('precss');
const autoprefixer = require('autoprefixer');
module.exports = {
    plugins: [
        // precss({ /* ...options */ }),
        autoprefixer({ browsers: [
            'ie >= 9', 'firefox >= 28', 'chrome >= 21'
        ] })
    ]
}