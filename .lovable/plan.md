## Problem

The GitHub sync added the Resume Guides feature. The `/resume-guides` route is registered in all three routing branches of `src/App.tsx` and the pages render correctly. But the signed-in header (`src/components/AppHeader.tsx`) has no nav entry for it, so once logged in there's no visible link to reach the guides.

## Change

Add one item to the `navItems` array in `src/components/AppHeader.tsx` (currently at line 65), right after Applications:

```ts
{
  to: "/resume-guides",
  label: "Resume Guides",
  icon: null,
  match: (p: string) => p.startsWith("/resume-guides"),
}
```

That's it — routing and page rendering already work.

## Verification

- Type-check passes.
- Signed in on `/applications`, the header shows a "Resume Guides" link that opens the directory and stays highlighted while browsing `/resume-guides/*`.
