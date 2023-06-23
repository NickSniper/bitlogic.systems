/*

=========================================================
* Pixel Pro Bootstrap 5 UI Kit
=========================================================

* Product Page: https://themesberg.com/product/ui-kit/pixel-pro-premium-bootstrap-5-ui-kit
* Copyright 2021 Themesberg (https://www.themesberg.com)

* Coded by https://themesberg.com

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. Contact us if you want to remove it.

*/

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var cleanCss = require('gulp-clean-css');
var del = require('del');
const htmlmin = require('gulp-htmlmin');
const cssbeautify = require('gulp-cssbeautify');
var gulp = require('gulp');
const npmDist = require('gulp-npm-dist');
var sass = require('gulp-sass')(require('node-sass'));
var wait = require('gulp-wait');
var sourcemaps = require('gulp-sourcemaps');
var fileinclude = require('gulp-file-include');

// Nick improvements
var cached = require('gulp-cached');
// import imagemin from 'gulp-imagemin';
var imagemin = require('gulp-imagemin');
// var sharpResponsive = require("gulp-sharp-responsive");

// Define paths

const paths = {
    dist: {
        base: './dist/',
        css: './dist/css',
        html: './dist/html',
        assets: './dist/assets',
        img: './dist/assets/img',
        vendor: './dist/vendor'
    },
    dev: {
        base: './html&css/',
        css: './html&css/css',
        html: './html&css/html',
        assets: './html&css/assets',
        img: './html&css/assets/img',
        vendor: './html&css/vendor'
    },
    base: {
        base: './',
        node: './node_modules'
    },
    src: {
        base: './src/',
        css: './src/css',
        html: './src/html/**/*.html',
        assets: './src/assets/**/*.*',
        img: './src/assets/img/**/*.+(jpeg|jpg|png|gif|svg)',
        partials: './src/partials/**/*.html',
        scss: './src/scss',
        node_modules: './node_modules/',
        vendor: './vendor'
    },
    temp: {
        base: './.temp/',
        css: './.temp/css',
        html: './.temp/html',
        assets: './.temp/assets',
        img: './.temp/assets/img',
        vendor: './.temp/vendor'
    }
};

// Compile SCSS
gulp.task('scss', function () {
    return gulp.src([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/pixel/**/*.scss', paths.src.scss + '/pixel.scss'])
        .pipe(wait(500))
        .pipe(sourcemaps.init())
        .pipe(cached('sass'))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.temp.css))
        .pipe(browserSync.stream());
});

gulp.task('index', function () {
    return gulp.src([paths.src.base + '*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'development'
            }
        }))
        .pipe(cached('index'))
        .pipe(gulp.dest(paths.temp.base))
        .pipe(browserSync.stream());
});

gulp.task('html', function () {
    return gulp.src([paths.src.html])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'development'
            }
        }))
        .pipe(cached('html'))
        .pipe(gulp.dest(paths.temp.html))
        .pipe(browserSync.stream());
});

gulp.task('assets', function () {
    return gulp.src([paths.src.assets])
        .pipe(cached('assets'))
        .pipe(gulp.dest(paths.temp.assets))
        .pipe(browserSync.stream());
});

// gulp.task('images', function () {
//     return gulp.src([paths.src.img])
//         .pipe(cached('images'))
//         .pipe(gulp.dest(paths.temp.img));
// });

// gulp.task('images', function () {
//     return gulp.src([paths.src.img])
//         .pipe(cached('images'))
//         .pipe(sharpResponsive({
//             includeOriginalFile: true,
//             formats: [
//                 { width: 640, rename: { suffix: "-sm" } },
//                 { width: 768, rename: { suffix: "-md" } },
//                 { width: 1024, rename: { suffix: "-lg" } },
//                 { width: 1080, rename: { suffix: "-xl" } },
//             ]
//         }))
//         .pipe(gulp.dest(paths.temp.img));
// });

gulp.task('vendor', function () {
    return gulp.src(npmDist(), { base: paths.src.node_modules })
        .pipe(cached('vendor'))
        .pipe(gulp.dest(paths.temp.vendor));
});

gulp.task('serve', gulp.series('scss', 'html', 'index', 'assets', 'vendor', function () {
    browserSync.init({
        server: paths.temp.base
    });

    gulp.watch([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/pixel/**/*.scss', paths.src.scss + '/pixel.scss'], gulp.series('scss'));
    gulp.watch([paths.src.html, paths.src.base + '*.html', paths.src.partials], gulp.series('html', 'index'));
    gulp.watch([paths.src.assets], gulp.series('assets'));
    // gulp.watch([paths.src.assets], gulp.series('images'));
    gulp.watch([paths.src.vendor], gulp.series('vendor'));
}));

// Beautify CSS
gulp.task('beautify:css', function () {
    return gulp.src([
        paths.dev.css + '/pixel.css'
    ])
        .pipe(cssbeautify())
        .pipe(gulp.dest(paths.dev.css))
});

// Minify CSS
gulp.task('minify:css', function () {
    return gulp.src([
        paths.dist.css + '/pixel.css'
    ])
        .pipe(cleanCss())
        .pipe(gulp.dest(paths.dist.css))
});

// Minify Html
gulp.task('minify:html', function () {
    return gulp.src([paths.dist.html + '/**/*.html'])
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'production'
            }
        }))
        .pipe(gulp.dest(paths.dist.html))
});

gulp.task('minify:html:index', function () {
    return gulp.src([paths.dist.base + '*.html'])
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'production'
            }
        }))
        .pipe(gulp.dest(paths.dist.base))
});

// Clean
gulp.task('clean:dist', function () {
    return del([paths.dist.base]);
});

gulp.task('clean:dev', function () {
    cache.caches = {};
    return del([paths.dev.base]);
});

// Compile and copy scss/css
gulp.task('copy:dist:css', function () {
    return gulp.src([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/pixel/**/*.scss', paths.src.scss + '/pixel.scss'])
        .pipe(wait(500))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist.css))
});

gulp.task('copy:dev:css', function () {
    return gulp.src([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/pixel/**/*.scss', paths.src.scss + '/pixel.scss'])
        .pipe(wait(500))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dev.css))
});

// Copy Html
gulp.task('copy:dist:html', function () {
    return gulp.src([paths.src.html])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'production'
            }
        }))
        .pipe(gulp.dest(paths.dist.html));
});

gulp.task('copy:dev:html', function () {
    return gulp.src([paths.src.html])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'development'
            }
        }))
        .pipe(gulp.dest(paths.dev.html));
});

// Copy index
gulp.task('copy:dist:html:index', function () {
    return gulp.src([paths.src.base + '*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'production'
            }
        }))
        .pipe(gulp.dest(paths.dist.base))
});

gulp.task('copy:dev:html:index', function () {
    return gulp.src([paths.src.base + '*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/partials/',
            context: {
                environment: 'development'
            }
        }))
        .pipe(gulp.dest(paths.dev.base))
});

// Copy assets
gulp.task('copy:dist:assets', function () {
    return gulp.src(paths.src.assets)
        .pipe(gulp.dest(paths.dist.assets))
});

gulp.task('copy:dev:assets', function () {
    return gulp.src(paths.src.assets)
        .pipe(gulp.dest(paths.dev.assets))
});

gulp.task('copy:dist:image', function () {
    return gulp.src(paths.src.img)
        .pipe(gulp.dest(paths.dist.img))
});

gulp.task('compress:dist:image', function () {
    return gulp.src([paths.src.img])
        .pipe(imagemin(/*{ verbose: true }*/))
        .pipe(gulp.dest(paths.dist.img));
});


gulp.task('copy:dev:image', function () {
    return gulp.src(paths.src.img)
        .pipe(gulp.dest(paths.dev.img))
});

// Copy node_modules to vendor
gulp.task('copy:dist:vendor', function () {
    return gulp.src(npmDist(), { base: paths.src.node_modules })
        .pipe(gulp.dest(paths.dist.vendor));
});

gulp.task('copy:dev:vendor', function () {
    return gulp.src(npmDist(), { base: paths.src.node_modules })
        .pipe(gulp.dest(paths.dev.vendor));
});


gulp.task('build:dev', gulp.series('clean:dev', 'copy:dev:css', 'copy:dev:html', 'copy:dev:html:index', 'copy:dev:assets', 'beautify:css', 'copy:dev:vendor'));
gulp.task('build:dist', gulp.series('clean:dist', 'copy:dist:css', 'copy:dist:html', 'copy:dist:html:index', 'copy:dist:assets', 'compress:dist:image', 'minify:css', 'minify:html', 'minify:html:index', 'copy:dist:vendor'));

// Default
gulp.task('default', gulp.series('serve'));