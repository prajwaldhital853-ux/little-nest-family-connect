# Refresh the Hazel House feature analysis

A full feature analysis already exists (`docs/feature-analysis.md`, also delivered as a downloadable file). Since then the page title and description were changed again, so parts of it are out of date. This plan updates the document rather than starting over.

## Steps

1. Check `docs/plans/` again for board documents (none existed last time); if any exist now, read them first and note where they differ from the code.
2. Re-read the current code for every section (1-14 of the brief): pages, sections, interactive parts, style pack (fonts, type scale, colours, spacing, radius, shadows), breakpoints and mobile menu, images and loading, accessibility, head tags, content model, theming, backend tables and access rules, sign-in providers, functions, tooling and dependencies.
3. Confirm each listed part is actually shown on a page; keep unused building blocks in a separate "present but unused" list, not counted as features.
4. Update the SEO section with the current title and description from `index.html`, and fix anything else that has drifted.
5. Keep the suggested name and slug ("Hazel House - Warm Preschool & Daycare Website", `hazel-house-warm-preschool-daycare-website`) unless the review gives a reason to change it.
6. Save the updated document in `docs/feature-analysis.md` and as a downloadable file.

## Technical details

- Sources: `src/pages/site/*`, `src/components/*`, `src/style-packs/hazel-house.ts`, `tailwind.config.ts`, `src/*.css`, `index.html`, `package.json`, `supabase/*`, live database schema and policies.
- No app code, look or content changes.
