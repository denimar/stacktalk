# Tests

## Framework

Use the Jest library to define test scenarios and expectations.

**Example:**
```typescript
import { describe, it, expect } from '@jest/globals';

describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John', email: 'john@example.com' });
    expect(user.name).toBe('John');
  });
});
```

## Execution

To run tests, use the command:
```bash
npm test
```

## Independence

Do not create dependencies between tests. It should be possible to run each one independently.

**Example:**
```typescript
// ❌ Avoid
let sharedUser: User;

it('should create user', () => {
  sharedUser = createUser({ name: 'John' });
});

it('should update user', () => {
  // depends on previous test
  updateUser(sharedUser.id, { name: 'Jane' });
});

// ✅ Prefer
it('should create user', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

it('should update user', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user.id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});
```

## AAA/GWT Structure

Follow the **Arrange, Act, Assert** or **Given, When, Then** principle to ensure maximum organization and readability within tests.

**Example:**
```typescript
it('should calculate total price with discount', () => {
  // Arrange (Given)
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const discountPercentage = 10;

  // Act (When)
  const total = calculateTotal(items, discountPercentage);

  // Assert (Then)
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

## Mocks and Time

If you're testing behavior that depends on a Date, and this is important for what's being tested, use a Mock to ensure the test is repeatable.

**Example:**
```typescript
import { jest } from '@jest/globals';

it('should set created date correctly', () => {
  // Arrange
  const mockDate = new Date('2024-01-01T12:00:00Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

  // Act
  const user = createUser({ name: 'John' });

  // Assert
  expect(user.createdAt).toEqual(mockDate);

  // Cleanup
  jest.restoreAllMocks();
});
```

## Focus and Clarity

Focus on testing one behavior per test. Avoid writing tests that are too large.

**Example:**
```typescript
// ❌ Avoid
it('should handle user operations', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');

  const updated = updateUser(user.id, { email: 'john@example.com' });
  expect(updated.email).toBe('john@example.com');

  deleteUser(user.id);
  const deleted = getUser(user.id);
  expect(deleted).toBeNull();
});

// ✅ Prefer
describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John' });
    expect(user.name).toBe('John');
  });

  it('should update user email', () => {
    const user = createUser({ name: 'John' });
    const updated = updateUser(user.id, { email: 'john@example.com' });
    expect(updated.email).toBe('john@example.com');
  });

  it('should delete user', () => {
    const user = createUser({ name: 'John' });
    deleteUser(user.id);
    const deleted = getUser(user.id);
    expect(deleted).toBeNull();
  });
});
```

## Coverage

Ensure that the code being written is fully covered by tests.

**Example:**
```typescript
// To check coverage
npm test -- --coverage

// Configure in package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Consistent Expectations

Create consistent expectations, ensuring that everything being tested is actually being verified.

**Example:**
```typescript
// ❌ Avoid
it('should create user with full details', () => {
  const user = createUser({
    name: 'John',
    email: 'john@example.com',
    age: 30
  });
  expect(user.name).toBe('John');
  // missing tests for email and age
});

// ✅ Prefer
it('should create user with full details', () => {
  const user = createUser({
    name: 'John',
    email: 'john@example.com',
    age: 30
  });
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBe(30);
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

## Test Naming

Use clear and descriptive descriptions that explain the expected behavior.

**Example:**
```typescript
// ❌ Avoid
it('test user', () => {});
it('works', () => {});

// ✅ Prefer
it('should create user with valid email', () => {});
it('should throw error when email is invalid', () => {});
it('should return null when user not found', () => {});
```
