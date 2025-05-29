# MDC Link Creation Methodology for KarmaCash Bible

**Version:** 1.0
**Date:** 2024-07-30

## 1. Introduction

This document outlines the methodology for identifying existing cross-references within the KarmaCash Bible documents (stored in the `bible_subdivisions` Firestore collection) and converting them into a standardized Markdown (MDC) link format. This will ensure consistent and functional navigation across the modularized Bible documentation.

## 2. Identified Cross-Referencing Patterns (Source Formats)

Based on a review of sample documents, the primary cross-referencing pattern to be converted is:

*   **MDC Colon Format:** `mdc:{document-id}`
    *   This pattern is often found as `(see mdc:{document-id})`, `(see also mdc:{document-id})`, or simply `mdc:{document-id}`.
    *   The `{document-id}` directly corresponds to the `part_id` field of a target document in the `bible_subdivisions` Firestore collection.
    *   Examples: `mdc:b1-3-roadmap-001-overview`, `mdc:b2-3-code-quality-001-code-style-formatting`.

Other observed patterns (not primary conversion targets but informative):

*   **Declared Standard (Display Text):** `[BX.Y.Z-section-name]` - Mentioned as a notation for *pointing* to sections, often used as display text within links.
*   **Explicit Markdown Links (in TOC):** `[Display Text](./Path/To/File.md)` - Primarily used in the main Table of Contents document (`b0-readme-toc-002-toc-usage-standards`) for navigation. These are already in a functional Markdown format and likely do not need conversion by this process, but they inform the target structure.

## 3. Target MDC Link Format

The standardized target format for converted links will be:

`[Resolved Link Text](./{MainSectionDirectory}/{part_id}.md)`

Where:

*   **`[Resolved Link Text]`**: This will be the `title` field of the target document (retrieved from `bible_subdivisions` using the `part_id`). If the original reference was part of a phrase like "(see mdc:...)", the link should ideally replace the `mdc:` part, retaining the surrounding text. For standalone `mdc:...` references, the title of the target document becomes the link text.
*   **`./`**: Indicates a relative link from the current document's location.
*   **`{MainSectionDirectory}`**: A directory corresponding to the main Bible section of the target document. For a `part_id` like `b1-3-roadmap-001-overview`, the `MainSectionDirectory` would be `B1`. For `b2-1-design-philosophy-001-zen-ui`, it would be `B2`, and so on. This requires extracting the `BX` part from the `part_id`.
*   **`{part_id}.md`**: The filename will be the `part_id` of the target document, with a `.md` extension. Example: `b1-3-roadmap-001-overview.md`.
*   **`#optional-anchor`**: Initially, anchors will not be automatically generated. If future needs require linking to specific headings within a target document, this part of the format can be utilized.

**Example Conversion:**

*   Source in document `bX-Y-documentA.md`: `(see mdc:b1-3-roadmap-001-overview for more details)`
*   Target document (`part_id`: `b1-3-roadmap-001-overview`) has `title`: "Part 1: Roadmap Overview (Original Document: B1.3 Roadmap & Milestones)"
*   Converted link in `bX-Y-documentA.md`: `(see [Part 1: Roadmap Overview (Original Document: B1.3 Roadmap & Milestones)](./B1/b1-3-roadmap-001-overview.md) for more details)`

## 4. Conversion Process (Scriptable/Systematic Manual)

This process will be applied to the `content` field of each document in the `bible_subdivisions` collection.

**Steps:**

1.  **Iterate Through Documents:** For each document in `bible_subdivisions`:
    a.  Let the current document being processed be `source_doc`.
    b.  Retrieve `source_doc.content`.

2.  **Identify `mdc:` References:**
    a.  Use a regular expression to find all occurrences of `mdc:{document-id}` patterns within `source_doc.content`.
        *   Regex considerations: `mdc:([a-zA-Z0-9\-]+)` to capture the `document-id`. variations like `(see mdc:...)` need to be handled to correctly replace only the `mdc:` part.
    b.  For each found `mdc:{target_part_id}`:

3.  **Resolve Target Document & Construct Link:**
    a.  Query `bible_subdivisions` for a document where `part_id == target_part_id`.
    b.  **If target document is found:**
        i.  Let the found document be `target_doc`.
        ii. Get `target_doc.title` for the link text.
        iii.Determine `MainSectionDirectory` from `target_part_id` (e.g., "b1-" -> "B1", "b2-" -> "B2").
        iv. Construct the new Markdown link: `[target_doc.title](./{MainSectionDirectory}/{target_part_id}.md)`
        v.  Replace the original `mdc:{target_part_id}` (or the minimal string containing it, e.g. `mdc:xyz` within `(see mdc:xyz)`) in `source_doc.content` with the new Markdown link.
    c.  **If target document is NOT found (e.g., points to B4-B8 sections not yet populated):**
        i.  The `mdc:{target_part_id}` reference should be left as is in the content.
        ii. A warning/log should be generated noting the unresolved link and the `source_doc.part_id` where it was found. This will help identify broken links or references to future content.

4.  **Update Source Document Content:**
    a.  After processing all `mdc:` references in `source_doc.content`, if any changes were made, the `source_doc.content` should be updated in Firestore. (Note: For this task, we are only *proposing* the methodology; actual updates will be in subsequent tasks).

## 5. Tools & Scripts (Proposal)

*   **Primary Tool:** A script (e.g., Python or Node.js) with Firebase Admin SDK access.
    *   The script would perform steps 1-4 outlined above.
    *   It would require read access to `bible_subdivisions` and potentially write access if run in an update mode later.
    *   Logging capabilities for successful conversions and unresolved links are crucial.
*   **Manual Process (Fallback/Verification):**
    *   If scripting is not immediately feasible, a systematic manual process using text editors with find/replace (regex capable) could be documented. This is less ideal due to scale and error potential.
    *   Manual verification of a subset of scripted changes would still be recommended.

## 6. Handling Edge Cases & Considerations

*   **Varying `mdc:` contexts:**
    *   `mdc:doc-id`
    *   `(mdc:doc-id)`
    *   `see mdc:doc-id`
    *   `[some text mdc:doc-id]`
    The replacement logic must be precise to only replace the `mdc:doc-id` part or the smallest sensible containing string, preserving surrounding grammar.
*   **Case Sensitivity:** `part_id` values appear to be lowercase. Assume case-sensitive matching.
*   **Performance:** For large-scale updates, batching Firestore reads/writes might be necessary if using a script.
*   **Idempotency:** If the script is run multiple times, it should not corrupt already converted links. This can be achieved by making the regex for finding `mdc:` links very specific and ensuring the target format doesn't match this source regex.

## 7. Validation Steps

*   **Automated Checks (Script):**
    *   Log all attempted conversions (source `part_id`, target `part_id`, success/failure).
    *   Log all unresolved `mdc:` links.
*   **Manual Review:**
    *   Spot-check a sample of converted documents to ensure links are correctly formatted and resolve to the intended conceptual target.
    *   Review the log of unresolved links for further action (e.g., identifying missing Bible content).
*   **Link Integrity (Future):** Once documents are exported as files, standard Markdown link checkers could be used.

## 8. Deliverable for this Task

The deliverable for this task (Task #2) is this document itself: `mdc_link_creation_methodology.md`.

--- 