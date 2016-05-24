//
// This file is the default config file and
// contains common configuration data for all environments.
//

const env = require('dotenv').config();

module.exports = {
  //
  // Server
  //
  server: {
      host: env.APP_HOST,
      port: env.APP_PORT
  },

  //
  // API URL
  //
  apiUrl: 'http://localhost:3000',

  //
  // Node runtime settings
  //
  node: {
    debugPort: 5858
  },

  //
  // Database
  //
  database: {
      host: env.DB_HOST,
      port: 27017,
      db: env.DB_DATABASE,
      username: '',
      password: ''
  },

  //
  // Logging
  //
  logging: {
    console: {
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true
    }
  }
}
