<p align="center">
  <img src="ovarc-logo.jpg" alt="Company Logo" width="200"/>
</p>

# Bookstore Inventory API

A streamlined RESTful API for managing bookstore inventory with CSV uploads and PDF reports.

## Quick Start (Docker)

1. **Start Services**
   ```bash
   docker compose up --build -d
   ```

2. **Check Health**
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/inventory/upload` | Upload CSV inventory file |
| `GET`  | `/api/store` | List all stores |
| `GET`  | `/api/store/:id/download-report` | Download store PDF report |

## Testing

Use the provided sample data:
```bash
curl -X POST http://localhost:3000/api/inventory/upload \
  -F "file=@test-data/inventory-sample.csv"
```

## Tech Stack
Node.js, TypeScript, Express, PostgreSQL, Sequelize, Docker.
