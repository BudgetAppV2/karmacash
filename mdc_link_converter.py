# mdc_link_converter.py

import json
import os
import re
import argparse
from collections import defaultdict

def load_bible_index(index_file_path):
    """Loads the Bible index from a JSON file."""
    try:
        with open(index_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Index file not found at {index_file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {index_file_path}")
        return None

def extract_main_section_directory(part_id):
    """Extracts the main section directory (e.g., B1, B2) from a part_id."""
    match = re.match(r"^(b[0-9]+)-?", part_id.lower())
    if match:
        return match.group(1).upper()
    return "UnknownSection" # Fallback

def convert_content(content, bible_index, source_file_name, unresolved_links_log):
    """Converts mdc: links in the given content string."""
    # Regex to find mdc: links, including optional surrounding (see...) and parentheses
    # It captures the part_id and the full string to be replaced.
    # Using a more specific pattern for replacement to avoid greediness.
    # Pattern: (optional prefix)(mdc:part_id)(optional suffix)
    # Example: (see also mdc:b1-doc-1) or mdc:b2-doc-2
    
    processed_content = content
    converted_count = 0

    # Iterate multiple times for overlapping or adjacent matches if necessary, though finditer should handle most.
    # A simpler approach is to replace one by one.
    
    # Regex to find "mdc:part_id" which might be embedded
    # We want to replace *only* the mdc:part_id part or a slightly larger conventional container like (mdc:part_id)
    # Let's find all mdc:part_id instances first
    mdc_references = re.findall(r"mdc:([a-zA-Z0-9\-]+)", content)

    for part_id in set(mdc_references): # Use set to process each unique part_id once for replacement construction
        target_info = bible_index.get(part_id)
        
        if target_info:
            title = target_info.get("title", "Unnamed Document")
            main_section_dir = target_info.get("mainSectionDirectory", "UnknownSection")
            
            # Escape special characters in title for markdown link text
            escaped_title = title.replace("[", "\[").replace("]", "\]")
            
            new_link = f"[{escaped_title}](./{main_section_dir}/{part_id}.md)"
            
            # Now, construct regexes to replace variations of this mdc:part_id
            # Order matters: more specific/longer patterns first
            patterns_to_replace = [
                re.compile(r"\(see also mdc:" + re.escape(part_id) + r"\)"),
                re.compile(r"\(see mdc:" + re.escape(part_id) + r"\)"),
                re.compile(r"\(mdc:" + re.escape(part_id) + r"\)"),
                re.compile(r"mdc:" + re.escape(part_id)) # most generic
            ]
            
            replacements_made_for_this_part_id = 0
            for i, pattern in enumerate(patterns_to_replace):
                # Determine the replacement string based on the pattern
                if i == 0: # (see also mdc:...) -> (see also [link])
                    replacement_str = f"(see also {new_link})"
                elif i == 1: # (see mdc:...) -> (see [link])
                    replacement_str = f"(see {new_link})"
                elif i == 2: # (mdc:...) -> ([link])
                    replacement_str = f"({new_link})"
                else: # mdc:... -> [link]
                    replacement_str = new_link
                
                temp_content, num_subs = pattern.subn(replacement_str, processed_content)
                if num_subs > 0:
                    processed_content = temp_content
                    replacements_made_for_this_part_id += num_subs
            
            if replacements_made_for_this_part_id > 0:
                converted_count += replacements_made_for_this_part_id # Count actual substitutions
        else:
            unresolved_links_log.append(f"Unresolved: {part_id} in {source_file_name}")
            
    return processed_content, converted_count

def process_files(input_dir, output_dir, bible_index):
    """Processes all markdown files in the input directory."""
    report_data = {
        "files_processed": [],
        "unresolved_links": [],
        "conversion_summary": {}
    }

    if not bible_index:
        print("Bible index not loaded. Aborting processing.")
        return report_data

    for root, _, files in os.walk(input_dir):
        for file_name in files:
            if file_name.endswith(".md"):
                source_file_path = os.path.join(root, file_name)
                relative_path = os.path.relpath(source_file_path, input_dir)
                output_file_path = os.path.join(output_dir, relative_path)
                
                os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
                
                print(f"Processing: {source_file_path}")
                report_data["files_processed"].append(source_file_path)
                
                with open(source_file_path, 'r', encoding='utf-8') as f_in:
                    content = f_in.read()
                
                modified_content, num_converted = convert_content(content, bible_index, source_file_name=file_name, unresolved_links_log=report_data["unresolved_links"]) # Pass log list
                
                with open(output_file_path, 'w', encoding='utf-8') as f_out:
                    f_out.write(modified_content)
                
                report_data["conversion_summary"][source_file_path] = num_converted
                if num_converted > 0:
                    print(f"  Converted {num_converted} links in {file_name}")
                if any(part_id in file_name for part_id in report_data["unresolved_links"]):
                     print(f"  Found unresolved links for this file, check report.")
    return report_data

def generate_report(report_data, report_file_path):
    """Generates a markdown report of the conversion process."""
    with open(report_file_path, 'w', encoding='utf-8') as f:
        f.write("# MDC Link Conversion Report\n\n")
        f.write(f"Processed {len(report_data['files_processed'])} files.\n\n")
        
        f.write("## Conversion Summary:\n")
        if report_data["conversion_summary"]:
            for file_path, count in report_data["conversion_summary"].items():
                f.write(f"- `{file_path}`: Converted {count} links\n")
        else:
            f.write("No links were converted.\n")
        f.write("\n")
        
        f.write("## Unresolved Links:\n")
        if report_data["unresolved_links"]:
            # Remove duplicates for reporting
            unique_unresolved = sorted(list(set(report_data["unresolved_links"])))
            for unresolved in unique_unresolved:
                f.write(f"- {unresolved}\n")
        else:
            f.write("No unresolved links found.\n")
        f.write("\n")
    print(f"Report generated at {report_file_path}")


def main():
    parser = argparse.ArgumentParser(description="Convert mdc: links in KarmaCash Bible markdown files.")
    parser.add_argument("input_dir", help="Directory containing the source markdown files.")
    parser.add_argument("output_dir", help="Directory where converted files will be saved.")
    parser.add_argument("index_file", help="Path to the bible_index.json file.")
    parser.add_argument("--report_file", default="conversion_report.md", help="Path to save the conversion report (default: conversion_report.md).")
    
    args = parser.parse_args()
    
    bible_index_data = load_bible_index(args.index_file)
    if not bible_index_data:
        return

    # The index is expected to be a dictionary keyed by part_id
    # If it's a list of objects, convert it
    processed_bible_index = {}
    if isinstance(bible_index_data, list):
        for item in bible_index_data:
            if 'part_id' in item:
                # Ensure mainSectionDirectory is pre-calculated or derivable
                if 'mainSectionDirectory' not in item:
                    item['mainSectionDirectory'] = extract_main_section_directory(item['part_id'])
                processed_bible_index[item['part_id']] = item
            else:
                print(f"Warning: Index item missing 'part_id': {item}")
    elif isinstance(bible_index_data, dict):
         # Assume it's already in the correct format or needs similar processing
        for part_id, item_data in bible_index_data.items():
            if isinstance(item_data, dict) and 'mainSectionDirectory' not in item_data:
                 item_data['mainSectionDirectory'] = extract_main_section_directory(part_id)
            processed_bible_index[part_id] = item_data # ensure part_id is the key
    else:
        print("Error: Bible index is not in expected list or dict format.")
        return

    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)
        
    report_info = process_files(args.input_dir, args.output_dir, processed_bible_index)
    generate_report(report_info, args.report_file)

if __name__ == "__main__":
    main() 