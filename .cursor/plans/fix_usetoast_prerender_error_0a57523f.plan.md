---
name: Fix useToast prerender error
overview: Fix the build failure "useToast must be used within a ToastProvider" during static generation of /count-cards/new by making ToastProviderWrapper accept and render children and adding it to the root layout.
todos: []
isProject: false
---

# Fix useToast prerender error (ToastProvider)

## Problem

Build fails during static page generation for `/(dashboard)/count-cards/new`:

```text
Error: useToast must be used within a ToastProvider
```

Pages under dashboard (e.g. [app/(dashboard)/count-cards/new/page.tsx](app/(dashboard)/count-cards/new/page.tsx)) call `useToast()` from [context/ToastContext.tsx](context/ToastContext.tsx). If [app/layout.tsx](app/layout.tsx) does not wrap the app with `ToastProvider`, those pages run outside the provider during prerender and throw.

## Solution

1. Ensure [components/feedback/ToastProviderWrapper.tsx](components/feedback/ToastProviderWrapper.tsx) **accepts `children`** and renders them **inside** `ToastProvider` along with the toast container.
2. In [app/layout.tsx](app/layout.tsx), wrap `{children}` with `ToastProviderWrapper` inside `AuthProvider`.

## Implementation steps

### Step 1: ToastProviderWrapper accepts and renders children

**File:** [components/feedback/ToastProviderWrapper.tsx](components/feedback/ToastProviderWrapper.tsx)

- Add `children?: React.ReactNode` to `ToastProviderWrapperProps` if not already present.
- In the default export, destructure `children` from props (e.g. `const { children, ...containerProps } = props`) and pass only the container-related props to `ToastContainerWrapper`.
- Return structure:

```tsx
return (
  <ToastProvider>
    {children}
    <ToastContainerWrapper {...containerProps} />
  </ToastProvider>
);
```

So the provider wraps both app content and the toast container.

### Step 2: Root layout wraps children with ToastProviderWrapper

**File:** [app/layout.tsx](app/layout.tsx)

- Import `ToastProviderWrapper` from `@/components/feedback/ToastProviderWrapper` (or `@/components/feedback` if the barrel exports it).
- Inside `AuthProvider`, wrap `{children}` with `<ToastProviderWrapper>` so the tree is:
  `AuthProvider` > `ToastProviderWrapper` > `{children}`
- Keep `DebugPanel` and any other siblings as-is (e.g. still inside `AuthProvider`, outside `ToastProviderWrapper`).

### Step 3: Verify build

- Run `npm run build`.
- Confirm TypeScript passes and static generation completes for `/count-cards/new` (and other pages using `useToast`) without the "useToast must be used within a ToastProvider" error.

## Files to modify


| File                                                                                         | Change                                                                                               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [components/feedback/ToastProviderWrapper.tsx](components/feedback/ToastProviderWrapper.tsx) | Add/ensure `children` prop; render `{children}` inside `ToastProvider` with `ToastContainerWrapper`. |
| [app/layout.tsx](app/layout.tsx)                                                             | Import `ToastProviderWrapper` and wrap `{children}` with it inside `AuthProvider`.                   |


## Notes

- No changes to dashboard layout or individual pages are required.
- If the codebase already has these changes, Step 1 and Step 2 will be no-ops; Step 3 still serves as verification.

