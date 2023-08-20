// Copyright © 2011-2023 bitLogic.systems 

// const autoprefixer = require('gulp-autoprefixer');
import autoprefixer from 'gulp-autoprefixer';
import browserSync from 'browser-sync';
import cleanCss from 'gulp-clean-css';
import del from 'del';
import htmlmin from 'gulp-htmlmin';
import cssbeautify from 'gulp-cssbeautify';
import gulp from 'gulp';
import npmDist from 'gulp-npm-dist';
import gulpSass from 'gulp-sass';
import nodeSass from 'node-sass';
import sourcemaps from 'gulp-sourcemaps';
import fileinclude from 'gulp-file-include';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import { spawn } from 'child_process';
import cached from 'gulp-cached';
import gulpif from 'gulp-if';
import sharpResponsive from "gulp-sharp-responsive";
import replace from 'gulp-replace';
import nunjucksRender from 'gulp-nunjucks-render';
import data from 'gulp-data';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';
import fs from "fs";
import path from "path";
import through2 from "through2";
// const wait = require('gulp-wait');
// const CacheBuster = require('gulp-cachebust');
// const cachebust = new CacheBuster();
// import rev from 'gulp-rev';

const sass = gulpSass(nodeSass);


// gulp-inject

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
        html: './src/**/*.+(html|njk)',
        templates: './src/templates',
        partials: './src/partials',
        js: './src/**/*.js',
        assets: ['./src/assets/**/*.*', './src/fonts/*.+(woff2|woff)', './src/img/**/*.*', './src/favicon.ico'],
        scss: './src/scss',
        node_modules: './node_modules/',
        vendor: './vendor'
    },
    temp: {
        base: './.temp/',
        css: './.temp/css',
        html: './.temp',
        js: './.temp',
        assets: './.temp',
        vendor: './.temp/vendor'
    },
    manifest: './'
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
    return gulp.src([paths.src.html, '!' + paths.src.partials + '/**', '!' + paths.src.templates + '/**'])
        .pipe(data(function (file) {
            let json = './src/data.json';
            // delete require.cache[require.resolve(json)];
            // return require(json);
            return JSON.parse(fs.readFileSync(json));
        }))
        .pipe(
            nunjucksRender({
                path: [paths.src.templates],
            })
        )
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

gulp.task('js', function () {
    return gulp.src([paths.src.js, '!' + paths.src.partials + '/**', '!' + paths.src.templates + '/**'])
        .pipe(cached('js'))
        .pipe(gulp.dest(paths.temp.js))
        .pipe(browserSync.stream());
});

gulp.task('assets', function () {
    return gulp.src(paths.src.assets, { base: paths.src.base })
        .pipe(cached('assets'))
        // compress if there are images, copy otherwise
        .pipe(gulpif(file => ImagesExtensions.test(file.extname.toLowerCase()),
            sharpResponsive({
                includeOriginalFile: true,
                formats: [
                    { format: "webp", rename: { suffix: "-1920@2x" } },
                    { width: (metadata) => Math.round(metadata.width * 0.75), format: "webp", rename: { suffix: "-1440@2x" } },
                    { width: (metadata) => Math.round(metadata.width * 0.50), format: "webp", rename: { suffix: "-960@2x" } },
                    { width: (metadata) => Math.round(metadata.width * 0.25), format: "webp", rename: { suffix: "-540@2x" } },
                    { width: (metadata) => Math.round(metadata.width * 1.00 / 2), format: "webp", rename: { suffix: "-1920" } },
                    { width: (metadata) => Math.round(metadata.width * 0.75 / 2), format: "webp", rename: { suffix: "-1440" } },
                    { width: (metadata) => Math.round(metadata.width * 0.50 / 2), format: "webp", rename: { suffix: "-960" } },
                    { width: (metadata) => Math.round(metadata.width * 0.25 / 2), format: "webp", rename: { suffix: "-540" } },
                    // { width: 640, rename: { suffix: "-sm" } },
                    // { width: 768, rename: { suffix: "-md" } },
                    // { width: 1024, rename: { suffix: "-lg" } },
                    // { width: 1080, rename: { suffix: "-xl" } },
                ]
            })))
        .pipe(gulp.dest(paths.temp.base));
});

gulp.task('vendor', function () {
    return gulp.src(npmDist(), { base: paths.src.node_modules })
        .pipe(cached('vendor'))
        .pipe(gulp.dest(paths.temp.vendor));
});

// gulp.task('serve', gulp.series('clean', 'html', 'scss', 'js', 'assets', 'vendor', function () {
gulp.task('serve', gulp.series('clean', gulp.parallel('html', 'scss', 'js', 'assets', 'vendor'), function () {
    browserSync.init({
        server: paths.temp.base
    });

    gulp.watch([paths.src.js], gulp.series('js'));
    gulp.watch(paths.src.assets, gulp.series('assets'));
    gulp.watch([paths.src.base + '**/*.+(html|njk|json)'], gulp.series('html'));
    gulp.watch([paths.src.scss + '/custom/**/*.scss', paths.src.scss + '/main/**/*.scss', paths.src.scss + '/main.scss'], gulp.series('scss'));
    gulp.watch([paths.src.node_modules + '/**/**/*.min.css', paths.src.node_modules + '/**/**/*.min.js', paths.src.base + 'package.json'], gulp.series('vendor'));
}));


// ************************************************************************************************************
// build


// Clean
gulp.task('dist-clean', function () {
    return del([paths.dist.base]);
});

// Compile, copy scss/css, minify
gulp.task('dist-css', function () {
    return gulp.src([
        paths.src.scss + '/custom/**/*.scss',
        paths.src.scss + '/main/**/*.scss',
        paths.src.scss + '/main.scss',
    ])
        // .pipe(wait(500))
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('all.min.css')) // The name of the final CSS file.
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%']
        }))
        .pipe(cleanCss({ level: { 1: { specialComments: 0 } } })) // Minify the CSS + remove comments.
        .pipe(replace('url(../webfonts/', 'url(/vendor/@fortawesome/fontawesome-free/webfonts/')) // awesome font fix
        // .pipe(cachebust.resources())
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.css))
        .pipe(rev.manifest({ merge: true }))
        .pipe(gulp.dest(paths.manifest))
});

// Copy Html + minify
gulp.task('dist-html', function () {
    var manifest = gulp.src(paths.manifest + "rev-manifest.json");
    return gulp.src([paths.src.html, '!' + paths.src.partials + '/**', '!' + paths.src.templates + '/**'])
        .pipe(data(function (file) {
            let json = './src/data.json';
            // delete require.cache[require.resolve(json)];
            // return require(json);
            return JSON.parse(fs.readFileSync(json));
        }))
        .pipe(
            nunjucksRender({
                path: [paths.src.templates],
            })
        )
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
        // .pipe(cachebust.references())
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest(paths.dist.html));
});

// Copy assets
gulp.task('dist-assets', function () {
    return gulp.src(paths.src.assets, { base: paths.src.base })
        .pipe(gulpif(file => ImagesExtensions.test(file.extname.toLowerCase()),
            through2.obj(function (file, _, cb) {
                let dirpath = path.join(file.cwd, paths.dist.base, path.dirname(file.relative));
                if (!fs.existsSync(dirpath)) {
                    fs.mkdirSync(dirpath, { recursive: true });
                }
                let filename = path.join(dirpath, file.stem + '@0x.webp'); //+ file.extname);
                // let fname;
                // const suffix = '@0x';
                // let dotIndex = filename.lastIndexOf('.');
                // // If there's no dot, return the filename with the suffix appended
                // if (dotIndex === -1) {
                //     fname = filename + suffix;
                // } else {
                //     // Insert the suffix just before the dot
                //     fname = filename.slice(0, dotIndex) + suffix + filename.slice(dotIndex);
                // }
                // if (file.path == '/Users/nick/dev/skynet/src/img/industries/telecommunications-02.png') {
                // console.log(['-i', file.path, '-vf scale=20:-1', fname])
                spawn('/opt/homebrew/bin/ffmpeg', ['-i', file.path, '-vf', 'scale=20:-1', '-loglevel', 'error', '-y', filename], { stdio: 'inherit' })
                // }
                cb(null, file);  // Pass the file along to the next pipe
            })))
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
        // .pipe(gulpif(file => ImagesExtensions.test(file.extname.toLowerCase()),
        //     spawn('ffmpeg', ['-i', file, '-vf scale=20:-1', file + '0x'])
        // ))
        .pipe(gulp.dest(paths.dist.base));
});

// Copy node_modules to vendor
gulp.task('dist-vendor', function () {
    // return gulp.src(npmDist(), { base: paths.src.node_modules })
    return gulp.src([
        paths.src.node_modules + '/**/**/*.min.css',
        paths.src.node_modules + '/**/**/*.min.js',
        paths.src.node_modules + '/**/**/*.woff2',
    ]) // copy css & woff2 only
        .pipe(gulp.dest(paths.dist.vendor));
});

gulp.task('dist-js', function () {
    return gulp.src([
        paths.src.node_modules + 'bootstrap/dist/js/bootstrap.bundle.min.js',
        paths.src.node_modules + 'headroom.js/dist/headroom.min.js',
        // paths.src.node_modules + 'smooth-scroll/dist/smooth-scroll.polyfills.min.js',
        paths.src.base + 'js/main.js',
        paths.src.base + 'js/custom.js'
    ]) // point to the js files
        .pipe(concat('all.min.js')) // The name of the final JS file.
        .pipe(uglify()) // Minify the JS.
        // .pipe(cachebust.resources())
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.js)) // The destination directory for the final JS file.
        .pipe(rev.manifest({ merge: true }))
        .pipe(gulp.dest(paths.manifest))

});

gulp.task('dist-deploy', function () {
    return spawn('rsync', [
        // '--dry-run', // makes rsync perform a trial run that doesn’t make any changes
        // '-v', // increase verbosity
        '-a', // archive mode; same as -rlptgoD (no -H)
        '-z', // compress file data during the transfer
        // '--size-only', // skip files that match in size
        '-c', // skip files verified by checksum
        '--delete', // delete extraneous files from dest dirs
        '-e', // remote shell
        'ssh', // use secure shell
        paths.dist.base, // local directory, trailing slash causes only content to be synced
        'root@192.168.62.1:/var/www/bitlogic.team' // host and remote directory
    ], { stdio: 'inherit' });
});


gulp.task('dist-build', gulp.series('dist-clean', gulp.parallel('dist-css', 'dist-vendor', 'dist-js'), gulp.parallel('dist-html', 'dist-assets'), 'dist-deploy'));

// Default
gulp.task('default', gulp.series('serve'));



// ************************************************************************************************************


// gulp.task('markdown', function() {
//     const config = {
//       options: {
//         preset: 'commonmark',
//         html: true,
//         xhtmlOut: true,
//         linkify: true,
//         typographer: true,
//       },
//     };
//     return gulp
//         .src('src/md-source/*.md')
//         .pipe(markdown(config))
//         .pipe(gulp.dest('src/html-source/'));
//   });