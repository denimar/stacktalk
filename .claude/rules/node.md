# Node.js/JavaScript/TypeScript

## TypeScript

All source code must be written in TypeScript.

**Example:**
```typescript
// ✅ Prefer .ts files
// user.service.ts
interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  getUser(id: string): User {
    // implementation
  }
}
```

## Package Manager

Use npm as the default tool for managing dependencies and running scripts.

**Example:**
```bash
# Install dependencies
npm install

# Add new dependency
npm install axios

# Add dev dependency
npm install --save-dev @types/jest

# Run scripts
npm run dev
npm test
npm run build
```

## Library Types

If necessary, install type definitions for libraries, for example: `jest` and `@types/jest`.

**Example:**
```bash
npm install jest --save-dev
npm install @types/jest --save-dev

npm install express
npm install @types/express --save-dev
```

## Type Validation

Before finishing a task, always validate that typing is correct.

**Example:**
```bash
# Run type checking
npx tsc --noEmit

# Configure in package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && tsc"
  }
}
```

## Variable Declaration

Use `const` instead of `let` where possible. Never use `var` to declare a variable.

**Example:**
```typescript
// ❌ Avoid
var userName = 'John';
let userAge = 30; // if it won't change

// ✅ Prefer
const userName = 'John';
const userAge = 30;
let counter = 0; // only when it will change
```

## Class Properties

Always declare class properties as `private` or `readonly`, avoiding the use of `public`.

**Example:**
```typescript
// ❌ Avoid
class UserService {
  public database: Database;
  public config: Config;
}

// ✅ Prefer
class UserService {
  private readonly database: Database;
  private readonly config: Config;

  constructor(database: Database, config: Config) {
    this.database = database;
    this.config = config;
  }

  // public methods that use private properties
  public getUser(id: string): User {
    return this.database.findUser(id);
  }
}
```

## Array Methods

Prefer using `find`, `filter`, `map`, and `reduce` instead of `for` and `while`.

**Example:**
```typescript
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
  { id: 3, name: 'Bob', age: 35 }
];

// ❌ Avoid
const result = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].age > 25) {
    result.push(users[i].name);
  }
}

// ✅ Prefer
const result = users
  .filter(user => user.age > 25)
  .map(user => user.name);

// Find
const user = users.find(u => u.id === 2);

// Reduce
const totalAge = users.reduce((sum, user) => sum + user.age, 0);
```

## Promises and Async/Await

Always use `async/await` to handle promises. Avoid using callbacks.

**Example:**
```typescript
// ❌ Avoid
function getUser(id: string, callback: (user: User) => void) {
  database.query('SELECT * FROM users WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    callback(result);
  });
}

// ✅ Prefer
async function getUser(id: string): Promise<User> {
  const result = await database.query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
}

// Usage
try {
  const user = await getUser('123');
  console.log(user);
} catch (error) {
  console.error(error);
}
```

## Strong Typing

Never use `any`. Always use existing types or create types for everything that is implemented.

**Example:**
```typescript
// ❌ Avoid
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ Prefer
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}

// For unknown cases, use unknown
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}
```

## Imports and Exports

Never use `require` to import modules, always use `import`. Never use `module.exports` to export modules, always use `export`.

**Example:**
```typescript
// ❌ Avoid
const express = require('express');
const { UserService } = require('./user.service');
module.exports = { createUser };

// ✅ Prefer
import express from 'express';
import { UserService } from './user.service';
export { createUser };
```

## Default vs Named Exports

If the file has only one thing being exported, use `default`, otherwise use named exports.

**Example:**
```typescript
// user.service.ts - only one class
export default class UserService {
  // ...
}

// user.utils.ts - multiple functions
export function validateEmail(email: string): boolean {
  // ...
}

export function formatName(name: string): string {
  // ...
}

export function calculateAge(birthDate: Date): number {
  // ...
}
```

## Circular Dependencies

Avoid circular dependencies.

**Example:**
```typescript
// ❌ Avoid
// user.service.ts
import { OrderService } from './order.service';

export class UserService {
  constructor(private orderService: OrderService) {}
}

// order.service.ts
import { UserService } from './user.service';

export class OrderService {
  constructor(private userService: UserService) {}
}

// ✅ Prefer
// user.service.ts
export class UserService {
  getUser(id: string): User { }
}

// order.service.ts
export class OrderService {
  getOrders(userId: string): Order[] { }
}

// user-order.service.ts
import { UserService } from './user.service';
import { OrderService } from './order.service';

export class UserOrderService {
  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}

  getUserWithOrders(userId: string) {
    const user = this.userService.getUser(userId);
    const orders = this.orderService.getOrders(userId);
    return { ...user, orders };
  }
}
```

## Utility Types

Use TypeScript utility types when appropriate.

**Example:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Partial - all fields optional
type UserUpdate = Partial<User>;

// Pick - select specific fields
type UserPublic = Pick<User, 'id' | 'name' | 'email'>;

// Omit - exclude specific fields
type UserCreate = Omit<User, 'id'>;

// Readonly - make immutable
type UserReadonly = Readonly<User>;

// Record - create object with specific keys
type UserMap = Record<string, User>;
```
