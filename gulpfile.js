var gulp = require('gulp');
var inject = require('gulp-inject');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var concatCss = require('gulp-concat-css');
var sh = require('shelljs');

var paths = {
    sass: [
        './scss/**/*.scss',
        './www/component/about/*.scss',
        './www/scss/**/*.scss',
        './www/scss/*.scss'
    ],
    javascript: [
        './www/lib/ionic/js/ionic.bundle.js',
        './www/lib/datePicker/js/angular-pickadate.js',
        './www/lib/leaflet/leaflet.markercluster-src.js',
        './www/lib/chart/Chart.js',
        './www/lib/chart/angular-chart.js',
        './www/lib/chart/chartlist.js',
        './www/lib/moment.min.js',
        './www/lib/satellizer.min.js',
        './www/lib/chart/sparkLineChart.js',
        './www/lib/ng-storage.js',
        './www/lib/ng-cordova/ng-cordova.min.js',
        './www/lib/ng-cordova/sha1.js',
        './www/lib/ios9uiwebview.js',
        './www/lib/googlelogin.js',
        './www/lib/TimeStorage.js',
        './www/lib/checklist-model.js',
        './www/lib/loDash.js',
        './www/lib/jquery.min.js',
        './www/lib/***/**/*.*.js',
        './www/lib/**/*.*.js',
        './www/lib/**/*.js',
        './www/lib/*.js',
        './www/services/*.js',
        './www/component/***/**/*.js',
        './www/component/***/**/*.*.js',
        './www/component/**/*.*.js',
        './www/component/**/*.js',
        './www/*.*.js',
        './*.js'
//        

    ],
    css: [
        './www/lib/ionic/css/ionic.css',
        './www/lib/chart/chartlist.min.css',
        './www/lib/datePicker/css/angular-pickadate.css',
        './www/css/**/*.css',
        './www/css/*.css'
    ]
};

gulp.task('default', ['scripts', 'sass']);

gulp.task('css', function() {
    return gulp.src(paths.css)
            .pipe(concatCss('CrimeReports.bundle.css'))
            .pipe(gulp.dest('./www'));
});
gulp.task('scripts', function() {
    return gulp.src(paths.javascript)
            .pipe(concat('CrimeReports.bundle.js'))
            .pipe(gulp.dest('./www'));
});

gulp.task('sass', function(done) {
    gulp.src('./scss/ionic.app.scss')
            .pipe(sass({
                errLogToConsole: true
            }))
            .pipe(gulp.dest('./www/css/'))
            .pipe(minifyCss({
                keepSpecialComments: 0
            }))
            .pipe(rename({extname: '.min.css'}))
            .pipe(gulp.dest('./www/css/'))
            .on('end', done);
});

gulp.task('watch', function() {
    gulp.watch(paths.sass, ['sass']);
    gulp.watch(paths.sass, ['css']);
    gulp.watch(paths.sass, ['scripts']);
});

gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
            .on('log', function(data) {
                gutil.log('bower', gutil.colors.cyan(data.id), data.message);
            });
});

gulp.task('git-check', function(done) {
    if (!sh.which('git')) {
        console.log(
                '  ' + gutil.colors.red('Git is not installed.'),
                '\n  Git, the version control system, is required to download Ionic.',
                '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
                '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
                );
        process.exit(1);
    }
    done();
});
