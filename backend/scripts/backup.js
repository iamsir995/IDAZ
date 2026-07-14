const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');

async function backupDatabase() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/agency-platform";
  
  try {
    console.log(`Connecting to database...`);
    await mongoose.connect(uri);
    console.log(`Connected. Starting backup...`);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Create a timestamped folder inside backups/
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let totalDocs = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      // Skip system collections
      if (collectionName.startsWith('system.')) continue;

      const docs = await db.collection(collectionName).find({}).toArray();
      totalDocs += docs.length;

      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      console.log(`- Backed up collection [${collectionName}]: ${docs.length} documents.`);
    }

    console.log(`Backup completed successfully! Total documents: ${totalDocs}`);
    console.log(`Backup saved to: ${backupDir}`);
    
    // Auto-cleanup old backups (keep last 5)
    const backupsRoot = path.join(__dirname, '..', 'backups');
    const folders = fs.readdirSync(backupsRoot)
      .filter(f => fs.lstatSync(path.join(backupsRoot, f)).isDirectory())
      .sort((a, b) => b.localeCompare(a)); // Descending

    if (folders.length > 5) {
      const toDelete = folders.slice(5);
      toDelete.forEach(folder => {
        fs.rmSync(path.join(backupsRoot, folder), { recursive: true, force: true });
        console.log(`- Removed old backup: ${folder}`);
      });
    }

    return true;
  } catch (error) {
    console.error('Backup failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

// Allow running directly from command line
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };
