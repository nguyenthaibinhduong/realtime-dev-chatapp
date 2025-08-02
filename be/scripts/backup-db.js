const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Simple database backup script
 */
class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  }

  ensureBackupDir() {
    const backupPath = path.join(this.backupDir, this.timestamp);
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    return backupPath;
  }

  async backupPostgreSQL(backupPath) {
    try {
      this.log('Starting PostgreSQL backup...');
      const outputFile = path.join(backupPath, 'postgres_backup.sql');

      execSync(`docker-compose exec -T postgres pg_dump -U postgres dev_chat > "${outputFile}"`, {
        stdio: 'pipe',
      });

      this.log(`PostgreSQL backup completed: ${outputFile}`);
    } catch (error) {
      this.error(`PostgreSQL backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupMongoDB(backupPath) {
    try {
      this.log('Starting MongoDB backup...');
      const outputFile = path.join(backupPath, 'mongodb_backup.tar.gz');

      // Create dump inside container
      execSync(
        'docker-compose exec -T mongodb mongodump --host localhost --port 27017 --db dev_chat --out /tmp/backup',
        {
          stdio: 'pipe',
        },
      );

      // Create tar archive
      execSync(
        'docker-compose exec -T mongodb tar -czf /tmp/mongodb_backup.tar.gz -C /tmp/backup .',
        {
          stdio: 'pipe',
        },
      );

      // Copy to host
      const containerId = execSync('docker-compose ps -q mongodb', { encoding: 'utf8' }).trim();
      execSync(`docker cp ${containerId}:/tmp/mongodb_backup.tar.gz "${outputFile}"`, {
        stdio: 'pipe',
      });

      this.log(`MongoDB backup completed: ${outputFile}`);
    } catch (error) {
      this.error(`MongoDB backup failed: ${error.message}`);
      throw error;
    }
  }

  async run() {
    try {
      this.log('Starting database backup process...');

      // Check if Docker is running
      try {
        execSync('docker info', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('Docker is not running. Please start Docker and try again.');
      }

      // Check if containers are running
      try {
        execSync('docker-compose ps', { stdio: 'pipe' });
      } catch (error) {
        throw new Error(
          'Docker Compose services are not running. Please start them first with: npm run db:start',
        );
      }

      const backupPath = this.ensureBackupDir();
      this.log(`Backup directory: ${backupPath}`);

      // Backup databases
      await this.backupPostgreSQL(backupPath);
      await this.backupMongoDB(backupPath);

      // Create metadata file
      const metadata = {
        timestamp: this.timestamp,
        date: new Date().toISOString(),
        databases: ['PostgreSQL', 'MongoDB'],
        version: require('../package.json').version,
      };

      fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

      this.log('Backup process completed successfully!');
      this.log(`All backups saved to: ${backupPath}`);
    } catch (error) {
      this.error(`Backup process failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.run();
}

module.exports = DatabaseBackup;
