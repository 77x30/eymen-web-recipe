# Recipe Management System

A web-based recipe management system inspired by Siemens WinCC recipe functionality.

## Features

- **Recipe Management**: Create and manage recipe templates with customizable elements
- **Data Records**: Store multiple data record instances for each recipe
- **User Authentication**: JWT-based authentication with role-based access control
- **Export/Import**: Export recipes to CSV format
- **WinCC-Style UI**: Familiar interface for industrial automation users

## Technology Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: MySQL
- **Authentication**: JWT

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

### 1. Database Setup

```bash
# Login to MySQL and run the schema
mysql -u root -p < database/schema.sql
```

Or manually create the database:
```sql
CREATE DATABASE recipe_management;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your database credentials
cp .env.example .env

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

Edit `backend/.env` file:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=recipe_management
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

## Usage

1. Open http://localhost:3000 in your browser
2. Register a new account (first user will be admin)
3. Create a new recipe with elements (fields)
4. Add data records to your recipes
5. Export recipes to CSV

## User Roles

- **Admin**: Full access - create, edit, delete recipes and records
- **Operator**: Create and edit recipes and records
- **Viewer**: Read-only access

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Recipes
- `GET /api/recipes` - List all recipes
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe details
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Data Records
- `GET /api/recipes/:id/records` - List records for recipe
- `POST /api/recipes/:id/records` - Create record
- `GET /api/records/:id` - Get record details
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

### Export
- `GET /api/recipes/:id/export` - Export recipe as CSV

## Project Structure

```
eymen-web-recipe/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and JWT configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   └── app.js          # Application entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql          # Database schema
└── README.md
```

## License

MIT
