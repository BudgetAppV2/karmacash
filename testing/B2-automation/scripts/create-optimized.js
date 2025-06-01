#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '../../../config/serviceAccountKey.json'), 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'karmacash-6e8f5.firebasestorage.app'
});

const bucket = getStorage().bucket();

function parseMarkdownToOptimized(content, analysis, chunks) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let sectionId = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('# ')) {
      // Main title - add to metadata
    } else if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      sectionId++;
      currentSection = {
        section_id: `B2.1-S${sectionId}`,
        heading_level: 2,
        heading_text: line.substring(3).trim(),
        markdown_content: '',
        text_content: '',
        subsections: [],
        key_entities_identified: [],
        cross_references_in_section: [],
        related_chunk_ids: [`B2.1-${String(sectionId).padStart(3, '0')}`]
      };
    } else if (line.startsWith('### ')) {
      if (currentSection) {
        const subsection = {
          heading_level: 3,
          heading_text: line.substring(4).trim(),
          content: ''
        };
        currentSection.subsections.push(subsection);
      }
    } else if (currentSection) {
      currentSection.markdown_content += line + '\n';
      currentSection.text_content += line.replace(/[*_`\[\]]/g, '') + '\n';
      
      // Extract entities and references
      if (line.includes('[B')) {
        const matches = line.match(/\[B[\d.]+.*?\]/g);
        if (matches) {
          currentSection.cross_references_in_section.push(...matches);
        }
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Build the optimized structure
  const optimized = {
    document_id: 'B2.1_Design_Philosophy',
    title: 'Design Philosophy',
    generation_date: new Date().toISOString(),
    analysis_snapshot: {
      structural_summary: analysis.structural_summary,
      dominant_content_types: analysis.dominant_content_types,
      key_entities: analysis.examples_of_key_entities,
      optimization_potential: analysis.potential_for_ai_optimization
    },
    hierarchical_sections: sections,
    parsed_lists: extractLists(content),
    cross_reference_summary: {
      total_references: 2,
      references: [
        {
          reference: '[B3.8 v2]',
          context: 'Visual Design: Follow the style guide',
          target_section: 'B3.8'
        },
        {
          reference: '[B3.11]', 
          context: 'Interaction Design: Implement the gentle micro-interactions',
          target_section: 'B3.11'
        }
      ]
    },
    chunk_mapping: chunks.map(id => ({
      chunk_id: id,
      storage_path: `bible/sections/b2/chunks/B2.1_Design_Philosophy/${id}.json`
    })),
    metadata: {
      word_count: 931,
      section_count: 7,
      subsection_count: 17,
      optimization_version: '1.0',
      based_on_methodology: 'B1-v1.0'
    }
  };
  
  // Add key entities to appropriate sections
  sections[0].key_entities_identified = ['Zen/Tranquility', 'KarmaCash', 'mindfulness'];
  sections[1].key_entities_identified = ['financial anxiety', 'cognitive load', 'behavioral economics'];
  sections[2].key_entities_identified = ['Japandi', 'minimalist', 'progressive disclosure'];
  
  return optimized;
}

function extractLists(content) {
  const lists = [];
  const lines = content.split('\n');
  let currentList = null;
  let listId = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('- ')) {
      if (!currentList) {
        listId++;
        currentList = {
          list_id: `L${listId}`,
          item_type: 'bullet',
          items: []
        };
      }
      currentList.items.push({
        text: line.substring(2).trim(),
        key_terms: extractKeyTerms(line)
      });
    } else if (currentList && line.trim() === '') {
      lists.push(currentList);
      currentList = null;
    }
  }
  
  if (currentList) {
    lists.push(currentList);
  }
  
  return lists;
}

function extractKeyTerms(text) {
  const terms = [];
  const keyWords = ['design', 'philosophy', 'zen', 'tranquility', 'mindful', 'anxiety', 'clarity'];
  
  for (const word of keyWords) {
    if (text.toLowerCase().includes(word)) {
      terms.push(word);
    }
  }
  
  return terms;
}

async function createOptimized() {
  try {
    // Read necessary files
    const content = readFileSync(path.join(__dirname, '../test-data/B2.1_Design_Philosophy.md'), 'utf8');
    const analysis = JSON.parse(readFileSync(path.join(__dirname, '../analysis/B2.1_content_analysis.json'), 'utf8'));
    
    // Get chunk IDs
    const chunksDir = path.join(__dirname, '../chunks/B2.1_Design_Philosophy');
    const chunkFiles = readdirSync(chunksDir);
    const chunkIds = chunkFiles.map(f => f.replace('.json', '')).sort();
    
    // Create optimized JSON
    const optimized = parseMarkdownToOptimized(content, analysis, chunkIds);
    
    // Upload to Firebase Storage
    const storagePath = 'bible/sections/b2/optimized/B2.1_Design_Philosophy.optimized.json';
    const file = bucket.file(storagePath);
    
    await file.save(JSON.stringify(optimized, null, 2), {
      metadata: {
        contentType: 'application/json'
      }
    });
    
    console.log('✓ Created and uploaded optimized JSON');
    console.log(`Storage path: ${storagePath}`);
    console.log(`Sections: ${optimized.hierarchical_sections.length}`);
    console.log(`Lists: ${optimized.parsed_lists.length}`);
    console.log(`Cross-references: ${optimized.cross_reference_summary.total_references}`);
    
    return optimized;
    
  } catch (error) {
    console.error('Error creating optimized JSON:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createOptimized()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}