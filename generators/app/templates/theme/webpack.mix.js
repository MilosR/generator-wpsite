let mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

mix.setPublicPath('./')
    .js('./resources/js/main.js', './')
    .sass('./resources/sass/style.scss', './')
    .sass('./resources/sass/editor-style.scss', './')
    .browserSync({
        // injectChanges: true,
        // notify: false,
        proxy: false,
        host: false,
        files: [
            './*.js',
            './*.css',
            './*.php'
        ]
    })
    .options({
        processCssUrls: false
    })
    .copyDirectory('node_modules/@fortawesome/fontawesome-free/webfonts','fonts/fa')