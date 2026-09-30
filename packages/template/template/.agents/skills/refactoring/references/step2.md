# Step 2: Mock Data Normalization

## Project Path
{PROJECT_PATH}

## Your Task

### 0. Check Real API Connections (DO FIRST)

**Skip normalization for APIs already connected to real DB.**

Check `src/server/repository/` for each domain:
- If using `db` from `src/server/db/` → **SKIP** (already real)
- If importing from `src/server/repository/_data/` → **NORMALIZE** (still mock)

Only proceed with domains that are still using mock data.

### 1. Find Hardcoded Data (MOCK-ONLY DOMAINS)

Search for hardcoded data in:
- Page components
- State files
- Inline arrays/objects that should be mock data

**Only for domains NOT connected to real API.**

### 2. Move to Mock Layer

Move all mock data to: `src/server/repository/_data/{domain}.ts`

### 3. Normalize Data

Structure mock data like relational DB tables:
- Separate entities (users, products, orders)
- Use IDs for relationships
- **NO computed fields** (likeCount, commentCount) - calculate at runtime

Example:
```typescript
// Bad
const products = [{ id: '1', likeCount: 5 }]

// Good
const products = [{ id: '1', name: 'Product' }]
const likes = [{ userId: 'u1', productId: '1' }]
// Calculate: likes.filter(l => l.productId === id).length
```

### 4. Validate

```bash
pnpm run validate
```

### 5. Stage & Report

```bash
git add .
git status
```

Report files fixed and remaining issues.
