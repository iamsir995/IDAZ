module.exports = {
  apps: [
    {
      name: 'agency-backend',
      script: './backend/server.js',
      cwd: './backend',
      instances: 1, // Change to 'max' for cluster mode (Load Balancing)
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // MONGO_URI, JWT_SECRET, etc. should be configured in Server OS Env or .env file
      }
    },
    {
      name: 'agency-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
