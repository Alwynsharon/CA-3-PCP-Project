# Data Access Control Management System (FSD-25)

A full-stack application that lets administrators create datasets and assign access to specific users. Users can only view datasets that have been explicitly assigned to them — every read is enforced at the backend.

## 1. Project Overview

- **Assignment ID:** FSD-25
- **Goal:** Build a Data Access Control Management System with role-based access (USER / ADMIN), JWT authentication, and persistent storage in a database.
- **Critical rule:** Users may only access datasets explicitly assigned to them. The backend rejects any other access attempt.

## 2. Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, Vite, React Router, Axios           |
| Backend     | Node.js, Express                              |
| Database    | MongoDB (via Mongoose)                        |
| Auth        | JWT (jsonwebtoken) + bcryptjs                 |
| Config      | dotenv, environment variables                 |

## 3. User Roles & Permissions

### USER
- Register and log in
- View list of datasets assigned to them
- Open dataset details (read-only)

### ADMIN
- Register and log in
- Create / update / delete datasets
- Assign or revoke dataset access for users
- View all access mappings

Role enforcement happens in two places:
1. **Backend middleware** (`requireAuth`, `requireRole`) — verifies the JWT and the user's role on every protected route.
2. **Frontend route guards** (`PrivateRoute`) — hides admin views from users in the UI; the backend remains the source of truth.

## 4. API Endpoints

All `/api/*` routes (except `/api/auth/register` and `/api/auth/login`) require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Path        | Auth   | Body                                            | Description                |
|--------|-------------|--------|-------------------------------------------------|----------------------------|
| POST   | `/register` | Public | `{ name, email, password, role? }`              | Create account, returns JWT |
| POST   | `/login`    | Public | `{ email, password }`                           | Returns JWT                |
| GET    | `/me`       | Auth   | —                                               | Returns current user        |

### Datasets — `/api/datasets`
| Method | Path     | Auth          | Description                                                          |
|--------|----------|---------------|----------------------------------------------------------------------|
| GET    | `/`      | Auth          | ADMIN: all datasets. USER: only datasets assigned to them.           |
| GET    | `/:id`   | Auth          | Returns a dataset. **USER blocked with 403 if not assigned.**        |
| POST   | `/`      | ADMIN         | Create dataset. Body: `{ name, description?, category?, content? }`  |
| PUT    | `/:id`   | ADMIN         | Update dataset.                                                      |
| DELETE | `/:id`   | ADMIN         | Delete dataset and all related access mappings.                      |

### Access Mappings — `/api/access` (ADMIN only)
| Method | Path     | Body                            | Description                  |
|--------|----------|---------------------------------|------------------------------|
| GET    | `/`      | —                               | List all access mappings     |
| POST   | `/`      | `{ userId, datasetId }`         | Grant access                 |
| DELETE | `/:id`   | —                               | Revoke by mapping id         |
| DELETE | `/`      | `{ userId, datasetId }`         | Revoke by user + dataset     |

### Users — `/api/users` (ADMIN only)
| Method | Path | Description                                       |
|--------|------|---------------------------------------------------|
| GET    | `/`  | List all users (used by ADMIN UI for assignment)  |

## 5. Database Schema

### `users`
| Field         | Type     | Notes                          |
|---------------|----------|--------------------------------|
| `_id`         | ObjectId | Primary key                    |
| `name`        | String   | Required                       |
| `email`       | String   | Required, unique, lowercased   |
| `passwordHash`| String   | bcrypt hash                    |
| `role`        | String   | `USER` or `ADMIN`              |
| `createdAt`   | Date     | Auto                           |
| `updatedAt`   | Date     | Auto                           |

### `datasets`
| Field         | Type     | Notes                                |
|---------------|----------|--------------------------------------|
| `_id`         | ObjectId | Primary key                          |
| `name`        | String   | Required                             |
| `description` | String   | Optional                             |
| `category`    | String   | Optional, defaults to `general`      |
| `content`     | String   | The actual dataset payload (text)    |
| `createdBy`   | ObjectId | Ref `users`                          |
| `createdAt`   | Date     | Auto                                 |
| `updatedAt`   | Date     | Auto                                 |

### `accessmappings`
| Field         | Type     | Notes                                       |
|---------------|----------|---------------------------------------------|
| `_id`         | ObjectId | Primary key                                 |
| `user`        | ObjectId | Ref `users`                                 |
| `dataset`     | ObjectId | Ref `datasets`                              |
| `grantedBy`   | ObjectId | Ref `users` (the ADMIN who granted)         |
| `createdAt`   | Date     | Auto                                        |
| `updatedAt`   | Date     | Auto                                        |

> Compound unique index on `(user, dataset)` prevents duplicate grants.

## 6. Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### Backend
```bash
cd backend
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000
```

Backend `.env` keys:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dacms
JWT_SECRET=replace_me
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

### Frontend
```bash
cd frontend
cp .env.example .env        # adjust VITE_API_URL if backend isn't on :5000
npm install
npm run dev                 # http://localhost:5173
```

### Quick smoke test
1. Open `http://localhost:5173/register`, create an `ADMIN` account.
2. Log out, register a second account as `USER`.
3. Log back in as ADMIN → create a dataset → grant access to the USER.
4. Log in as USER → confirm only the assigned dataset is visible.
5. Try `GET /api/datasets/<some-other-id>` with the USER's token → should return `403`.

## 7. Live Deployment Links

> Replace these placeholders after deploying.

- Frontend: `https://your-frontend-url.example.com`
- Backend:  `https://your-backend-url.example.com`
- Repo:     `https://github.com/<your-username>/<your-repo>`

### Suggested deployment
- **Backend:** Render / Railway / Fly.io. Set the same env vars from `.env.example`. Use **MongoDB Atlas** for `MONGO_URI`. Set `CORS_ORIGIN` to your deployed frontend URL.
- **Frontend:** Vercel / Netlify. Set `VITE_API_URL` to the deployed backend URL + `/api`.

## 8. Project Structure

```
PCP CA-3/
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── middleware/auth.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Dataset.js
│       │   └── AccessMapping.js
│       └── routes/
│           ├── auth.js
│           ├── datasets.js
│           ├── access.js
│           └── users.js
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── auth.jsx
        ├── styles.css
        ├── components/
        │   ├── Navbar.jsx
        │   └── PrivateRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── UserDashboard.jsx
            ├── AdminDashboard.jsx
            └── DatasetDetail.jsx
```

## 9. How the Critical Business Rule Is Enforced

For any USER request to `/api/datasets` or `/api/datasets/:id`:

1. `requireAuth` rejects requests without a valid JWT (401).
2. The route handler queries `AccessMapping` for `{ user: req.user._id, dataset: id }`.
3. If no mapping exists, the request is rejected with `403 Access denied: dataset is not assigned to you`.
4. ADMIN role bypasses the mapping check (admins can see everything).

This guarantees that even if a USER guesses or crafts a dataset id, the backend will refuse to return it.
# CA-3-PCP-Project
