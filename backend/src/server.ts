import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const server = app.listen(env.port, () => {
  console.log(`🚀 Server running on port ${env.port} in ${env.node} mode`);
  console.log(`📖 Health check: http://localhost:${env.port}/health`);
});

const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
