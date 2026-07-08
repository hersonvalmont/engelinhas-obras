module.exports = {
  apps: [{
    name:      'engelinhas-api',
    script:    '/var/www/engelinhas/server/index.js',
    cwd:       '/var/www/engelinhas/server',
    instances: 1,
    exec_mode: 'fork',
    watch:     false,
    env: {
      NODE_ENV:    'production',
      PORT:        3001,
      DB_PATH:     '/var/www/engelinhas/server/engelinhas.db',
      UPLOADS_DIR: '/var/www/engelinhas/server/uploads',
      PUBLIC_DIR:  '/var/www/engelinhas/public',
      JWT_SECRET:  '73c974ab1415ab83918249e618698b35c39ce2310192987a3019b397f266379d8489133790110d5e692365511eb164ec',
      CORS_ORIGIN: 'https://obras.engelinhas.com'
    }
  }]
};
