module.exports = {
  apps: [
    {
      name: 'careeros-api',
      cwd: __dirname,
      script: 'src/index.ts',
      interpreter: './node_modules/.bin/tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        DATA_DIR: '/Users/greg/Notebooks/CareerOS',
      },
    },
  ],
}
