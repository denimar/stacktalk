# React

## Functional Components

Use functional components, never classes.

**Example:**
```typescript
// ❌ Avoid
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// ✅ Prefer
function UserProfile({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Or with arrow function
const UserProfile = ({ name }: { name: string }) => {
  return <div>{name}</div>;
};
```

## TypeScript

Use TypeScript and the `.tsx` extension for components.

**Example:**
```typescript
// UserCard.tsx
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
}

export function UserCard({ name, email, avatar }: UserCardProps) {
  return (
    <div className="user-card">
      {avatar && <img src={avatar} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}
```

## Local State

Keep component state as close as possible to where it will be used.

**Example:**
```typescript
// ❌ Avoid - state in parent component when only used in child
function ParentComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <UserProfile />
      <Settings isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
}

// ✅ Prefer - state in the component that actually uses it
function ParentComponent() {
  return (
    <div>
      <UserProfile />
      <Settings />
    </div>
  );
}

function Settings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // uses state here
}
```

## Props Passing

Pass properties explicitly between components. Avoid spread operator like `<ComponentName {...props} />`.

**Example:**
```typescript
// ❌ Avoid
function UserProfile(props: any) {
  return <UserCard {...props} />;
}

// ✅ Prefer
interface UserProfileProps {
  name: string;
  email: string;
  avatar: string;
}

function UserProfile({ name, email, avatar }: UserProfileProps) {
  return <UserCard name={name} email={email} avatar={avatar} />;
}
```

## Component Size

Avoid components that are too large, over 300 lines.

**Example:**
```typescript
// ❌ Avoid - monolithic component
function Dashboard() {
  // 400 lines of code
  return (
    <div>
      {/* header */}
      {/* sidebar */}
      {/* content */}
      {/* footer */}
    </div>
  );
}

// ✅ Prefer - split into smaller components
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardSidebar />
      <DashboardContent />
      <DashboardFooter />
    </div>
  );
}
```

## Context API

Use Context API when you need to communicate between different child components.

**Example:**
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setUser(user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## Styling

Use Tailwind for component styling. Do not use styled-components.

**Example:**
```typescript
// ✅ Prefer
function Button({ children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

## Component Granularity

Avoid excessive small components.

**Example:**
```typescript
// ❌ Avoid - over-engineering
function UserName({ name }: { name: string }) {
  return <span>{name}</span>;
}

function UserEmail({ email }: { email: string }) {
  return <span>{email}</span>;
}

function UserCard({ name, email }: UserCardProps) {
  return (
    <div>
      <UserName name={name} />
      <UserEmail email={email} />
    </div>
  );
}

// ✅ Prefer - simplicity
function UserCard({ name, email }: UserCardProps) {
  return (
    <div>
      <span>{name}</span>
      <span>{email}</span>
    </div>
  );
}
```

## Performance with useMemo

Use the `useMemo` hook to avoid excessive calculations and unnecessary interactions between renders.

**Example:**
```typescript
function ProductList({ products, filter }: ProductListProps) {
  // ✅ Memoize the filter result
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Hook Naming

Name custom hooks with the "use" prefix, for example: `useAuth`, `useLocalStorage`, `useUrl`.

**Example:**
```typescript
// useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage
function MyComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
}
```

## Component Libraries

Before creating a new complex component, ask first whether to look for an existing library.

**Example:**
```typescript
// For complex components like date pickers, data tables, etc.
// Consider libraries like:
// - shadcn/ui
// - Radix UI
// - Headless UI
// - React Hook Form (forms)
// - React Query (data fetching)
```

## Tests

Create automated tests for all components.

**Example:**
```typescript
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('should render user information', () => {
    render(
      <UserCard
        name="John Doe"
        email="john@example.com"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render avatar when provided', () => {
    render(
      <UserCard
        name="John Doe"
        email="john@example.com"
        avatar="https://example.com/avatar.jpg"
      />
    );

    const avatar = screen.getByRole('img', { name: 'John Doe' });
    expect(avatar).toBeInTheDocument();
  });
});
```
