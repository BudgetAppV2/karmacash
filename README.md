# MDC Link Conversion Toolkit for KarmaCash Bible

## 1. Purpose

This toolkit provides a Python script (`mdc_link_converter.py`) to systematically identify and convert `mdc:{part_id}` style cross-references within the KarmaCash Bible's Markdown documents into standard relative Markdown links. This facilitates better navigation and consistency across the documentation, which is intended to be stored as individual Markdown files per subdivided Bible part.

This script is developed as part of Task #3: "Develop MDC Link Application Toolkit/Process".

## 2. Prerequisites

*   **Python 3.x**: The script is written in Python 3.
*   **No external libraries required**: Uses only standard Python libraries (`os`, `json`, `re`, `argparse`).
*   **Bible Index File (`bible_index.json`)**: A JSON file that maps `part_id` values to their `title` and `mainSectionDirectory`. This file needs to be generated separately from the `bible_subdivisions` Firestore collection.

## 3. Preparing the `bible_index.json` File

The `mdc_link_converter.py` script relies on a `bible_index.json` file to resolve `part_id` references to their corresponding document titles and main section directories. This index acts as a local cache of the necessary Bible metadata.

**Format of `bible_index.json`:**

The file should be a JSON object where each key is a `part_id` (string), and the value is an object containing at least a `title` (string) and a `mainSectionDirectory` (string, e.g., "B1", "B2").

Example structure:

```json
{
  "b1-1-vision-goals-001-vision-principles": {
    "title": "Part 1: Vision Statement & Core Principles (Original Document: B1.1 Vision & Goals)",
    "mainSectionDirectory": "B1"
  },
  "b1-3-roadmap-001-overview": {
    "title": "Part 1: Roadmap Overview (Original Document: B1.3 Roadmap & Milestones)",
    "mainSectionDirectory": "B1"
  },
  "b2-1-design-philosophy-001-zen-ui": {
    "title": "Part 1: Zen UI Design Philosophy (Original Document: B2.1 Design Philosophy)",
    "mainSectionDirectory": "B2"
  }
  // ... other part_ids
}
```

**Generating `bible_index.json` (Conceptual):**

A separate script (not part of this specific toolkit deliverable but necessary for its operation) would typically perform the following:

1.  Connect to the `bible_subdivisions` Firestore collection.
2.  Iterate through all documents.
3.  For each document, extract `part_id` and `title`.
4.  Derive `mainSectionDirectory` from `part_id` (e.g., `b1-xyz` -> `B1`).
5.  Construct the JSON object as shown above and save it as `bible_index.json`.

## 4. How to Run the Script

The script is run from the command line.

```bash
python mdc_link_converter.py <input_directory> <output_directory> <path_to_bible_index.json> [--report_file <report_output_path>]
```

**Arguments:**

*   `input_directory`: (Required) Path to the directory containing the source Bible Markdown files. The script will recursively walk through this directory.
*   `output_directory`: (Required) Path to the directory where the converted files (with modified links) will be saved. The original directory structure from `input_directory` will be preserved.
*   `path_to_bible_index.json`: (Required) Path to the `bible_index.json` file.
*   `--report_file <report_output_path>`: (Optional) Path to save the Markdown conversion report. Defaults to `conversion_report.md` in the current working directory where the script is run.

**Example:**

```bash
python mdc_link_converter.py ./bible_markdown_source/ ./bible_markdown_converted/ ./bible_index.json --report_file ./link_conversion_status.md
```

## 5. Script Operation

1.  Loads the `bible_index.json`.
2.  Recursively scans the `input_directory` for `.md` files.
3.  For each Markdown file:
    a.  Reads the content.
    b.  Uses regular expressions to find all occurrences of `mdc:{part_id}` (and variations like `(see mdc:{part_id})`).
    c.  For each found `part_id`:
        i.  Looks up the `part_id` in the loaded `bible_index.json`.
        ii. If found, constructs a relative Markdown link: `[Title From Index](./{MainSectionDirFromIndex}/{part_id}.md)`.
        iii.Replaces the original `mdc:` reference with the new link, attempting to preserve surrounding text like "(see ...)".
        iv. If not found in the index, the `mdc:` reference is left unchanged, and the unresolved link is logged.
    d.  Writes the (potentially modified) content to the corresponding path in the `output_directory`.
4.  Generates a Markdown report (`conversion_report.md` by default) summarizing:
    *   A list of all files processed.
    *   The number of links converted in each file.
    *   A list of all unresolved `mdc:` links (where the `part_id` was not found in the index), noting the source file for each.

## 6. Output

*   **Converted Files:** Markdown files with `mdc:` links replaced, located in the specified `output_directory`.
*   **Conversion Report:** A Markdown file (e.g., `conversion_report.md`) detailing the process.

## 7. Limitations & Future Considerations

*   **Anchor Links (`#anchor`):** The current version does not automatically generate or resolve links to specific anchors within target documents. The target link format includes a placeholder for this if needed in the future.
*   **File Paths in Index:** The current script assumes target filenames are `{part_id}.md` and constructs paths based on `mainSectionDirectory`. If the actual file export/storage mechanism for Bible documents results in different paths or filenames, the link construction logic and/or the `bible_index.json` content would need adjustment.
*   **Direct Firestore Mode:** This script operates on local files. A future version could be adapted to read from and write to Firestore directly (though this adds complexity and risk if not handled carefully).
*   **Regex Precision:** The regex for finding and replacing `mdc:` links aims to be robust but might require refinement if very unusual or complex embedding patterns for `mdc:` tags exist.