# MQTT Core Application

A Spring Boot + React application that bridges an MQTT broker with persistent storage and a web-based dashboard.

## Architecture

```
sandbox/
├── core/          # Spring Boot REST API service
│   └── src/
└── gui/           # React + Vite standalone web application
    └── src/
```

### CORE (Spring Boot)
- Listens on **http://localhost:8088**
- Connects to an MQTT broker (Eclipse Paho v3)
- Stores all received messages to H2 (file-based, `./data/mqttcore.mv.db`)
- Provides a secured REST API (JWT Bearer tokens)
- H2 console available at **http://localhost:8088/h2-console**

### GUI (React + Vite)
- Listens on **http://localhost:5173** (dev mode)
- Proxies all `/api/*` requests to the CORE at port 8080
- Communicates exclusively via the CORE REST API

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 21 (LTS) |
| Maven | 3.9+ |
| Node.js | 18+ |
| npm | 9+ |
| MQTT Broker | Mosquitto (or any broker on `tcp://localhost:1883`) |

### Installing Mosquitto (Windows)
Download from https://mosquitto.org/download/ and start with:
```cmd
mosquitto -v
```

---

## Running the CORE

```cmd
cd core
mvn spring-boot:run
```

Or build a JAR first:
```cmd
mvn clean package -DskipTests
java -jar target/mqtt-core-1.0.0-SNAPSHOT.jar
```

The service starts on port 8080. On first run it:
1. Creates the H2 database at `./data/mqttcore.mv.db`
2. Creates roles `ADMIN` and `USER`
3. Creates default admin: **username:** `admin` / **password:** `admin123`

> **Change the default password in production!**

### CORE Configuration (`core/src/main/resources/application.properties`)

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `8080` | HTTP port |
| `mqtt.broker.url` | `tcp://localhost:1883` | MQTT broker address |
| `mqtt.broker.username` | _(empty)_ | Broker username |
| `mqtt.broker.password` | _(empty)_ | Broker password |
| `app.jwt.secret` | _(hex string)_ | JWT signing key |
| `app.jwt.expiration-ms` | `86400000` | Token TTL (24h) |
| `app.cors.allowed-origins` | `http://localhost:5173,...` | GUI origin(s) |

---

## Running the GUI

```cmd
cd gui
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

Log in with `admin` / `admin123`.

### Production build

```cmd
npm run build
```
Outputs to `gui/dist/` — serve with any static file server.

---

## REST API Reference

### Authentication

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/login` | `{username, password}` | Public |
| GET | `/api/auth/me` | — | Bearer |

Login response:
```json
{
  "token": "eyJ...",
  "type": "Bearer",
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["ROLE_ADMIN", "ROLE_USER"]
}
```

All subsequent requests require: `Authorization: Bearer <token>`

---

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | List messages (paginated, filterable) |
| GET | `/api/messages/{id}` | Get single message |
| GET | `/api/messages/topics` | List all distinct topics |

Query parameters for `GET /api/messages`:

| Param | Example | Description |
|-------|---------|-------------|
| `topic` | `sensors` | Filter by topic (contains, case-insensitive) |
| `from` | `2024-01-01T00:00:00` | ISO 8601 start time |
| `to` | `2024-12-31T23:59:59` | ISO 8601 end time |
| `page` | `0` | Page number (0-based) |
| `size` | `50` | Page size (max 200) |

---

### MQTT Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mqtt/subscriptions` | Any | List all subscriptions |
| POST | `/api/mqtt/subscriptions` | ADMIN | Add subscription |
| PATCH | `/api/mqtt/subscriptions/{id}/toggle?active=true` | ADMIN | Enable/disable |
| DELETE | `/api/mqtt/subscriptions/{id}` | ADMIN | Remove subscription |
| GET | `/api/mqtt/status` | Any | Broker connection status |
| POST | `/api/mqtt/publish` | ADMIN | Publish a message |

Create subscription body:
```json
{
  "topicFilter": "sensors/#",
  "qos": 1,
  "description": "All sensor readings"
}
```

Supports MQTT wildcards: `+` (single level), `#` (multi-level).

---

### User Management (ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/{id}` | Update user |
| PATCH | `/api/admin/users/{id}/deactivate` | Deactivate user |
| GET | `/api/admin/roles` | List all roles |
| POST | `/api/admin/roles` | Create role |
| DELETE | `/api/admin/roles/{id}` | Delete role |

---

## GUI Features

| Page | Route | Access |
|------|-------|--------|
| Login | `/login` | Public |
| Messages | `/messages` | All users |
| Subscriptions | `/subscriptions` | All users (view), ADMIN (manage) |
| Administration | `/admin` | ADMIN only |

### Messages page
- Paginated table of all received MQTT messages
- Filter by topic text, date-from, date-to
- Quick-filter buttons for known topics
- Click "View" to see full payload (auto-formats JSON)

### Subscriptions page
- Live broker connection indicator
- List of configured topic subscriptions
- ADMIN: add/delete subscriptions, pause/resume, publish test messages

### Admin page
- **Users tab**: create users, edit email/password/roles, deactivate accounts
- **Roles tab**: create and delete roles

---

## Security Notes

1. Change the default admin password immediately after first login
2. Change `app.jwt.secret` to a unique 256-bit hex string in production
3. Disable the H2 console in production: `spring.h2.console.enabled=false`
4. Use HTTPS in production (configure SSL in `application.properties` or behind a reverse proxy)
5. Set `mqtt.broker.username` and `mqtt.broker.password` if your broker requires authentication