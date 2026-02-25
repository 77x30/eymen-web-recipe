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

# Optional: purge all recipes/records across workspaces
# (use this to remove old mock/sample recipe data)
npm run purge:recipes
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

The system automatically seeds this user on first start:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |

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

## Recipe Data

No sample/mock recipes are auto-created. Recipes and records are fully managed by users.

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

### Telemetry & Updates (Admin only)
- `GET /api/system/updates` - List published system updates
- `POST /api/system/updates` - Publish new update
- `GET /api/system/telemetry` - Get WinForms app telemetry overview
- `POST /api/system/telemetry/heartbeat` - WinForms heartbeat (see below)
- `GET /api/system/version` - Get latest version info (public)

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

## WinForms Telemetry Integration

WinForms desktop applications can report telemetry to the admin dashboard by sending periodic heartbeats.

### Heartbeat Endpoint

**POST** `/api/system/telemetry/heartbeat`

```json
{
  "device_id": "unique-machine-id",
  "workspace_subdomain": "tofas",
  "username": "operator1",
  "app_version": "1.0.0",
  "ram_usage_mb": 128.5,
  "cpu_usage_percent": 12.3,
  "os_info": "Windows 10 Pro 22H2",
  "screen_resolution": "1920x1080"
}
```

**Response:**
```json
{
  "status": "ok",
  "server_time": "2026-02-25T06:00:00.000Z",
  "latest_update": {
    "version": "1.0.1",
    "note": "Bug fixes and improvements",
    "released_at": "2026-02-24T12:00:00.000Z"
  }
}
```

### C# Example

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using Newtonsoft.Json;

public class TelemetryService
{
    private readonly HttpClient _client;
    private readonly string _apiUrl;
    private readonly string _deviceId;

    public TelemetryService(string apiUrl)
    {
        _client = new HttpClient();
        _apiUrl = apiUrl;
        _deviceId = GetDeviceId();
    }

    private string GetDeviceId()
    {
        return Environment.MachineName + "-" + Environment.UserName;
    }

    public async Task SendHeartbeat(string workspace, string username, string appVersion)
    {
        var process = Process.GetCurrentProcess();
        var ramMb = process.WorkingSet64 / (1024.0 * 1024.0);

        var payload = new
        {
            device_id = _deviceId,
            workspace_subdomain = workspace,
            username = username,
            app_version = appVersion,
            ram_usage_mb = Math.Round(ramMb, 1),
            os_info = Environment.OSVersion.ToString(),
            screen_resolution = $"{System.Windows.Forms.Screen.PrimaryScreen.Bounds.Width}x{System.Windows.Forms.Screen.PrimaryScreen.Bounds.Height}"
        };

        var json = JsonConvert.SerializeObject(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _client.PostAsync($"{_apiUrl}/api/system/telemetry/heartbeat", content);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadAsStringAsync();
                // Check for updates in result.latest_update
            }
        }
        catch (Exception ex)
        {
            // Log error
        }
    }
}
```

### Recommended Usage

- Send heartbeat every 30 seconds
- Check `latest_update` in response for version updates
- Show notification if new version available

## License

MIT

## Credits

Developed by Barida Makina - Industrial Solutions
