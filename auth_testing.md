# Auth-Gated App Testing Playbook

## Step 1: Test User & Session already created in MongoDB
- Test user: user_id=test-user-001, session_token=test_session_hydra_001
- Admin user: user_id=admin-user-001, session_token=admin_session_hydra_001

## Step 2: Test Backend API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer test_session_hydra_001"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "test_session_hydra_001",
    "domain": "artifact-id-1.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://artifact-id-1.preview.emergentagent.com/dashboard")
```
