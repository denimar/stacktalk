# REST/HTTP

## Framework

Use Express to map endpoints.

**Example:**
```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/users', (req, res) => {
  // implementation
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## REST Pattern

Use the REST pattern for queries, keeping resource names in English and plural, allowing navigability across related resources.

**Example:**
```typescript
// ✅ Prefer
GET /users
GET /users/:userId
GET /playlists/:playlistId/videos
GET /customers/:customerId/invoices

// ❌ Avoid
GET /getUsers
GET /user/:userId (singular)
```

## Resource Naming

Compound resources and verbs should use kebab-case.

**Example:**
```typescript
// ✅ Prefer
GET /scheduled-events
POST /users/:userId/change-password
GET /payment-methods
POST /orders/:orderId/process-payment

// ❌ Avoid
GET /scheduledEvents (camelCase)
GET /scheduled_events (snake_case)
```

## Resource Depth

Avoid creating endpoints with more than 3 resources.

**Example:**
```typescript
// ❌ Avoid - too deep
GET /channels/:channelId/playlists/:playlistId/videos/:videoId/comments

// ✅ Prefer - more direct
GET /videos/:videoId/comments
GET /comments?videoId=:videoId

// ✅ Or organize in a flatter way
GET /channels/:channelId/playlists
GET /playlists/:playlistId/videos
GET /videos/:videoId/comments
```

## Mutations and Actions

For mutations, don't follow REST strictly. Use a combination of REST to navigate resources and verbs to represent actions being performed, always with POST.

**Example:**
```typescript
// ✅ Prefer - verbs for specific actions
POST /users/:userId/change-password
POST /orders/:orderId/cancel
POST /invoices/:invoiceId/send-reminder
POST /accounts/:accountId/activate

// ❌ Avoid - generic PUT for specific actions
PUT /users/:userId
PUT /orders/:orderId

// ✅ PUT is appropriate for full resource replacement
PUT /users/:userId
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

## Data Format

The request and response payload format should always be JSON, unless otherwise specified.

**Example:**
```typescript
app.use(express.json());

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const user = createUser({ name, email });
  res.json({ id: user.id, name: user.name, email: user.email });
});

// Request
// Content-Type: application/json
// { "name": "John Doe", "email": "john@example.com" }

// Response
// Content-Type: application/json
// { "id": "123", "name": "John Doe", "email": "john@example.com" }
```

## HTTP Status Codes

### 200 - OK
Return when the request is successful.

**Example:**
```typescript
app.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  res.status(200).json(user);
});

app.post('/users', (req, res) => {
  const user = createUser(req.body);
  res.status(200).json(user);
});
```

### 404 - Not Found
Return if a resource is not found.

**Example:**
```typescript
app.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      userId: req.params.userId
    });
  }
  res.json(user);
});
```

### 500 - Internal Server Error
Return if it's an unexpected error.

**Example:**
```typescript
app.get('/users', (req, res) => {
  try {
    const users = getUsers();
    res.json(users);
  } catch (error) {
    console.error('Unexpected error fetching users', { error });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});
```

### 422 - Unprocessable Entity
Return if it's a business logic error.

**Example:**
```typescript
app.post('/orders/:orderId/cancel', (req, res) => {
  const order = getOrder(req.params.orderId);

  if (order.status === 'shipped') {
    return res.status(422).json({
      error: 'Cannot cancel shipped order',
      orderId: order.id,
      currentStatus: order.status
    });
  }

  cancelOrder(order.id);
  res.json({ message: 'Order cancelled successfully' });
});
```

### 400 - Bad Request
Return if the request is malformed.

**Example:**
```typescript
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email']
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      field: 'email'
    });
  }

  const user = createUser({ name, email });
  res.json(user);
});
```

### 401 - Unauthorized
Return if the user is not authenticated.

**Example:**
```typescript
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid token'
    });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is expired or invalid'
    });
  }

  res.json(user);
});
```

### 403 - Forbidden
Return if the user is not authorized.

**Example:**
```typescript
app.delete('/users/:userId', (req, res) => {
  const currentUser = getCurrentUser(req);
  const targetUserId = req.params.userId;

  // User is authenticated (401), but doesn't have permission
  if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'You are not allowed to delete this user'
    });
  }

  deleteUser(targetUserId);
  res.json({ message: 'User deleted successfully' });
});
```

## HTTP Client

Use Axios to make calls to external APIs.

**Example:**
```typescript
import axios from 'axios';

// GET request
async function getUser(userId: string) {
  try {
    const response = await axios.get(`https://api.example.com/users/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API request failed', {
        status: error.response?.status,
        message: error.message
      });
    }
    throw error;
  }
}

// POST request
async function createUser(userData: CreateUserData) {
  const response = await axios.post('https://api.example.com/users', userData, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
}

// Configure instance with defaults
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Middlewares

Use middlewares for cross-cutting concerns.

**Example:**
```typescript
// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}

// Validation middleware
function validateUserInput(req: Request, res: Response, next: NextFunction) {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  next();
}

// Usage
app.post('/users', authenticate, validateUserInput, (req, res) => {
  const user = createUser(req.body);
  res.json(user);
});
```
