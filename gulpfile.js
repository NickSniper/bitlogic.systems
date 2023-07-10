// Copyright © 2011-2023 bitLogic.systems 

const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const cleanCss = require('gulp-clean-css');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const cssbeautify = require('gulp-cssbeautify');
const gulp = require('gulp');
const npmDist = require('gulp-npm-dist');
const sass = require('gulp-sass')(require('node-sass'));
// const wait = require('gulp-wait');
const sourcemaps = require('gulp-sourcemaps');
const fileinclude = require('gulp-file-include');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const spawn = require('child_process').spawn;
const cached = require('gulp-cached');
const gulpif = require('gulp-if');
const sharpResponsive = require("gulp-sharp-responsive");
const replace = require('gulp-replace');

// Define paths
const ImagesExtensions = /\.(jpeg|jpg|png|gif|webp|avif|heif|tiff?g)$/i;
const paths = {
    dist: {
        base: './dist/',
        css: './dist/css',
        js: './dist/js',
        html: './dist',
        assets: './dist/assets',
        vendor: './dist/vendor'
    },
    src: {
        base: './src/',
        css: './src/css',
        html: './src/**/*.html',
        assets: './src/assets/**/*.*',
        partials: './src/partials',
        scss: './src/scss',
        node_modules: './node_modules/',
        vendor: './vendor'
    },
    temp: {
        base: './.temp/',
        css: './.temp/css',
        html: './.temp',
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
        // .pipe(wait(500))
        .pipe(sourcemaps.init())
        // .pipe(cached('sass'))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(cssbeautify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.temp.css))
        .pipe(browserSync.stream());
});

gulp.task('html', function () {
    return gulp.src([paths.src.html, '!' + paths.src.partials + '/**'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: paths.src.partials,
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

gulp.task('serve', gulp.series('clean', 'scss', 'html', 'assets', 'vendor', function () {
    browserSync.init({
        server: paths.temp.base
    });

    gulp.watch([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/main/**/*.scss', paths.src.scss + '/main.scss'], gulp.series('scss'));
    gulp.watch([paths.src.html], gulp.series('html'));
    // gulp.watch([paths.src.assets], gulp.series('assets'));
    gulp.watch([paths.src.assets], gulp.series('assets'));
    gulp.watch([paths.src.vendor], gulp.series('vendor'));
}));


// ************************************************************************************************************
// build


// Clean
gulp.task('clean:dist', function () {
    return del([paths.dist.base]);
});

// Compile, copy scss/css, minify
gulp.task('copy:dist:css', function () {
    return gulp.src([
        paths.src.scss + '/custom/**/*.scss',
        paths.src.scss + '/main/**/*.scss',
        paths.src.scss + '/main.scss',
        paths.src.node_modules + '@fontsource/ibm-plex-sans/latin.css',
        paths.src.node_modules + '@fortawesome/fontawesome-free/css/all.min.css'
    ])
        // .pipe(wait(500))
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('all.min.css')) // The name of the final CSS file.
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(cleanCss({ level: { 1: { specialComments: 0 } } })) // Minify the CSS + remove comments.
        .pipe(replace('url(files/', 'url(/vendor/@fontsource/ibm-plex-sans/files/')) // ibm font fix
        .pipe(replace('url(../webfonts/', 'url(/vendor/@fortawesome/fontawesome-free/webfonts/')) // awesome font fix
        .pipe(gulp.dest(paths.dist.css))
});

// Copy Html + minify
gulp.task('copy:dist:html', function () {
    return gulp.src([paths.src.html, '!' + paths.src.partials + '/**'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: paths.src.partials,
            context: {
                environment: 'production'
            }
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest(paths.dist.html));
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

gulp.task('minify:dist:js', function () {
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
        '--size-only', // skip files that match in size
        '--delete', // delete extraneous files from dest dirs
        '-e', // remote shell
        'ssh', // use secure shell
        paths.dist.base, // local directory, trailing slash causes only content to be synced
        'root@192.168.62.1:/var/www/bitlogic.team' // host and remote directory
    ], { stdio: 'inherit' });
});


gulp.task('build:dist', gulp.series('clean:dist', 'copy:dist:vendor', 'copy:dist:html', 'copy:dist:assets', 'copy:dist:css', 'minify:dist:js', 'dist:deploy'));

// Default
gulp.task('default', gulp.series('serve'));