# Household Management System Using Distributed Microservices

## Midterm Project Report

**Student name(s):** [Enter student name(s)]  
**Student ID(s):** [Enter student ID(s)]  
**Course:** [Enter course name]  
**Instructor:** [Enter instructor name]  
**Submission date:** [Enter submission date]

> **Evidence note:** Replace every `[Insert screenshot...]`, `[Enter ...]`, and `[YOUR_EC2_PUBLIC_IP]` placeholder before submitting. Do not include real passwords, JWT tokens, MongoDB credentials, or `.env` files in the report.

---

## I. Project Introduction

The Household Management System is a backend-only distributed application that helps household administrators and members organize household information, chores, expenses, and shopping items.

The system is implemented using independent Node.js and Express microservices. Each service has a focused responsibility and communicates through an API Gateway. MongoDB Atlas is used for persistent storage. JWT is used for authentication, and role-based access control separates Admin and Member permissions.

The application is containerized with Docker. Nginx is included as a reverse proxy and load-balancing component. The planned production deployment uses AWS EC2 instances and MongoDB Atlas.

### Technology stack

- Node.js 24
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Token (JWT)
- bcryptjs password hashing
- Docker and Docker Compose
- Nginx
- AWS EC2
- Postman

### Main benefits

- Separate services can be developed and deployed independently.
- Authentication is centralized through the Login Service and API Gateway.
- Data is stored persistently in MongoDB Atlas.
- Admin and Member permissions are enforced at the gateway and service levels.
- Docker provides repeatable development and deployment environments.

---

## II. Problem Statement

Households often manage chores, expenses, and shopping requirements using informal conversations or separate documents. This creates several problems:

1. Household tasks may not have a clear owner.
2. Members may not know which chores are assigned to them.
3. Shared expenses are difficult to track consistently.
4. Shopping requirements can be forgotten.
5. All users may have the same access level when different permissions are required.
6. A single monolithic application can be difficult to scale and maintain.

The proposed system addresses these problems with a distributed backend platform. Household information, chores, expenses, and shopping items are separated into services while remaining accessible through one gateway.

---

## III. Project Objectives

The objectives of this project are:

1. Build a backend-only household management platform.
2. Implement at least two user roles: Admin and Member.
3. Provide Registration and Login microservices.
4. Generate and validate JWT access tokens.
5. Implement role-based authorization through the API Gateway.
6. Implement database-backed CRUD operations.
7. Separate functionality into independent microservices.
8. Containerize the system using Docker.
9. Use Nginx as a reverse proxy and load-balancing component.
10. Deploy the services on AWS EC2 instances.
11. Test successful and unsuccessful authentication and authorization scenarios using Postman.

---

## IV. User Roles

### 1. Admin

The Admin is responsible for managing household data and system records.

Admin permissions include:

- Create households.
- View all household records.
- Update household records.
- Delete household records.
- Create and assign chores.
- View all chores.
- Update chores.
- Delete chores.
- View all expenses and shopping items.
- Delete expenses and shopping items.

### 2. Member

The Member uses the system to complete assigned tasks and record household activities.

Member permissions include:

- Register as a Member.
- Log in and receive a JWT.
- View permitted household data.
- View chores assigned to the Member.
- Update the status of an assigned chore.
- Create expenses.
- View and update the Member's own expenses.
- Create shopping items.
- View and update the Member's own shopping items.

Member restrictions include:

- Cannot create a household.
- Cannot create or assign chores.
- Cannot delete expenses.
- Cannot delete shopping items.
- Cannot perform Admin-only operations.

### Role permission summary

| Operation | Admin | Member |
|---|---:|---:|
| Register | No, public registration creates Members | Public |
| Login | Yes | Yes |
| Create household | Yes | No |
| View households | Yes | Yes, permitted records |
| Update household | Yes | No |
| Delete household | Yes | No |
| Create chore | Yes | No |
| View chores | Yes | Assigned chores |
| Update chore | Yes | Assigned chore status |
| Delete chore | Yes | No |
| Create expense | Yes | Yes |
| View expenses | All | Own records |
| Update expense | Yes | Own records |
| Delete expense | Yes | No |
| Create shopping item | Yes | Yes |
| View shopping items | All | Own records |
| Update shopping item | Yes | Own records |
| Delete shopping item | Yes | No |

---

## V. Architecture Diagram

### Logical architecture

```text
                         +----------------+
                         |    Postman     |
                         +--------+-------+
                                  |
                                  v
                         +----------------+
                         | Nginx :8080   |
                         | Reverse Proxy |
                         +--------+-------+
                                  |
                                  v
                         +----------------+
                         | API Gateway   |
                         | :3000         |
                         | JWT + RBAC    |
                         +--------+-------+
                                  |
       +--------------------------+--------------------------+
       |             |             |          |              |
       v             v             v          v              v
  Registration    Login      Household    Chore        Expense
    :3001         :3002        :3003       :3004         :3005
                                                               |
                                                               v
                                                     Shopping List :3006
                                                               |
                                                               v
                                                     MongoDB Atlas
```

### Request flow

1. A client sends a request from Postman.
2. Nginx receives and forwards the request.
3. The API Gateway validates the JWT for protected routes.
4. The API Gateway checks the user's role and HTTP method.
5. The gateway forwards the request to the correct microservice.
6. The microservice validates the JWT again.
7. The microservice reads or writes data in MongoDB Atlas.
8. The response returns through the gateway to the client.

### Source-code architecture

Each service is an independent Node.js application with its own:

- `app.js`
- `package.json`
- `Dockerfile`
- Environment configuration
- Database model where required
- Authentication middleware where required

---

## VI. Microservice Table

| Microservice | Port | Main responsibility | Database |
|---|---:|---|---|
| API Gateway | 3000 | Public entry point, routing, JWT verification, RBAC | No direct database |
| Registration Service | 3001 | Create Member accounts and hash passwords | MongoDB Atlas |
| Login Service | 3002 | Verify credentials and issue JWT tokens | MongoDB Atlas |
| Household Service | 3003 | Household CRUD operations | MongoDB Atlas |
| Chore Service | 3004 | Chore assignment and status management | MongoDB Atlas |
| Expense Service | 3005 | Shared expense CRUD operations | MongoDB Atlas |
| Shopping List Service | 3006 | Shopping item CRUD operations | MongoDB Atlas |
| Nginx | 8080 | Reverse proxy and load balancing | No database |

### Team responsibility allocation

| Team member | Assigned functionality |
|---|---|
| [Member 1] | Household Service and Chore Service |
| [Member 2] | Expense Service and Shopping List Service |
| Shared | API Gateway, Registration, Login, Docker, Nginx, testing, deployment |

---

## VII. API Documentation

All public requests are sent through the API Gateway. The local gateway base URL is:

```text
http://localhost:3000
```

For the deployed version, replace it with:

```text
http://[YOUR_EC2_PUBLIC_IP]
```

Protected endpoints require:

```text
Authorization: Bearer [JWT_TOKEN]
```

### API Gateway and authentication APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Check gateway status |
| POST | `/api/register` | Public | Register a Member |
| POST | `/api/login` | Public | Login and receive a JWT |

### Household APIs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/households` | Admin, Member | List permitted households |
| GET | `/api/households/:id` | Admin, Member | Get one household |
| POST | `/api/households` | Admin | Create a household |
| PATCH | `/api/households/:id` | Admin | Update a household |
| DELETE | `/api/households/:id` | Admin | Delete a household |

### Chore APIs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/chores` | Admin, Member | List all or assigned chores |
| GET | `/api/chores/:id` | Admin, Member | Get one chore |
| POST | `/api/chores` | Admin | Create and assign a chore |
| PATCH | `/api/chores/:id` | Admin, Member | Update chore or assigned status |
| DELETE | `/api/chores/:id` | Admin | Delete a chore |

### Expense APIs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/expenses` | Admin, Member | List all or own expenses |
| GET | `/api/expenses/:id` | Admin, Member | Get one expense |
| POST | `/api/expenses` | Admin, Member | Create an expense |
| PATCH | `/api/expenses/:id` | Admin, Member | Update an own expense |
| DELETE | `/api/expenses/:id` | Admin | Delete an expense |

### Shopping List APIs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/shopping-items` | Admin, Member | List all or own shopping items |
| GET | `/api/shopping-items/:id` | Admin, Member | Get one shopping item |
| POST | `/api/shopping-items` | Admin, Member | Create a shopping item |
| PATCH | `/api/shopping-items/:id` | Admin, Member | Update an own shopping item |
| DELETE | `/api/shopping-items/:id` | Admin | Delete a shopping item |

### Example request

```http
POST /api/expenses
Authorization: Bearer [MEMBER_JWT]
Content-Type: application/json
```

```json
{
  "householdId": "[HOUSEHOLD_ID]",
  "description": "Cleaning supplies",
  "amount": 12.5,
  "category": "supplies",
  "date": "2026-10-18T00:00:00.000Z"
}
```

Expected successful response status:

```text
201 Created
```

---

## VIII. Database Design

MongoDB Atlas is used as the persistent database. The services use Mongoose models and connect through the `MONGODB_URI` environment variable.

### Collections

| Collection | Service | Purpose |
|---|---|---|
| `users` | Registration/Login | User accounts, roles, and password hashes |
| `households` | Household | Household name, address, and owner |
| `chores` | Chore | Chore title, assignment, status, and due date |
| `expenses` | Expense | Description, amount, category, and creator |
| `shoppingitems` | Shopping List | Item name, quantity, category, and purchased status |

### User schema

Fields:

- `name`
- `email`
- `passwordHash`
- `role`
- `createdAt`
- `updatedAt`

The password is never stored in plain text. Registration hashes the password with bcryptjs.

### Household schema

Fields:

- `name`
- `address`
- `ownerId`
- `createdAt`
- `updatedAt`

### Chore schema

Fields:

- `householdId`
- `title`
- `description`
- `assignedTo`
- `status`
- `dueDate`
- `createdAt`
- `updatedAt`

Allowed chore statuses:

```text
pending
in_progress
completed
```

### Expense schema

Fields:

- `householdId`
- `createdBy`
- `description`
- `amount`
- `category`
- `date`
- `createdAt`
- `updatedAt`

Allowed expense categories:

```text
food, utilities, rent, maintenance, supplies, other
```

### Shopping item schema

Fields:

- `householdId`
- `createdBy`
- `name`
- `quantity`
- `category`
- `purchased`
- `createdAt`
- `updatedAt`

### Required screenshots

- [Insert screenshot: MongoDB Atlas collections]
- [Insert screenshot: users collection]
- [Insert screenshot: households collection]
- [Insert screenshot: chores collection]
- [Insert screenshot: expenses collection]
- [Insert screenshot: shoppingitems collection]
- [Insert screenshot: model/schema code]

Hide credentials, password hashes, and private connection information.

---

## IX. JWT and RBAC

### Registration

The Registration Service:

1. Validates name, email, and password.
2. Normalizes the email to lowercase.
3. Hashes the password using bcryptjs.
4. Creates the account with the `Member` role.
5. Stores the user in MongoDB Atlas.

Public registration cannot create an Admin account. The first Admin is created using the protected seed process.

### Login

The Login Service:

1. Finds the user by email.
2. Compares the submitted password with the bcrypt hash.
3. Creates a JWT containing the user ID and role.
4. Sets the issuer to `household-management`.
5. Applies the configured expiration time.
6. Returns the token to the client.

### JWT verification

Protected requests must include:

```http
Authorization: Bearer [TOKEN]
```

The gateway rejects:

- Missing tokens with `401 Unauthorized`.
- Invalid tokens with `401 Unauthorized`.
- Expired tokens with `401 Unauthorized`.

### Role-based authorization

The API Gateway maps HTTP methods to allowed roles. For example:

```text
POST /api/households  → Admin only
POST /api/chores      → Admin only
POST /api/expenses    → Admin and Member
DELETE /api/expenses  → Admin only
```

Business services also validate the JWT and apply ownership checks. This provides defense in depth if a service is accessed internally.

### Required screenshots

- [Insert screenshot: successful Admin login]
- [Insert screenshot: successful Member login]
- [Insert screenshot: wrong password returning 401]
- [Insert screenshot: invalid token returning 401]
- [Insert screenshot: Member attempting Admin operation returning 403]

Never show full JWT tokens in the submitted report.

---

## X. Docker Implementation

Each Node.js microservice has its own Dockerfile and uses:

```dockerfile
FROM node:24-alpine
```

Nginx uses the separate image:

```yaml
image: nginx:1.27-alpine
```

Docker Compose connects the services to the `household-net` bridge network. Only the API Gateway and Nginx ports are published for local testing.

### Build and run commands

```powershell
docker compose down
docker compose up --build -d
docker compose ps
```

### Expected containers

```text
api-gateway
registration-service
login-service
household-service
chore-service
expense-service
shopping-list-service
nginx
```

### Environment configuration

The `.env` files contain private values such as:

- MongoDB connection URI
- JWT secret
- Admin password

These files must not be uploaded to GitHub or included in screenshots. The submitted source code should contain no credentials.

### Required screenshots

- [Insert screenshot: Dockerfiles]
- [Insert screenshot: docker-compose.yml]
- [Insert screenshot: `docker compose ps`]
- [Insert screenshot: gateway health response]
- [Insert screenshot: Nginx container running]

---

## XI. EC2 Deployment

The deployment is designed for a maximum of three EC2 instances.

### Proposed deployment layout

| EC2 instance | Services |
|---|---|
| EC2-1 | Nginx, API Gateway, Registration, Login |
| EC2-2 | Household and Chore services |
| EC2-3 | Expense, Shopping List, and second Chore replica |

MongoDB Atlas remains a managed cloud database instead of running as a local container.

### Deployment steps

1. Create the EC2 instances.
2. Install Docker and Docker Compose.
3. Copy the project source to the required instances.
4. Configure each service's private environment variables.
5. Use the private IP addresses for internal service communication.
6. Configure MongoDB Atlas Network Access for the EC2 outbound IP addresses.
7. Configure security groups.
8. Start the containers with Docker Compose.
9. Configure Nginx with the private IP addresses of its backends.
10. Test the public gateway URL from Postman.

### Security group plan

The public instance should expose only:

- HTTP/HTTPS or the selected Nginx port.
- SSH from the developer's IP address.

Internal microservice ports should accept traffic only from the gateway security group. Permanent access from `0.0.0.0/0` should not be used for internal services or MongoDB.

### Final EC2 URL

Replace the placeholder after deployment:

```text
http://[YOUR_EC2_PUBLIC_IP]/api/login
```

### Required screenshots

- [Insert screenshot: EC2 instances]
- [Insert screenshot: EC2 security groups]
- [Insert screenshot: containers running on EC2]
- [Insert screenshot: Postman request using EC2 public IP]

---

## XII. Nginx Load Balancing

Nginx is infrastructure, not an application user role. It does not represent Admin or Member. Its responsibilities are:

- Reverse proxy
- Request forwarding
- Load balancing
- Preserving the Authorization header

The application roles are enforced by the API Gateway and business services.

### Local configuration

Nginx listens on port `8080` and forwards Chore requests to the Chore Service:

```text
GET http://localhost:8080/api/chores
```

The request is forwarded internally to:

```text
chore-service:3004
```

### EC2 configuration

For the EC2 demonstration, configure two Chore service backends:

```nginx
upstream chore_backends {
    server [PRIVATE_IP_A]:3004;
    server [PRIVATE_IP_B]:3004;
}
```

Replace both placeholders with actual private IP addresses.

### Demonstration

1. Run two Chore service instances.
2. Start Nginx.
3. Send repeated requests through the Nginx public address.
4. Show logs or an instance identifier proving that both backends received requests.

### Required screenshots

- [Insert screenshot: nginx.conf]
- [Insert screenshot: Nginx container]
- [Insert screenshot: two Chore replicas]
- [Insert screenshot: requests sent through Nginx]
- [Insert screenshot: logs proving traffic reached both backends]

---

## XIII. Testing Evidence

Testing was performed using Postman.

### Authentication tests

| Test | Request | Expected result |
|---|---|---:|
| Register Member | `POST /api/register` | `201 Created` |
| Duplicate email | `POST /api/register` | `409 Conflict` |
| Valid Member login | `POST /api/login` | `200 OK` |
| Valid Admin login | `POST /api/login` | `200 OK` |
| Wrong password | `POST /api/login` | `401 Unauthorized` |
| Missing token | Protected endpoint without header | `401 Unauthorized` |
| Invalid token | Protected endpoint with bad token | `401 Unauthorized` |

### Authorization tests

| Test | Expected result |
|---|---:|
| Member creates household | `403 Forbidden` |
| Member creates chore | `403 Forbidden` |
| Admin creates household | `201 Created` |
| Admin creates chore | `201 Created` |
| Member updates assigned chore status | `200 OK` |
| Member creates expense | `201 Created` |
| Member deletes expense | `403 Forbidden` |
| Admin deletes expense | `200 OK` |
| Member creates shopping item | `201 Created` |
| Member deletes shopping item | `403 Forbidden` |
| Admin deletes shopping item | `200 OK` |

### CRUD tests

The following operations were tested:

- Household create, read, update, and delete.
- Chore create, read, update, and delete.
- Expense create, read, update, and delete.
- Shopping item create, read, update, and delete.

### Screenshot checklist

- [Insert screenshot: registration success]
- [Insert screenshot: login success]
- [Insert screenshot: wrong password]
- [Insert screenshot: invalid token]
- [Insert screenshot: Admin creates household]
- [Insert screenshot: Member receives 403]
- [Insert screenshot: chore CRUD]
- [Insert screenshot: expense CRUD]
- [Insert screenshot: shopping item CRUD]
- [Insert screenshot: MongoDB data]
- [Insert screenshot: EC2 public IP request]
- [Insert screenshot: Nginx load balancing]

The detailed request sequence is available in [POSTMAN_TEST_PLAN.md](./POSTMAN_TEST_PLAN.md).

---

## XIV. GitHub Link

GitHub repository:

```text
[PASTE YOUR GITHUB REPOSITORY URL HERE]
```

The repository should contain:

- Microservice source code
- Dockerfiles
- Docker Compose configuration
- Nginx configuration
- Postman test plan
- README documentation

The repository must not contain:

- `.env` files
- MongoDB passwords
- JWT secrets
- Admin passwords
- Private keys
- Unredacted JWT tokens

---

## XV. Conclusion

The Household Management System demonstrates a distributed backend architecture for managing household data, chores, expenses, and shopping items.

The project separates functionality into seven application microservices:

1. API Gateway
2. Registration Service
3. Login Service
4. Household Service
5. Chore Service
6. Expense Service
7. Shopping List Service

The system includes Admin and Member roles, bcrypt password hashing, JWT authentication, API Gateway role-based authorization, database-backed CRUD operations, Docker containerization, Nginx reverse proxying, and an EC2 deployment plan.

Postman tests demonstrate successful requests, invalid credentials, invalid tokens, and unauthorized role access. MongoDB Atlas screenshots demonstrate persistent data storage. Docker and Nginx screenshots demonstrate containerization and traffic routing.

After replacing the evidence placeholders with actual screenshots, EC2 information, team details, and the GitHub URL, this report documents the implementation and testing of the Household Management System.
