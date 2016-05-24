'use static'

//
// Dependencies
//
const gulp = require('gulp')
const gutil = require('gulp-util')
const jshint = require('gulp-jshint')
const nodemon = require('gulp-nodemon')
const config = require('config')
//
// Variables
//
var appSrc = 'app/**/*.js'
  , appInitSrc = 'server.js'
  , ignoreSrc = [
    'coverage',
    'app/**/*.spec.js',
    'tasks/gulp.*.js',
    'tests/',
  ]

//
// Tasks
//

// Lint Javascript code
gulp.task('jshint', () => gulp
  .src(appSrc)
  .pipe(jshint())
)

// Local node server
gulp.task('nodemon', () => {
  nodemon({
    script: appInitSrc,
    ext: 'js html',
    ignore: ignoreSrc,
    tasks: [ 'jshint' ],
    execMap: {
      js: 'node --debug=' + config.get('node.debugPort', 5858)
    }
  })
  .on('crash', () => {
    gutil.log(gutil.colors.red(`Local server crashed (nodemon): `))
    // Exit if running on CI environment
    if (process.env.NODE_ENV && process.env.NODE_ENV.match(/^ci-/i).length) {
      process.exit(1)
    }
  })
})
