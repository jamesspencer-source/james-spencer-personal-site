# Research operations site: review and rebuild

## Decision

Rebuild the live page around laboratory operations, annual program delivery, and
professional-network leadership. Preserve the approved day/dusk/night campus
visualizations, original studio portrait, conference photograph, contact options,
and existing public fragment URLs. No new graphics dependency or invented metrics.

## Comparison with the preceding review

| Earlier recommendation | Independent finding | Implemented response |
| --- | --- | --- |
| Strengthen the hero | The current short title is useful; another longer title would repeat the prior mistake. | Keep a concise research-operations headline, more confident editorial scale, and a direct scope paragraph. Preserve the skyline. |
| Replace generic building blocks | The diagram looks less credible than the approved campus illustration. | Remove it from active rendering; use the campus visual with restrained location captions, not floor numbers as headline metrics. |
| Simplify Community Phages | Seven dimmed stages make the description harder to read. | Four explicit phases with full-contrast text, native buttons, and a restrained scroll-following cycle on roomy desktop screens. |
| Strengthen LMNOP | The map is decorative and the role details are repetitive. | Accurate shared projection for all pins; persistent locations, selectable city annotations, and conference-scale evidence beside the SF photograph. |
| Reduce repetition | Expertise, role descriptions, progression, and background recount the same scope. | Integrate expertise into laboratory work, remove the repeated progression section, and keep earlier experience secondary. |
| Make contact usable immediately | At 1280x720 the old actions were too far down. | Short close, matched action rows, and the original full portrait beside them. |

## Additional findings addressed

- Native fragment links now preserve history and move focus to focusable destinations.
- Header offset is measured, not guessed from two viewport widths.
- Program text is semantic content, not flattened under an image role.
- There is no pinned full-page timeline, hidden role text, or delayed text reveal.
- Map geometry loads near its section; static paths are calculated once.
- A failed map download falls back to the conference list without taking down the page.
- Hero preload and responsive image selection use the same width candidates.
- Social preview image URLs are absolute and a canonical page URL is provided.
- Pull-request checks cannot cancel the production deployment.
- Source checks protect portrait bytes, framing, fragment targets, and lazy loading.

## Evidence boundaries

The linked public resume corroborates laboratory roles, program operations, and
advisory-board work. Existing owner-approved site figures for the instructional
team and LMNOP membership are retained as the approved baseline, not newly audited
enrollment or membership counts. No additional budget totals, headcounts, floor
area, savings, or measured operational outcomes have been invented.

Dates distinguish Bernhardt operations since January 2019 from Abraham operations
since August 2025, and advisory-board membership since December 2022 from chair
service since July 2025. The owner-requested Resident Advisor wording is retained.

The resume metadata predates 2026; a separately named current public resume was
not located by the focused source review. The linked PDF is preserved rather than
silently replaced or described as newly verified. A confirmed newer public PDF,
verified space/budget scope, and one or two documented operational project outcomes
would support a future evidence expansion.

Campus images are architectural visualizations, not documentary photographs or
survey-grade representations. The portrait and its existing full-frame derivatives
are unchanged. No new generated imagery was introduced.

## Verification

Run `npm run check` and `git diff --check`. Review in the in-app browser only:
desktop and short laptop, tablet, 390px phone, and 320px phone. Check section
navigation and Back, disclosures, program buttons, all map locations, daypart
selection, contact framing, and mobile overflow. The operating system's reduced
motion preference disables scroll-linked cycle changes and sticky behavior.

Source checks complement, but do not replace, visual and keyboard review.
