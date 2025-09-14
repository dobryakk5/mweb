module.exports = {
  apps: [
    {
      name: 'acme-api',
      script: './services/api/dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 13001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      watch: false
    },
    {
      name: 'acme-web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 13000,
        NEXT_PUBLIC_API_URL: 'http://localhost:13001',
        NEXT_PUBLIC_BASE_URL: 'http://localhost:13000'
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      watch: false
    },
    {
      name: 'scheduler',
      script: './services/scheduler/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/scheduler-error.log',
      out_file: './logs/scheduler-out.log',
      log_file: './logs/scheduler-combined.log',
      time: true,
      watch: false
    }
  ]
}