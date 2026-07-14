require('dotenv').config();

const url = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/agency-platform";
// Parse DB name from URL if possible, fallback to default
let databaseName = "agency-platform";
try {
  const parsed = new URL(url);
  if (parsed.pathname && parsed.pathname.length > 1) {
    databaseName = parsed.pathname.substring(1);
  }
} catch (error) {
  // Ignore
}

const config = {
  mongodb: {
    url: url,
    databaseName: databaseName,
    options: {}
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  lockCollectionName: "changelog_lock",
  lockTtl: 0,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
