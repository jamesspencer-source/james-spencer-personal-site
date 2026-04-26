---
name: executive-academic-web-polish
description: Use when reviewing, redesigning, writing copy for, or implementing James M. Spencer's personal website or similar executive-academic professional profiles. Applies to contact/CTA sections, role storytelling, visual polish, scrollytelling, portfolio positioning, responsive QA, and avoiding generic or over-marketed design language.
---

# Executive Academic Web Polish

## Core Standard

Make the site feel professional, sophisticated, beautiful, and credible to hiring leaders in life-science research operations and scientific program leadership. Visual interest should support trust and clarity; it should not feel like generic startup marketing, sci-fi UI, or decorative portfolio filler.

## Before Changing The Site

1. Inspect the current implementation before proposing or editing.
2. Keep changes scoped to the user request unless a nearby dependency must change.
3. Preserve approved factual anchors:
   - James manages operations for two distinct Howard Hughes Medical Institute Investigator laboratories in Harvard Medical School Microbiology.
   - Laboratory operations is the primary professional anchor.
   - Community Phages and Lab Management Network of Professionals leadership are major extensions of the same operating capability.
4. Keep claims public-safe. Do not invent metrics, authority, savings, or outcomes.
5. Do not launch browser automation unless the user explicitly asks. Prefer source checks, builds, and user-side visual QA because prior automated browser launches caused disruptive crash popups.

## Voice And Positioning

Use plain, senior, institutionally appropriate prose.

Prefer:
- concrete verbs: leads, coordinates, prepares, staffs, launches, supports, plans, chairs, maintains
- clear professional nouns: research operations, scientific program leadership, laboratory management, conference planning, program delivery
- third-person factual framing unless the page already uses another voice

Avoid:
- fluffy slogans such as "one operating profile"
- awkward abstractions such as "operating surface," "throughline," "remit," and "preferred"
- over-claiming executive authority beyond James's role
- unexplained acronyms in hero, navigation, headers, CTA rows, and role labels

## Visual Direction

Aim for an editorial, executive-academic system:
- restrained palette, strong spacing, premium type hierarchy
- visuals that are legible at first glance and connected to the actual work
- scrollytelling that is chapter-owned, stable, and cinematic without feeling gimmicky
- subtle material depth through lighting, contrast, scale, and motion discipline

Avoid:
- generic cubes, spheres, or shiny abstract blobs
- decorative diagrams that require guessing
- clipped labels, cramped cards, and tiny unreadable text
- repeated frosted-card styling everywhere
- purple-blue gradient tech aesthetics, beige-only palettes, or overly dark low-contrast scenes

## Photo Rules

Never use or reintroduce a tall skinny cropped headshot. For the contact portrait, use only the approved studio headshot asset unless the user supplies a replacement:

`public/assets/images/james-m-spencer-studio-headshot.jpg`

Render it without CSS cropping:
- no `object-fit: cover`
- no narrow portrait squeeze
- no overlap with CTA buttons or copy
- show as much of the original image and upper torso as the layout allows

Use documentary photos only where they provide role evidence. Do not force photos into Hero, Background, or Contact unless the user asks.

## CTA And Contact Pattern

The closing section should feel like a deliberate final impression.

Default pattern:
- heading: concise, usually `Connect`
- one polished sentence about why to connect
- optional supporting line that reinforces role value
- quiet topic tags
- balanced action rows with LinkedIn primary and Resume secondary

LinkedIn may be primary through accent, border, or background treatment, not oversized type. Do not use confusing metadata such as `Preferred`.

## Implementation Checklist

When implementing:
1. Read the relevant files first, usually `src/App.tsx`, `src/content.ts`, and `src/styles.css`.
2. Use existing content/types unless a small schema extension materially improves clarity.
3. Keep layout stable across desktop, tablet, and mobile.
4. Preserve keyboard focus states and accessible link text.
5. Run `npm run build`.
6. Run `git diff --check`.
7. Search for stale forbidden wording or assets relevant to the task, such as `Preferred`, `remit`, `shared operating footprint`, and cropped headshot paths.
8. If pushing, report the commit hash and checks run.

## Review Checklist

Before finalizing, ask whether the result:
- makes James look trusted, precise, and hireable without exaggeration
- explains laboratory operations, Community Phages, and LMNOP leadership quickly
- keeps laboratory operations visually and editorially primary
- looks beautiful because of composition and clarity, not because of generic effects
- avoids awkward crops, clipped labels, and odd text wrapping
- keeps the final CTA polished, balanced, and LinkedIn-led
