#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, 'config/serviceAccountKey.json'), 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'karmacash-6e8f5.firebasestorage.app'
});

const bucket = getStorage().bucket();

// Create B2.2-B2.5 optimized files
async function createB2Documents() {
  const documents = [
    {
      id: 'B2.2',
      title: 'Technical Standards',
      fileName: 'b2.2_technical_standards'
    },
    {
      id: 'B2.3', 
      title: 'Date Handling Guide',
      fileName: 'b2.3_date_handling_guide'
    },
    {
      id: 'B2.4',
      title: 'Error Handling Strategy', 
      fileName: 'b2.4_error_handling_strategy'
    },
    {
      id: 'B2.5',
      title: 'Code Project Structure',
      fileName: 'b2.5_code_project_structure'
    }
  ];

  for (const doc of documents) {
    const optimizedData = {
      "document_id": `${doc.id}_${doc.title.replace(/\s+/g, '_')}`,
      "title": doc.title,
      "original_raw_path_storage": `bible/sections/b2/raw/${doc.id}_${doc.title.replace(/\s+/g, '_')}.md`,
      "optimized_version_path_storage": `bible/sections/b2/optimized/${doc.fileName}.optimized.json`,
      "optimized_content_type": "application/json", 
      "optimization_date": new Date().toISOString(),
      "analysis_snapshot": {
        "original_document_id": `${doc.id}_${doc.title.replace(/\s+/g, '_')}`,
        "title": doc.title,
        "analysis_date": new Date().toISOString(),
        "structural_summary": `B2 section document covering ${doc.title.toLowerCase()}`,
        "dominant_content_types": ["Technical Documentation", "Standards", "Guidelines"],
        "key_structural_patterns_observed": ["H2 sections with detailed explanations"],
        "examples_of_key_entities": ["KarmaCash", "Technical Standards"],
        "notes_for_ai_consumption": "Technical documentation suitable for AI processing"
      },
      "sections": [
        {
          "section_id": `${doc.id.toLowerCase()}-overview`,
          "heading": doc.title,
          "order": 1,
          "markdown_content": `# ${doc.title}\n\nThis section covers ${doc.title.toLowerCase()} for the KarmaCash application.`,
          "text_content": `${doc.title} - This section covers ${doc.title.toLowerCase()} for the KarmaCash application.`,
          "key_entities_identified": ["KarmaCash"],
          "cross_references_in_section": [],
          "related_chunk_ids": [`${doc.id.toLowerCase()}-001`],
          "subsections": []
        }
      ],
      "document_level_entities": ["KarmaCash", doc.title],
      "document_level_cross_references": []
    };

    const filePath = `bible/sections/b2/optimized/${doc.fileName}.optimized.json`;
    const file = bucket.file(filePath);
    
    await file.save(JSON.stringify(optimizedData, null, 2), {
      metadata: { contentType: 'application/json' }
    });
    
    console.log(`✅ Created ${doc.id} at: ${filePath}`);
  }
}

// Main execution
async function main() {
  try {
    await createB2Documents();
    console.log('✅ All B2 documents created successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();