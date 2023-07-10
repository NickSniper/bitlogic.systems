// Copyright © 2011-2023 bitLogic.systems 

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

const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
var spawn = require('child_process').spawn;


// Nick improvements
var cached = require('gulp-cached');
// var imagemin = require('gulp-imagemin');
const gulpif = require('gulp-if');
var sharpResponsive = require("gulp-sharp-responsive");

// Define paths
const ImagesExtensions = /\.(jpeg|jpg|png|gif|webp|avif|heif|tiff?g)$/i;
// const includedExtensions = /\.(jpeg|jpg|png|gif|webp|avif|heif|tiff?g)$/i;
const paths = {
    dist: {
        base: './dist/',
        css: './dist/css',
        js: './dist/js',
        html: './dist/html',
        assets: './dist/assets',
        vendor: './dist/vendor'
    },
    src: {
        base: './src/',
        css: './src/css',
        html: './src/html/**/*.html',
        assets: './src/assets/**/*.*',
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
        vendor: './.temp/vendor'
    }
};

gulp.task('clean', function () {
    return del([paths.temp.base]);
});

// Compile SCSS
gulp.task('scss', function () {
    return gulp.src([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/main/**/*.scss', paths.src.scss + '/main.scss'])
        .pipe(wait(500))
        .pipe(sourcemaps.init())
        // .pipe(cached('sass'))
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
        // .pipe(cached('index'))
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

// gulp.task('assets', function () {
//     return gulp.src([paths.src.assets])
//         // .pipe(gulpif.exclude(excludedExtensions))
//         .pipe(cached('assets'))
//         .pipe(gulp.dest(paths.temp.assets))
//         .pipe(browserSync.stream());
// });

gulp.task('assets', function () {
    return gulp.src([paths.src.assets])
        .pipe(cached('assets'))
        // compress if there are images, copy otherwise
        .pipe(gulpif(file => ImagesExtensions.test(file.extname.toLowerCase()),
            sharpResponsive({
                includeOriginalFile: true,
                formats: [
                    { format: "webp", rename: { suffix: "@1x" } },
                    { width: (metadata) => metadata.width * 0.5, format: "webp", rename: { suffix: "@0.5x" } },
                    // { width: 640, rename: { suffix: "-sm" } },
                    // { width: 768, rename: { suffix: "-md" } },
                    // { width: 1024, rename: { suffix: "-lg" } },
                    // { width: 1080, rename: { suffix: "-xl" } },
                ]
            })))
        .pipe(gulp.dest(paths.temp.assets));
});

gulp.task('vendor', function () {
    return gulp.src(npmDist(), { base: paths.src.node_modules })
        // .pipe(cached('vendor'))
        .pipe(gulp.dest(paths.temp.vendor));
});

gulp.task('serve', gulp.series('clean', 'scss', 'html', 'index', 'assets', 'vendor', function () {
    browserSync.init({
        server: paths.temp.base
    });

    gulp.watch([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/main/**/*.scss', paths.src.scss + '/main.scss'], gulp.series('scss'));
    gulp.watch([paths.src.html, paths.src.base + '*.html', paths.src.partials], gulp.series('html', 'index'));
    // gulp.watch([paths.src.assets], gulp.series('assets'));
    gulp.watch([paths.src.assets], gulp.series('assets'));
    gulp.watch([paths.src.vendor], gulp.series('vendor'));
}));

// Minify CSS
gulp.task('minify:css', function () {
    return gulp.src([
        paths.dist.css + '/main.css'
    ])
        .pipe(cleanCss())
        .pipe(gulp.dest(paths.dist.css))
});

// Minify Html
gulp.task('minify:html', function () {
    return gulp.src([paths.dist.html + '/**/*.html'])
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
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
            collapseWhitespace: true,
            removeComments: true
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

// Compile and copy scss/css
gulp.task('copy:dist:css', function () {
    return gulp.src([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/main/**/*.scss', paths.src.scss + '/main.scss'])
        .pipe(wait(500))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist.css))
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

// Copy assets
gulp.task('copy:dist:assets', function () {
    return gulp.src([paths.src.assets])
        // compress if there are images, copy otherwise
        .pipe(gulpif(file => ImagesExtensions.test(file.extname.toLowerCase()),
            sharpResponsive({
                includeOriginalFile: true,
                formats: [
                    { format: "webp", rename: { suffix: "@1x" } },
                    { width: (metadata) => metadata.width * 0.5, format: "webp", rename: { suffix: "@0.5x" } },
                    // { width: 640, rename: { suffix: "-sm" } },
                    // { width: 768, rename: { suffix: "-md" } },
                    // { width: 1024, rename: { suffix: "-lg" } },
                    // { width: 1080, rename: { suffix: "-xl" } },
                ]
            })))
        .pipe(gulp.dest(paths.dist.assets));
});

// Copy node_modules to vendor
gulp.task('copy:dist:vendor', function () {
    // return gulp.src(npmDist(), { base: paths.src.node_modules })
    return gulp.src([
        paths.src.node_modules + '/**/**/*.min.css',
        paths.src.node_modules + '/**/**/*.woff2',
        paths.src.node_modules + '/**/**/latin.css', // temporary workaround for IBM fonts
    ]) // copy css & woff2 only
        .pipe(gulp.dest(paths.dist.vendor));
});

gulp.task('dist:concat:js', function () {
    return gulp.src([
        paths.src.node_modules + '@popperjs/core/dist/umd/popper.min.js',
        paths.src.node_modules + 'bootstrap/dist/js/bootstrap.min.js',
        paths.src.node_modules + 'headroom.js/dist/headroom.min.js',
        paths.src.node_modules + 'smooth-scroll/dist/smooth-scroll.polyfills.min.js',

        paths.src.base + 'assets/js/main.js',
        paths.src.base + 'assets/js/custom.js'
    ]) // point to the js files
        .pipe(concat('all.min.js')) // The name of the final JS file.
        .pipe(uglify()) // Minify the JS.
        .pipe(gulp.dest(paths.dist.js)); // The destination directory for the final JS file.
});

gulp.task('dist:deploy', function () {
    return spawn('rsync', [
        // '--dry-run', // makes rsync perform a trial run that doesn’t make any changes
        // '-v', // increase verbosity
        '-a', // archive mode; same as -rlptgoD (no -H)
        '-z', // compress file data during the transfer
        '--delete', // delete extraneous files from dest dirs
        '-e', // remote shell
        'ssh', // use secure shell
        paths.dist.base, // local directory, trailing slash causes only content to be synced
        'root@192.168.62.1:/var/www/bitlogic.team' // host and remote directory
    ], { stdio: 'inherit' });
});


gulp.task('build:dist', gulp.series('clean:dist', 'copy:dist:css', 'copy:dist:html', 'copy:dist:html:index', 'copy:dist:assets', 'minify:css', 'minify:html', 'minify:html:index', 'copy:dist:vendor', 'dist:concat:js', 'dist:deploy'));

// Default
gulp.task('default', gulp.series('serve'));