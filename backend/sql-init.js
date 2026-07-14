const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agency_platform',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Bắt đầu chạy Migration Script cho Phase 1...');
    await client.query('BEGIN'); // Start transaction

    // 1. Khởi tạo bảng users
    console.log('Đang tạo bảng: users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK (role IN ('admin', 'designer', 'client')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Khởi tạo bảng project_files
    console.log('Đang tạo bảng: project_files...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL, -- Assuming projects table exists or will exist
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        original_url TEXT NOT NULL,
        preview_url TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Khởi tạo bảng feedbacks
    console.log('Đang tạo bảng: feedbacks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coordinate_x FLOAT,
        coordinate_y FLOAT,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT'); // Commit transaction
    console.log('🎉 Hoàn tất Migration! Các bảng đã được tạo thành công.');

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if error occurs
    console.error('❌ Lỗi trong quá trình Migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Thực thi migration
runMigrations();
