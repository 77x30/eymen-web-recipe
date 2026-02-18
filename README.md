# Barida Recipe Management System

A web-based and desktop recipe management system inspired by Siemens WinCC recipe functionality.

## Features

- **Recipe Management**: Create and manage recipe templates with customizable elements
- **Data Records**: Store multiple data record instances for each recipe
- **User Authentication**: JWT-based authentication with role-based access control
- **Export/Import**: Export recipes to CSV format
- **HMI-Style UI**: Touch-friendly interface for industrial automation users
- **Virtual Keyboard**: Touch keyboard for HMI panels (integer, float, string modes)
- **Admin Panel**: User management and system status monitoring
- **Electron Desktop App**: Run as a native Windows/Linux/Mac application

## Technology Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: MySQL
- **Authentication**: JWT
- **Desktop**: Electron

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

### 3. Frontend Setup (Web)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Electron Desktop App

```bash
cd frontend

# Development mode (with hot reload)
npm run electron:dev

# Build Windows installer
npm run electron:build:win

# Build Linux AppImage
npm run electron:build:linux

# Build MacOS DMG
npm run electron:build:mac
```

The built installers will be in `frontend/electron-dist/` folder.

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

Edit `frontend/.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

For production (deployed):
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Default Users

The system automatically seeds these users on first start:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| operator | operator123 | Operator |

## Usage

### Web Application
1. Open http://localhost:5173 in your browser
2. Login with admin/admin123
3. Create recipes with elements (fields)
4. Add data records to your recipes

### Desktop Application
1. Run `npm run electron:dev` for development
2. Or install the built application
3. Enter the backend URL if different from localhost

## User Roles

- **Admin**: Full access - create, edit, delete recipes, records, and manage users
- **Operator**: Create and edit recipes and records
- **Viewer**: Read-only access

## Example Recipes

The system comes with 4 example industrial recipes:

1. **Coil Opener** - Line speed, width, thickness, tension parameters
2. **Press Machine** - Force, stroke, speed, dwell time settings
3. **CNC Milling** - Spindle speed, feed rate, depth of cut
4. **Paint Mixing** - RGB color values and mixing parameters

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

### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

### Health
- `GET /api/health` - System health check

### Export
- `GET /api/recipes/:id/export` - Export recipe as CSV

## Project Structure

```
eymen-web-recipe/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and JWT configuration
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   └── app.js          # Application entry point (with auto-seed)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── DataRecordTable.jsx
│   │   │   ├── VirtualKeyboard.jsx
│   │   │   └── RecipeEditor.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RecipeManager.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── App.jsx
│   ├── electron.js         # Electron main process
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql          # Database schema
└── README.md
```

## Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

### Railway (Backend + MySQL)
1. Create a new project on Railway
2. Add MySQL service
3. Connect the backend repository
4. Set environment variables from MySQL

## License

MIT

## Credits

Developed by Barida Makina - Industrial Solutions
