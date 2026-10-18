# Household Management System (backend only)

Stack: Node.js, Express, Mongoose, MongoDB Atlas, JWT, Docker, Nginx, Postman.

## Services
- API Gateway: 3000 (public entry point)
- Registration: 3001
- Login: 3002
- Household: 3003
- Chore: 3004
- Expense: 3005
- Shopping List: 3006
- MongoDB Atlas: managed database

Each service is a separate Express application/container. The gateway validates JWTs and applies role rules. Business services also verify JWTs. For production, keep internal service ports private and allow inbound traffic only from the gateway/security group.

## Local setup (Windows PowerShell)
1. Install Node.js LTS, Git, Docker Desktop and Postman.
2. Create a MongoDB Atlas project/cluster, database user with readWrite access, and allow your current public IP under Network Access.
3. Fill in the private `.env` file at the repository root with the Atlas URI and a strong random JWT_SECRET. Do not commit `.env`.
4. In each service folder, run `npm install`. You can run services in separate PowerShell windows:
   - `cd registration-service; npm install; npm start`
   - `cd login-service; npm install; npm start`
   - `cd household-service; npm install; npm start`
   - `cd chore-service; npm install; npm start`
   - `cd expense-service; npm install; npm start`
   - `cd shopping-list-service; npm install; npm start`
   - `cd api-gateway; npm install; npm start`
5. For standalone (non-Docker) execution, fill in the `.env` file inside each service folder. Use the matching service port and the same `MONGODB_URI` and `JWT_SECRET`. The API Gateway does not need `MONGODB_URI`. Do not put credentials in source code. When using Docker Compose, only the root `.env` is required because `docker-compose.yml` supplies it to every container.
6. Create the first admin: in `registration-service`, run `node seed-admin.js` after setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in that service's `.env`. Seed script will refuse to overwrite an existing account.
7. Use Postman tests in the guide below.

## Local route examples
- GET http://localhost:3000/health
- POST http://localhost:3000/api/register
- POST http://localhost:3000/api/login
- POST http://localhost:3000/api/households
- GET http://localhost:3000/api/households
- POST http://localhost:3000/api/chores
- GET http://localhost:3000/api/chores
- POST http://localhost:3000/api/expenses
- GET http://localhost:3000/api/expenses
- POST http://localhost:3000/api/shopping-items
- GET http://localhost:3000/api/shopping-items

Authorization header: `Bearer <JWT>` for protected endpoints.

## Docker Compose
1. Configure the private root `.env` file.
2. Run `docker compose up --build`.
3. Open http://localhost:3000/health.
4. Compose keeps business services on an internal Docker network; only gateway port 3000 is published.
5. Nginx is available at http://localhost:8080 and proxies to the Chore service. For a local replica demonstration, run `docker compose up --build --scale chore-service=2 -d`; Docker DNS supplies the two Chore containers behind the Nginx upstream.

## Three-EC2 deployment suggestion
- EC2-1: API Gateway, Registration, Login, Nginx.
- EC2-2: Household Service and Chore Service.
- EC2-3: Expense Service, Shopping List Service, and a second replica of a chosen stateless business service.
- Use Docker on each host. Configure gateway upstream URLs with private IPs/DNS names of service hosts. Publish only the gateway HTTPS endpoint. Keep service ports restricted to the gateway/security group. Set MongoDB Atlas Network Access to the EC2 outbound IP(s) or approved egress address. Do not use 0.0.0.0/0 for database access as a permanent rule.
- If using Nginx across EC2 hosts, set `SERVICE_A` and `SERVICE_B` to the actual private IP:port targets. Health-check and verify traffic reaches both instances. A load balancer is not demonstrated merely by writing config; capture evidence of traffic distribution.
- For a real deployment, add TLS (e.g. AWS Application Load Balancer + ACM), process/container restart policy, logs, backups, and secret management.

## Security notes
- Public registration always creates Member accounts. Admin is provisioned by seed script.
- This is a coursework starter. For production, add rate limiting, email verification, password reset, audit logs, stricter CORS, centralized secrets, and more detailed household membership checks.
- IDs must belong to the authenticated user's household. Do not expose internal service ports publicly.
