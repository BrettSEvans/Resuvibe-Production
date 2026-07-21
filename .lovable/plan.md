## Plan: Add accessible names to icon-only buttons

### Background
The SEO/accessibility review flagged that several icon-only buttons in the app lack accessible names. These buttons are invisible to screen readers because they contain no text and no `aria-label`/`aria-labelledby`. Adding `aria-label` attributes will fix the issue without changing the visual UI.

### Scope
Fix all icon-only `<Button>` components in `src/components` and `src/pages` that contain only an icon and lack an accessible name. This includes buttons that rely on `title` (mouse tooltip only) — `title` is not a reliable accessible name for keyboard/screen-reader users.

### Work to do

1. **Audit and catalog**
   - Re-read the flagged files to confirm exact line numbers and icon purposes.
   - Produce a final checklist of buttons to update (~35 instances across ~15 files).

2. **Add `aria-label` attributes**
   - Add a descriptive `aria-label` to each icon-only button matching its action, e.g.:
     - Close AI chat → `aria-label="Close AI assistant"`
     - Send message → `aria-label="Send message"`
     - Delete row → `aria-label="Delete"`
     - Preview → `aria-label="Preview"`
     - Rich-text toolbar buttons → `aria-label="Bold"`, `aria-label="Italic"`, etc.
   - Where a button already has a `title`, keep the `title` and add `aria-label` with the same or clearer text.
   - Ensure labels are concise and action-oriented.

3. **Special attention: `InlineHtmlEditor.tsx`**
   - This file contains ~16 rich-text toolbar icon buttons; most currently have no accessible name.
   - Add `aria-label` to every toolbar control (bold, italic, underline, lists, alignment, indent/outdent, link, unlink, undo, redo).

4. **Verification**
   - Run the TypeScript build (`bun run build` / `tsc --noEmit`) to ensure no type errors.
   - Run the existing test suite (`bun test` / `vitest`) to catch regressions.
   - Optionally run an accessibility lint/scan to confirm the icon-only button findings are resolved.

### Files expected to change
- `src/components/AiChat.tsx`
- `src/components/BatchJobInput.tsx`
- `src/components/CoverLetterRevisions.tsx`
- `src/components/DashboardRevisions.tsx`
- `src/components/GeneratedAssetRevisions.tsx`
- `src/components/InlineHtmlEditor.tsx`
- `src/components/ResumeDiffViewer.tsx`
- `src/components/ResumeManager.tsx`
- `src/components/ResumeRevisions.tsx`
- `src/components/TutorialTour.tsx`
- `src/components/stories/CopyPromptButton.tsx`
- `src/components/stories/StoryDependencies.tsx`
- `src/components/stories/StorySidebar.tsx`
- `src/components/stories/StorySubTasks.tsx`
- `src/components/tabs/JDAnalysisTab.tsx`
- `src/pages/ApplicationDetail.tsx`
- `src/pages/Applications.tsx`
- `src/pages/Templates.tsx`

### Outcome
All icon-only buttons will have accessible names, resolving the "icon-only buttons lack accessible names" finding. No visible UI changes.