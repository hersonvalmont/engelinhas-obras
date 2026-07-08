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
      JWT_SECRET:  'TROQUE_POR_UMA_CHAVE_SEGURA_ALEATORIA',
      CORS_ORIGIN: 'https://obras.engelinhas.com'
    }
  }]
};
