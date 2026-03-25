# Product Direction

## What the current product already is

Based on the current codebase, Watchlist's primary feature is:

**A fast, low-friction media watchlist where a user can add any title, organize it, and resume their decision later without accounts or setup.**

That is visible in the current product shape:

- `client/src/App.jsx` centers the app on Home, Browse, Search, Title detail, My lists, Backup, and Add title.
- `server/server.js` centers the backend on `titles`, `user_list`, `title_relations`, and backup/restore.
- The strongest existing user loop is:
  1. Add a title quickly
  2. Open the detail page
  3. Put it in the list
  4. Update status / score / progress
  5. Return later

This means the product is **not** primarily a social network, review site, marketplace, or recommendation engine. It is a personal media control panel.

## Recommended product idea: "Next Up" Decision Layer

Add a lightweight decision layer that helps the user answer:

- What should I continue?
- What should I start next?
- What related title comes after this one?

This fits the existing schema and UI without changing the core product.

### Why this is the best fit

- `user_list.status` and `user_list.progress` already tell you what is current, planned, paused, or completed.
- `title_relations` already supports seasons, parts, remakes, and remasters.
- `release_date`, `average_score`, and `popularity` already exist for ranking.
- The current Home page is catalog-heavy, but the biggest personal watchlist need is decision support.

### MVP shape

Keep all current pages and flows. Add one optional layer:

- Home gets a `Continue` lane for `current` items.
- Home gets a `Start Next` lane for `planning` items.
- Home gets a `Because you finished X` lane using `title_relations`.
- Title detail gets a stronger next-step CTA such as `Continue`, `Start next season`, or `Move to completed`.
- My lists gets an optional sort like `Most likely next` instead of only grouping by status.

### Why it does not alter the primary feature

- It uses existing data instead of introducing a new product mode.
- It improves the main job after adding a title: deciding what to do next.
- It is additive, not blocking. Users can still browse, search, add, and track exactly as they do now.

## Product rule: The Capture-Recall-Resume Rule

**Any new feature must make at least one of these three jobs faster:**

1. Capture a title
2. Recall a saved title
3. Resume or choose the next title

If a feature does not improve one of those jobs, it should not be in the main product.

### What this rule protects

- The add flow stays simple
- The list/detail flow stays obvious
- The app remains lightweight and fast
- The product stays focused on tracking and decision support

### What this rule blocks

- social feeds
- comments
- long-form reviews
- profile systems
- complex onboarding
- mandatory accounts
- heavy recommendation logic that hides the library itself

### Practical test for future ideas

Before building anything, ask:

- Does this reduce steps in add, find, or resume?
- Does it reuse `titles`, `user_list`, or `title_relations` instead of inventing a new core object?
- Can the user ignore it and still use the current watchlist flow without friction?

If the answer is not clearly yes, keep it out of the primary product.

## Short version

**Product idea:** `Next Up`, a decision-support layer on top of the current watchlist.

**Rule:** Do not ship anything into the main flow unless it improves capture, recall, or resume.
