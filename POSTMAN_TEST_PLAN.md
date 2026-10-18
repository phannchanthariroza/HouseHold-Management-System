# Postman Test Plan

Set environment variable `base_url` to `http://localhost:3000`.

## 1. Health
GET `{{base_url}}/health` -> 200

## 2. Register Member
POST `{{base_url}}/api/register`
Body -> raw -> JSON:
{
  "name": "Test Member",
  "email": "member1@example.com",
  "password": "TestPass123!"
}
Expected: 201. Public registration creates role Member. Repeat same email: 409.

## 3. Login
POST `{{base_url}}/api/login`
Body:
{
  "email": "member1@example.com",
  "password": "TestPass123!"
}
Expected: 200 with token. Save token as `member_token`.
Wrong password: 401.

Admin login uses credentials configured in registration-service `.env` before running `node seed-admin.js`. Save token as `admin_token`.

## 4. Invalid token
GET `{{base_url}}/api/households`
Authorization -> Bearer Token -> `bad-token`
Expected: 401.

## 5. Household CRUD
POST `{{base_url}}/api/households` with Admin token:
{
  "name": "Roza Home",
  "address": "Siem Reap"
}
Expected: 201. Save returned data._id as `household_id`.
GET `{{base_url}}/api/households` with a token.
GET `{{base_url}}/api/households/{{household_id}}`
PATCH `{{base_url}}/api/households/{{household_id}}` body:
{ "name": "Updated Roza Home", "address": "Siem Reap" }
DELETE `{{base_url}}/api/households/{{household_id}}` with Admin token.
Expected statuses: 201, 200, 200, 200, 200.

## 6. Chore CRUD
POST `{{base_url}}/api/chores` with Admin token:
{
  "householdId": "PASTE_VALID_HOUSEHOLD_OBJECT_ID",
  "title": "Clean the kitchen",
  "description": "Wipe counters and sweep",
  "assignedTo": "PASTE_MEMBER_USER_OBJECT_ID",
  "status": "pending",
  "dueDate": "2026-10-20T00:00:00.000Z"
}
Expected: 201. Test GET list, GET by ID, PATCH status and DELETE with Admin.

## 7. Expense CRUD
POST `{{base_url}}/api/expenses` with Member or Admin token:
{
  "householdId": "PASTE_VALID_HOUSEHOLD_OBJECT_ID",
  "description": "Cleaning supplies",
  "amount": 12.5,
  "category": "supplies",
  "date": "2026-10-17T00:00:00.000Z"
}
Expected: 201. Test GET list, GET by ID, PATCH and Admin DELETE.

## 8. RBAC
Use Member token for POST /api/households or POST /api/chores. Expected 403.
Use Member token for DELETE a household/chore/expense. Expected 403.
Use malformed token on a protected route. Expected 401.
Note: household/member ownership rules should be further tightened for the final demo; this starter shows role checks and basic per-record checks.

## 9. Shopping List CRUD
POST `{{base_url}}/api/shopping-items` with a Member or Admin token:
{
  "householdId": "PASTE_VALID_HOUSEHOLD_OBJECT_ID",
  "name": "Dish soap",
  "quantity": 2,
  "category": "cleaning"
}
Expected: 201. Test GET list, GET by ID, PATCH `purchased` to `true`, and Admin DELETE.

## Screenshots
Capture the full Postman request URL, method, status and response. Also capture Atlas collection/schema evidence, code, Docker containers, EC2 public gateway requests, invalid token and role denial, and load-balancer traffic distribution. Never expose real passwords, JWTs, or MongoDB credentials in report screenshots.
