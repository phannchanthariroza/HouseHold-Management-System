# Household Management System

Backend-only household and chore management system using Node.js, Express,
MongoDB Atlas, JWT/RBAC, Docker, Nginx, and Postman.

## Services

| Service | Port | Purpose |
|---|---:|---|
| API Gateway | 3000 | Public API, JWT validation, RBAC |
| Registration | 3001 | Creates Member accounts |
| Login | 3002 | Verifies credentials and creates JWTs |
| Household | 3003 | Household CRUD |
| Chore | 3004 | Chore CRUD and status updates |
| Nginx | 8080 | Public reverse proxy and load balancer |

Roles:

- **Admin:** manages households and chores.
- **Member:** views permitted data and updates assigned chore status.

Public registration always creates a Member. Create an Admin with
`registration-service/seed-admin.js`.

## Environment

Create a private `.env` file in the repository root. Do not commit it.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/household_management?retryWrites=true&w=majority
JWT_SECRET=use-a-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN=2h
ADMIN_NAME=Household Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-password-of-at-least-12-characters
```

All services must use the same `MONGODB_URI` and `JWT_SECRET`.

## Local Docker

Requirements: Git, Docker Desktop, MongoDB Atlas, and Postman.

From the repository root:

```powershell
docker compose up --build -d
docker compose ps
```

Test the local gateway:

```text
GET http://localhost:8080/health
```

Create the Admin:

```powershell
docker compose exec registration-service node seed-admin.js
```

## API examples

Use this base URL:

```text
http://EC2_1_PUBLIC_IP:8080
```

```text
POST /api/register
POST /api/login
GET  /api/households
POST /api/households
PATCH /api/households/:id
DELETE /api/households/:id
GET  /api/chores
POST /api/chores
PATCH /api/chores/:id
DELETE /api/chores/:id
```

Protected requests require:

```text
Authorization: Bearer YOUR_TOKEN
```

## Three-EC2 deployment

| EC2 | Services | Compose file |
|---|---|---|
| EC2-1 | Nginx, Gateway, Registration, Login | `docker-compose.ec2-gateway.yml` |
| EC2-2 | Household, Chore replica A | `docker-compose.ec2-household.yml` |
| EC2-3 | Chore replica B | `docker-compose.ec2-chore.yml` |

On each EC2 instance:

```bash
cd ~/HouseHold-Management-System
git pull
```

Create a private `.env` on each machine. Use the same `MONGODB_URI`,
`JWT_SECRET`, and `JWT_EXPIRES_IN` on all three machines.

On EC2-1, also set:

```env
HOUSEHOLD_URL=http://EC2_2_PRIVATE_IP:3003
CHORE_URL=http://EC2_2_PRIVATE_IP:3004
```

Start the correct stack:

```bash
# EC2-1
docker compose -f docker-compose.ec2-gateway.yml up --build -d

# EC2-2
docker compose -f docker-compose.ec2-household.yml up --build -d

# EC2-3
docker compose -f docker-compose.ec2-chore.yml up --build -d
```

In `nginx/nginx.ec2.conf`, replace the two backend placeholders:

```nginx
upstream chore_backends {
    server EC2_2_PRIVATE_IP:3004;
    server EC2_3_PRIVATE_IP:3004;
}
```

Test Nginx on EC2-1:

```bash
docker compose -f docker-compose.ec2-gateway.yml exec nginx nginx -t
curl -i http://localhost:8080/health
```

Use only the EC2-1 public IP in Postman. Keep ports `3000`-`3004` private
and allow backend traffic only from approved security groups or private IPs.

## Load-balancing evidence

Send this request several times:

```text
GET http://EC2_1_PUBLIC_IP:8080/api/chores
```

Then check the Chore logs on EC2-2 and EC2-3:

```bash
docker logs -f chore-service
```

The logs should show requests from both `chore-ec2-2` and `chore-ec2-3`.


