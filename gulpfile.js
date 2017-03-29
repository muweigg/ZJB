var gulp = require('gulp'),
    merge = require('merge-stream'),
    notify = require('gulp-notify'),
    buffer = require('vinyl-buffer'),
    imagemin = require('gulp-imagemin'),
    spritesmith = require('gulp.spritesmith');

var basePath = './';

gulp.task('sprites', function(){
    var spriteData = gulp.src('src/sprites/**/*.png').pipe(spritesmith({
        imgName: 'icons.png',
        cssName: 'icons.scss',
        padding: 10,
        algorithm: 'top-down',
        algorithmOpts: { sort: true },
        imgPath: basePath + 'assets/icons.png'
    }));

    var imgStream = spriteData.img
        // .pipe(buffer())
        // .pipe(imagemin())
        .pipe(gulp.dest('src/assets/'));

    var cssStream = spriteData.css
        .pipe(gulp.dest('src/plugin/scss/'));

    return merge(imgStream, cssStream)
        .pipe(notify('sprites generation completion.'));
});

gulp.task('default', ['sprites'], function(){
    gulp.watch('src/sprites/**/*.*', ['sprites']);
});
