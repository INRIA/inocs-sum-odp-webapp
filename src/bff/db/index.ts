import prisma from './client';

/**
 * Initialize database connection
 * This function can be extended to include seeding, migrations, etc.
 */
export async function initializeDatabase() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

export { prisma };
export default prisma;