/**
 * Migration script to backfill createdBy field for existing shares
 *
 * This script should be run once after the schema update to populate
 * the createdBy field for all existing Share records.
 *
 * Run with: npx ts-node scripts/migrate-share-creators.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateShareCreators() {
  console.log('Starting migration: backfilling createdBy for existing shares...');

  try {
    // Get all shares that might need migration
    // Note: This script is designed to run on existing data before schema update
    const shares = await prisma.share.findMany({
      include: {
        tree: {
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`Found ${shares.length} shares to check`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const share of shares) {
      try {
        // Check if share already has createdBy (skip if exists)
        if ((share as any).createdBy) {
          skippedCount++;
          continue;
        }

        await prisma.share.update({
          where: { id: share.id },
          data: { createdBy: share.tree.userId },
        });
        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount}/${shares.length} shares...`);
        }
      } catch (error) {
        console.error(`Error migrating share ${share.id}:`, error);
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already migrated): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateShareCreators()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
