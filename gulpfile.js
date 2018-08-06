var gulp = require('gulp'),
    gutil = require('gulp-util'),
    es = require('event-stream');

var plugins = require('gulp-load-plugins')({
    camelize: true
});

var config = require('./gulpfile.config');

var isProduction = (gutil.env.prod === true ? true : false);
var date = new Date();
var nicedate = date.toISOString().replace(/(\-|:|\.)/g, '');

gulp.task('clean', function() {
    return gulp.src(config.basePaths.dest)
        .pipe(plugins.clean());
});

gulp.task('templates', ['scripts', 'styles'], function() {
    return es.merge(
        gulp.src(config.typeMap.html, { cwd: config.typePaths.templates.src }),

        gulp.src(config.typeMap.jade, { cwd: config.typePaths.templates.src })
        .pipe(plugins.jade({ basedir: "src/templates/", pretty: (isProduction ? false : true) })))

    .pipe(plugins.inject(
            gulp.src(config.typePaths.styles.dest + config.GLOBSTAR, { read: false })
            .pipe(plugins.order(config.styleOrder))
            .pipe(plugins.using({ prefix: 'Injecting' })), {
                addRootSlash: true,
                ignorePath: config.basePaths.dest
            }))
        // .pipe(plugins.inject(
        //   gulp.src(config.typePaths.scriptshead.dest + config.GLOBSTAR, {read: false}, {starttag: '<!-- inject:head:{{ext}} -->'})
        //   .pipe(plugins.using({prefix: 'Injecting'})),
        //     { addRootSlash: false, ignorePath: config.basePaths.dest })
        // )
        .pipe(plugins.inject(
            gulp.src([config.typePaths.scripts.dest + config.GLOBSTAR], { read: false })
            .pipe(plugins.order(config.scriptOrder))
            .pipe(plugins.using({ prefix: 'Injecting' })), { addRootSlash: true, ignorePath: config.basePaths.dest }))

    .pipe(plugins.size({ title: 'templates', showFiles: true, gzip: true }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.templates.dest));
});

gulp.task('subDirectories', ['scripts', 'styles'], function() {
    return es.merge(

        gulp.src(config.typeMap.html, { cwd: config.typePaths.subDirectories.src + config.GLOBSTAR }),

        gulp.src(config.typeMap.jade, { cwd: config.typePaths.subDirectories.src + config.GLOBSTAR })
        .pipe(plugins.jade({ basedir: "src/templates/", pretty: (isProduction ? false : true) })))

    .pipe(plugins.inject(
            gulp.src(config.typePaths.styles.dest + config.GLOBSTAR, { read: false })
            .pipe(plugins.order(config.styleOrder))
            .pipe(plugins.using({ prefix: 'Injecting' })), {
                addRootSlash: true,
                ignorePath: config.basePaths.dest
            }))
        // .pipe(plugins.inject(
        //   gulp.src(config.typePaths.scriptshead.dest + config.GLOBSTAR, {read: false}, {starttag: '<!-- inject:head:{{ext}} -->'})
        //   .pipe(plugins.using({prefix: 'Injecting'})),
        //     { addRootSlash: false, ignorePath: config.basePaths.dest })
        // )
        .pipe(plugins.inject(
            gulp.src([config.typePaths.scripts.dest + config.GLOBSTAR], { read: false })
            .pipe(plugins.order(config.scriptOrder))
            .pipe(plugins.using({ prefix: 'Injecting' })), { addRootSlash: true, ignorePath: config.basePaths.dest }))

    .pipe(plugins.size({ title: 'subDirectories', showFiles: true, gzip: true }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.subDirectories.dest));
});

gulp.task('styles', function() {
    return es.merge(

        gulp.src(config.typeMap.less, { cwd: config.typePaths.styles.src })
        .pipe(plugins.less()),

        gulp.src(config.typeMap.css, { cwd: config.typePaths.styles.src }))

    .pipe(plugins.autoprefixer({ browsers: ['last 2 versions'], cascade: false }))
        .pipe(isProduction ? plugins.csso() : gutil.noop())
        .pipe(plugins.order(config.styleOrder))
        .pipe(isProduction ? plugins.concat('app.' + nicedate + '.css') : gutil.noop())
        .pipe(plugins.size({ title: 'styles', showFiles: true, gzip: true }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.styles.dest));
});

gulp.task('scripts', function() {
    return es.merge(
            es.merge(

                gulp.src(config.typeMap.coffee, { cwd: config.typePaths.scripts.src })
                .pipe(plugins.coffee()),

                gulp.src(config.typeMap.js, { cwd: config.typePaths.scripts.src }))

            // .pipe(plugins.jshint())
            // .pipe(plugins.jshint.reporter('default'))

            .pipe(isProduction ? plugins.uglify() : gutil.noop()),

            gulp.src(config.typeMap.jslibs, { cwd: config.typePaths.scripts.src }))
        .pipe(plugins.order(config.scriptOrder))
        .pipe(isProduction ? plugins.concat('app.' + nicedate + '.js') : gutil.noop())

    .pipe(plugins.size({ title: 'scripts', showFiles: false, gzip: true }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.scripts.dest));
});

gulp.task('images', function() {
    return gulp.src(config.appFiles.images, { cwd: config.typePaths.images.src })
        .pipe(isProduction ? plugins.imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }) : gutil.noop())
        .pipe(plugins.size({ title: 'imagemin', showFiles: false }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.images.dest));
});

gulp.task('extras', function() {
    return gulp.src(config.appFiles.extras, { cwd: config.typePaths.extras.src })
        .pipe(plugins.size({ title: 'extras', showFiles: false }))
        .pipe(isProduction ? gutil.noop() : plugins.connect.reload())
        .pipe(gulp.dest(config.typePaths.extras.dest));
});

gulp.task('bundle', function() {
    var archiveName = config.appName + '.' + nicedate + '.zip';
    console.log(archiveName);
    return gulp.src(config.basePaths.dest + config.GLOBSTAR)
        .pipe(plugins.zip(archiveName))
        .pipe(plugins.size({ title: 'Bundle', showFiles: true }))
        .pipe(gulp.dest('..'));
});

gulp.task('rename', ['templates'], function() {
    return gulp.src(config.typePaths.templates.dest + 'index.html')
        .pipe(isProduction ? plugins.rename('index.' + nicedate + '.html') : gutil.noop())
        .pipe(gulp.dest(config.typePaths.templates.dest));
});

gulp.task('watch', function() {
    plugins.connect.server({
        livereload: true,
        port: config.SERVER_PORT,
        root: config.basePaths.dest
    });

    gulp.watch(config.typePaths.styles.src + config.GLOBSTAR, ['styles']);
    gulp.watch(config.typePaths.scripts.src + config.GLOBSTAR, ['scripts']);
    gulp.watch(config.typePaths.templates.src + config.GLOBSTAR, ['templates']);
    gulp.watch(config.typePaths.images.src + config.GLOBSTAR, ['images']);
    gulp.watch(config.typePaths.extras.src + config.GLOBSTAR, ['extras']);

});

gulp.task('open', ['templates'], function() {
    var uri = 'http://localhost:' + config.SERVER_PORT;
    var sourceFile = config.basePaths.src + '../README.md';

    gulp.src(sourceFile)
        .pipe(isProduction ? gutil.noop() : plugins.open({uri: uri }));
});

// Define the default task as a sequence of the above tasks
// Additionally, enable production build on any task by adding "--prod"
gulp.task('build', ['clean'], function() {
    gulp.start('extras', 'scripts', 'styles', 'images', 'templates', 'subDirectories', 'rename');
});

gulp.task('default', ['clean'], function() {
    gulp.start('extras', 'scripts', 'styles', 'images', 'templates', 'subDirectories',  'watch', 'open');
});
