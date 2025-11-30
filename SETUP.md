# Setup Instructions

## Prerequisites

1. **Database Setup**: This application requires a PostgreSQL database connection string.

### Option 1: Use Neon (Recommended - Free Tier Available)
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy your connection string (it will look like: `postgresql://user:password@host/database`)

### Option 2: Use Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database
3. Use connection string: `postgresql://localhost:5432/your_database_name`

## Environment Variables

Create a `.env` file in the root directory with:

```env
DATABASE_URL=your_postgresql_connection_string_here
SESSION_SECRET=your-secret-key-here (optional)
PORT=3000 (optional, defaults to 3000)
NODE_ENV=development
```

## Setup Steps

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up your database**:
   - Create a `.env` file with your `DATABASE_URL`
   - Push the schema to your database:
     ```bash
     npm run db:push
     ```

3. **Run the application**:
   ```bash
   npm run dev
   ```

   On Windows, if the script doesn't work, use:
   ```powershell
   $env:NODE_ENV="development"; npx tsx server/index.ts
   ```

4. **Access the application**:
   - Open http://localhost:3000 in your browser
   - Create a designer account through the admin interface

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript types and schemas
- `uploads/` - File uploads directory (created automatically)

## Troubleshooting

- **DATABASE_URL error**: Make sure you've created a `.env` file with a valid PostgreSQL connection string
- **Port already in use**: Change the `PORT` in your `.env` file
- **Windows script issues**: Use PowerShell environment variable syntax or run with `npx tsx` directly

