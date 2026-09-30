# Step 5: README Planning Doc

## Project Path
{PROJECT_PATH}

## Your Task

Update README.md with planning documentation based on API changes.
Write for non-developers to understand.

### 1. Check Changed APIs

```bash
git diff --name-only HEAD~1 | grep "src/services/"
```

Or check full `src/services/` structure:

```bash
find src/services -name "*.ts" -type f | head -30
```

### 2. Analyze Page-level API Requests

For each service and page (`src/services/{service}/page/`):
- Which state does it use?
- Which APIs does that state call?
- Main user actions (buttons, forms, etc.)

---

## README.md Writing Guide

### Do NOT

| ❌ Don't | ✅ Do |
|---------|------|
| "Future feature planned" | Only describe current features |
| "It would be nice if..." | State facts only |
| "useState, useEffect used" | Remove dev terminology |
| "Component structure is..." | Explain from user perspective |

### README.md Structure

```markdown
# [Project Name]

[One-line description: What this app does]

## Pages

### Main (`/`)
> First screen users see when entering the app

**What you can do:**
- View product list
- Filter by category
- Click product to see details

**Requests:**
| Action | Endpoint |
|--------|----------|
| Get product list | `GET /api/product` |
| Get categories | `GET /api/category` |

---

### Product Detail (`/product/[id]`)
> Screen to view individual product info

**What you can do:**
- View product info (name, price, description)
- Add to cart
- Select quantity

**Requests:**
| Action | Endpoint |
|--------|----------|
| Get product detail | `GET /api/product/[id]` |
| Add to cart | `POST /api/cart` |

---

### Cart (`/cart`)
> Screen to review items and proceed to checkout

**What you can do:**
- View cart items
- Change quantity
- Remove item
- Checkout

**Requests:**
| Action | Endpoint |
|--------|----------|
| Get cart | `GET /api/cart` |
| Update quantity | `PATCH /api/cart/[id]` |
| Remove item | `DELETE /api/cart/[id]` |

---

### Login (`/login`)
> Member login screen

**What you can do:**
- Email/password login
- Social login (Kakao, Google)
- Go to signup page

**Requests:**
| Action | Endpoint |
|--------|----------|
| Login | `POST /api/auth/sign-in` |
| Social login | `GET /api/auth/[provider]` |

---

## Page Flow

\`\`\`
[Main] ──────────────────────────────────┐
   │                                      │
   ▼                                      │
[Product Detail] ──▶ [Cart] ──▶ [Checkout]│
                       │                  │
                       ▼                  │
                   [Login] ◀──────────────┘
                   (if not logged in)
\`\`\`

## Feature Summary

| Feature | Description |
|---------|-------------|
| Product | List, category filter, detail view |
| Cart | Add/remove/update quantity |
| Auth | Login, signup, social login |
| Checkout | Create order, process payment |
```

### Writing Tips

1. **Think per screen**: "What can user do on this screen?"
2. **Use verbs**: "Product list" → "View product list"
3. **Keep data simple**: Not API names, but "what it shows"
4. **ASCII for flow**: No fancy tools, just text

---

### 3. Update Method

- If README.md exists, only replace above sections
- Keep other sections (installation, env vars, etc.)

### 4. Validate & Stage

```bash
pnpm run validate
git add README.md
```

Report README.md updated.
