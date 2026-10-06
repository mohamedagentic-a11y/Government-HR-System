import { app } from './app';

const PORT = process.env.PORT;

if (!PORT) {
  console.error('FATAL ERROR: PORT environment variable is not defined.');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});