# Mobile Application Architecture Guide

## Overview

This document defines a scalable architecture standard for mobile applications built with:

- Expo
- React Native
- Expo Router
- Expo SQLite
- Zustand
- React Hook Form
- Zod
- TypeScript

The architecture is designed for applications that require:

- Offline-first behavior
- Local database persistence
- Complex forms
- Reactive UI updates
- Strong type safety
- Modular scalability
- Maintainable code organization

This structure is intended to be reusable across multiple projects regardless of domain.

---

# Core Architectural Principles

## 1. Separation of Concerns

Each layer of the application must have a single responsibility.

The application should be divided into:

- UI layer
- State layer
- Business logic layer
- Persistence layer
- Validation layer

Each layer must remain isolated.

---

## 2. SQLite as the Source of Truth

Persistent application data must live in SQLite.

SQLite is responsible for:

- Persistence
- Relationships
- Historical consistency
- Aggregations
- Offline support

Application state libraries should never replace the database.

---

## 3. Zustand as Reactive State Layer

Zustand should manage:

- UI state
- Temporary state
- In-memory cache
- Reactive updates
- Dynamic form state

Zustand should NOT manage:

- SQL queries
- Persistent business data
- Database synchronization rules

---

## 4. Service Layer for Business Logic

All business rules must be centralized inside services.

Examples:

- Entity creation workflows
- Transactions
- Complex calculations
- Synchronization logic
- Validation orchestration

Services coordinate repositories and stores.

---

## 5. Repository Layer for Data Access

Repositories are responsible only for persistence access.

Repositories should contain:

- SQL queries
- Database mapping
- Persistence operations

Repositories should NOT contain:

- UI logic
- Business rules
- Form validation

---

## 6. Feature-Based Structure

The project should be organized by features/domains rather than technical categories.

Benefits:

- Better scalability
- Easier maintenance
- Isolated complexity
- Independent evolution
- Improved developer experience

---

# Recommended Project Structure

```txt
src/
├── app/
│   ├── (tabs)/
│   ├── feature-a/
│   ├── feature-b/
│   └── settings/
│
├── database/
│   ├── sqlite.ts
│   ├── migrations/
│   └── schema/
│
├── features/
│   ├── feature-a/
│   ├── feature-b/
│   └── feature-c/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── utils/
│   ├── constants/
│   └── types/
│
└── lib/
    ├── zod/
    ├── formatting/
    └── helpers/
```

---

# Feature Structure

Each feature should remain self-contained.

```txt
features/
└── feature-name/
    ├── components/
    ├── screens/
    ├── hooks/
    ├── store/
    ├── services/
    ├── repositories/
    ├── schemas/
    ├── calculations/
    ├── utils/
    └── types/
```

---

# Layer Responsibilities

# UI Layer

Responsible for:

- Rendering
- User interaction
- Navigation
- Layout composition

UI components should remain as dumb as possible.

UI should NEVER contain:

- SQL
- Business logic
- Heavy calculations
- Persistence logic

---

# Hooks Layer

Responsible for:

- Screen orchestration
- Form orchestration
- Side effects
- State composition
- Data loading
- Submit handling

Hooks connect UI with stores and services.

Examples:

```ts
useFeatureData();
useFeatureForm();
useDashboard();
```

---

# Store Layer

Responsible for:

- Reactive state
- Temporary state
- Dynamic UI state
- Form interaction state
- Optimistic updates

Stores should remain lightweight and predictable.

Examples:

- Selected items
- Current filters
- Form steps
- Totals
- Temporary drafts

---

# Service Layer

Responsible for:

- Business workflows
- Cross-entity operations
- Transactions
- Validation orchestration
- Synchronization logic

Services coordinate repositories and external dependencies.

---

# Repository Layer

Responsible ONLY for persistence access.

Repositories should:

- Read data
- Write data
- Execute queries
- Return normalized entities

Repositories should remain framework-agnostic whenever possible.

---

# Schema Layer

Contains validation schemas using Zod.

Schemas should validate:

- Form inputs
- DTOs
- Service contracts
- External payloads

Example:

```ts
export const entitySchema = z.object({
  name: z.string(),
});
```

---

# Data Flow

```txt
Screen
  ↓
Hook
  ↓
Store / Service
  ↓
Repository
  ↓
SQLite
```

---

# State Management Strategy

# Global State

Use global stores for:

- Application settings
- Authentication state
- Shared caches
- Global filters
- Session state

---

# Feature State

Use localized feature stores for:

- Form state
- Temporary workflows
- Dynamic interactions
- Feature-specific cache

Avoid excessive global state.

---

# Store Design Principles

Prefer explicit actions.

BAD:

```ts
setField(name, value);
```

GOOD:

```ts
addItem();
removeItem();
updateQuantity();
toggleFilter();
```

Explicit actions improve readability and reduce bugs.

---

# Form Architecture

# Simple Forms

Simple forms may use only:

- React Hook Form
- Zod

Examples:

- Login
- Settings
- Profile editing

---

# Complex Forms

Complex forms should separate:

- Static form state
- Dynamic interaction state

Recommended split:

# React Hook Form

Handles:

- Text fields
- Dates
- Basic validation
- Submit lifecycle

# Zustand

Handles:

- Dynamic arrays
- Realtime calculations
- Interactive item management
- Temporary UI interactions

This separation improves scalability and performance.

---

# Validation Strategy

All validation should be centralized with Zod.

Benefits:

- Runtime validation
- Static type inference
- Shared contracts
- Predictable schemas

---

# Type System Strategy

Separate types by responsibility.

# Entity Types

Represent persisted database records.

# DTO Types

Represent service input/output contracts.

# Form Types

Represent UI form state.

Never reuse a single type across all layers.

---

# Database Strategy

# Migrations

All schema changes should be versioned through migrations.

---

# Transactions

Complex operations must use transactions.

Examples:

- Multi-entity writes
- Inventory updates
- Cascading updates

---

# Aggregations

Heavy aggregations should be performed by SQLite whenever possible.

Example:

```sql
SELECT COUNT(*)
FROM table_name
```

Avoid computing large aggregations in JavaScript.

---

# Performance Strategy

# Zustand Selectors

Always subscribe to minimal state slices.

GOOD:

```ts
const total = useStore((state) => state.total);
```

Avoid subscribing entire screens to large store objects.

---

# List Virtualization

Use optimized list virtualization for large datasets.

Recommended:

- FlashList

---

# Memoization

Use memoization carefully for:

- Expensive calculations
- Derived state
- Heavy component trees

Avoid premature optimization.

---

# Navigation Strategy

Recommended routing structure:

```txt
/feature
/feature/new
/feature/[id]
```

Group routes by domain.

---

# Service Error Standardization

Services are responsible for transforming low-level errors into predictable business/domain errors.

Repositories may throw raw persistence errors, but services should normalize those errors before exposing them to hooks or UI layers.

This creates a consistent and scalable error handling strategy across the application.

---

# Error Responsibility by Layer

# Repository Layer

Repositories may throw:

- SQLite errors
- Constraint violations
- Query failures
- Unknown persistence exceptions

Repositories should NOT:

- Translate messages
- Handle UI concerns
- Define business semantics

---

# Service Layer

Services should:

- Catch technical errors
- Normalize business errors
- Throw domain-specific errors
- Assign internal error codes

Services are the central point for business-level error handling.

---

# Hook Layer

Hooks should:

- Interpret service errors
- Trigger UI feedback
- Handle loading states
- Display user-friendly messages

Hooks should not contain business validation logic.

---

# UI Layer

UI components should only render state and feedback.

UI components should never interpret raw persistence errors.

---

# Base Application Error

Applications should define a shared base error class.

Example:

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}
```

---

# Specialized Errors

Applications should define specialized domain errors.

Example:

```ts
export class ValidationError extends AppError {}

export class BusinessRuleError extends AppError {}

export class NotFoundError extends AppError {}

export class DatabaseError extends AppError {}
```

---

# Internal Error Codes

All service-level errors should use internal error codes.

Example:

```ts
throw new BusinessRuleError("Insufficient stock", "INSUFFICIENT_STOCK");
```

Internal codes improve:

- Error consistency
- Internationalization
- UI mapping
- Analytics
- Monitoring
- Future API integration

---

# Recommended Error Code Structure

Use uppercase snake_case identifiers.

Examples:

```txt
VALIDATION_ERROR
DATABASE_ERROR
ENTITY_NOT_FOUND
INSUFFICIENT_STOCK
INVALID_OPERATION
UNAUTHORIZED_ACTION
```

Codes should remain stable even if displayed messages change.

---

# Service Error Example

```ts
export async function createEntity(data: DTO) {
  try {
    const existing = await repository.findById(data.id);

    if (!existing) {
      throw new NotFoundError("Entity not found", "ENTITY_NOT_FOUND");
    }

    return await repository.create(data);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new DatabaseError("Failed to create entity", "DATABASE_ERROR");
  }
}
```

---

# UI Error Mapping

Hooks may map internal codes to user-friendly messages.

Example:

```ts
const errorMessages = {
  ENTITY_NOT_FOUND: "The requested item was not found",

  DATABASE_ERROR: "Something went wrong",

  INVALID_OPERATION: "This action cannot be completed",
};
```

This prevents exposing technical details to users.

---

# Recommended Error Structure

```txt
shared/
└── errors/
    ├── app-error.ts
    ├── error-codes.ts
    ├── validation-error.ts
    ├── business-rule-error.ts
    ├── database-error.ts
    ├── unauthorized-error.ts
    └── not-found-error.ts
```

---

# Error Handling Principles

# Repositories Throw Technical Errors

Repositories are infrastructure-level.

---

# Services Throw Business Errors

Services define application semantics.

---

# Hooks Handle UX Concerns

Hooks coordinate feedback and interaction.

---

# UI Renders State Only

UI should remain presentation-focused.

---

# Avoid Silent Errors

Never swallow exceptions silently.

BAD:

```ts
catch (error) {}
```

---

# Avoid Generic Errors

BAD:

```ts
throw new Error("Something failed");
```

Prefer explicit domain errors with internal codes.

---

# Recommended Error Flow

```txt
SQLite Error
   ↓
Repository
   ↓
Service normalizes error
   ↓
Hook interprets error
   ↓
UI displays feedback
```

# Offline-First Architecture

The architecture assumes local-first operation.

Benefits:

- Fast interactions
- Offline availability
- Reliable persistence
- Reduced backend dependency

Future synchronization layers can be added without restructuring the application.

---

# Recommended Tech Stack

Core stack:

- Expo
- React Native
- Expo Router
- Expo SQLite
- Zustand
- React Hook Form
- Zod
- TypeScript

Recommended additions:

- FlashList
- React Native Reanimated

Optional future additions:

- React Query
- MMKV
- Drizzle ORM
- Background synchronization

---

# Architectural Rules

# Never Place Business Logic in Components

Components should remain presentation-oriented.

---

# Never Access SQLite Directly from Screens

Always follow:

```txt
Screen → Hook → Service → Repository
```

---

# Never Treat Zustand as the Database

SQLite remains the source of truth.

---

# Never Mix Persistence Models with UI Models

Keep layer boundaries explicit.

---

# Prefer Explicit Actions Over Generic Mutators

Explicit actions improve maintainability.

---

# Prefer Pure Functions for Calculations

Pure functions are easier to test and reason about.

---

# Development Workflow Recommendation

Recommended implementation order:

1. Database schema
2. Migrations
3. Repositories
4. Services
5. Validation schemas
6. Zustand stores
7. Hooks
8. Components
9. Screens
10. Analytics and optimization

---

# Scalability Goals

This architecture is designed to support:

- Large forms
- Complex workflows
- Offline-first systems
- Multi-feature applications
- Long-term maintainability
- Team scalability

---

# Final Summary

This architecture combines:

- Feature-based organization
- Repository pattern
- Service layer pattern
- Offline-first persistence
- Reactive state management
- Strict separation of concerns
- Strong validation strategy
- Predictable scalability

