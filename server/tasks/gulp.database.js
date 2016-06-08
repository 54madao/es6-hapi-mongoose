'use static'

//
// Dependencies
//
const gulp = require('gulp')
const gutil = require('gulp-util')

//
// Variables
//
var migrationSrc = './database/migrations'
  , seedSrc = './database/seeds'

//
// Tasks
//

// Apply latest migration
gulp.task('db:migrate', () => {

})

// Rollback latest migration
gulp.task('db:rollback', () => {

})

// Insert seeds
gulp.task('db:seed', () => {

})
