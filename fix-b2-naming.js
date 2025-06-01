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

// Create B2.1 optimized file with correct naming for Bible Access Module
async function createB2_1_Optimized() {
  const optimizedData = {
    "document_id": "B2.1_Design_Philosophy",
    "title": "Design Philosophy",
    "original_raw_path_storage": "bible/sections/b2/raw/B2.1_Design_Philosophy.md",
    "optimized_version_path_storage": "bible/sections/b2/optimized/b2.1_design_philosophy.optimized.json",
    "optimized_content_type": "application/json",
    "optimization_date": new Date().toISOString(),
    "analysis_snapshot": {
      "original_document_id": "B2.1_Design_Philosophy",
      "title": "Design Philosophy",
      "analysis_date": new Date().toISOString(),
      "structural_summary": "Document focuses on Zen/Tranquility design philosophy with H2 sections for core concepts and design principles",
      "dominant_content_types": [
        "Design Philosophy Documentation",
        "Principle Definitions",
        "Design Guidelines",
        "Brand Identity Concepts"
      ],
      "key_structural_patterns_observed": [
        "H1 title with H2 major sections",
        "Philosophical foundation followed by practical principles",
        "Numbered principle lists with detailed explanations"
      ],
      "examples_of_key_entities": [
        "Zen/Tranquility",
        "KarmaCash",
        "Design Philosophy",
        "Japandi-inspired palette",
        "Financial Anxiety",
        "Mindful Decisions"
      ],
      "notes_for_ai_consumption": "Strong philosophical foundation suitable for AI processing with clear principle hierarchy"
    },
    "sections": [
      {
        "section_id": "B2.1-zen_tranquility_core",
        "heading": "Zen/Tranquility: Core Design Philosophy",
        "order": 1,
        "markdown_content": "KarmaCash is built on a deliberately chosen \"Zen/Tranquility\" design philosophy that transforms the typically stressful experience of financial management into one of mindfulness, clarity, and positive control. This approach represents a significant departure from conventional financial application design, which often emphasizes data density, corporate aesthetics, and utilitarian interfaces.",
        "text_content": "KarmaCash is built on a deliberately chosen Zen/Tranquility design philosophy that transforms the typically stressful experience of financial management into one of mindfulness, clarity, and positive control. This approach represents a significant departure from conventional financial application design, which often emphasizes data density, corporate aesthetics, and utilitarian interfaces.",
        "key_entities_identified": ["KarmaCash", "Zen/Tranquility"],
        "cross_references_in_section": [],
        "related_chunk_ids": ["B2.1-001"],
        "subsections": []
      },
      {
        "section_id": "B2.1-philosophical_foundation",
        "heading": "Philosophical Foundation",
        "order": 2,
        "markdown_content": "### Reducing Financial Anxiety\nFinancial management is consistently ranked among the top sources of personal stress. A calming visual environment—achieved through muted natural colors, generous whitespace, and minimalist design—can measurably reduce cognitive load and emotional tension. The app thus becomes a supportive sanctuary rather than another source of pressure.\n\n### Promoting Clarity and Focus\nBy minimizing visual clutter and establishing clear information hierarchy, users can more quickly comprehend their financial status and make informed decisions. This clarity is particularly crucial when users are making consequential financial choices or feeling overwhelmed.\n\n### Supporting Mindful Financial Decisions\nThe Zen aesthetic encourages users to slow down and be present—principles directly applicable to healthier financial decision-making. Research in behavioral economics suggests that impulsive financial decisions often lead to regret, while deliberate choices align better with long-term goals. Our design supports this \"slow finance\" approach.\n\n### Brand Alignment with KarmaCash Identity\nThe name \"KarmaCash\" itself evokes the Eastern philosophical concept that actions have consequences—perfectly aligned with financial planning where today's decisions affect tomorrow's outcomes. The enso circle logo (an incomplete circle drawn in a single brushstroke) symbolizes both perfection and imperfection, mirroring the reality of personal finance as an ongoing journey rather than a fixed destination.",
        "text_content": "Reducing Financial Anxiety, Promoting Clarity and Focus, Supporting Mindful Financial Decisions, Brand Alignment with KarmaCash Identity",
        "key_entities_identified": ["Financial Anxiety", "KarmaCash", "enso circle logo"],
        "cross_references_in_section": [],
        "related_chunk_ids": ["B2.1-002"],
        "subsections": []
      },
      {
        "section_id": "B2.1-design_principles",
        "heading": "Design Principles",
        "order": 3,
        "markdown_content": "### 1. Calm & Minimalist Aesthetic\n- Create a serene, uncluttered interface that reduces financial anxiety\n- Use muted, natural colors from the Japandi-inspired palette\n- Incorporate generous whitespace and clean typography\n- Avoid visual noise or excessive elements that could create stress when dealing with financial information\n\n### 2. Clarity & Focus\n- Prioritize information hierarchy to guide users' attention to what matters most\n- Use subtle visual cues rather than harsh contrasting elements\n- Each screen should have a clear purpose with minimal distractions\n- Support mindful financial decision-making through focused interface design\n\n### 3. Essential Simplicity\n- Continuously question whether each element serves a vital purpose\n- Favor simplicity over complexity in both visual design and interaction patterns\n- Create streamlined workflows that minimize cognitive load\n- Eliminate unnecessary steps and visual elements\n\n### 4. Progressive Disclosure\n- Reveal complexity only when needed, maintaining the calm surface experience\n- Layer information to provide depth without overwhelming\n- Allow users to dig deeper when they want more detail\n- Present the most important information first, with secondary details accessible but not intrusive\n\n### 5. Consistency of Feeling\n- Ensure all components—from major screens to minor dialogs—maintain the tranquil quality\n- Create a coherent experience across all parts of the application\n- Maintain visual and interaction consistency throughout",
        "text_content": "1. Calm & Minimalist Aesthetic, 2. Clarity & Focus, 3. Essential Simplicity, 4. Progressive Disclosure, 5. Consistency of Feeling",
        "key_entities_identified": ["Japandi-inspired palette", "Progressive Disclosure"],
        "cross_references_in_section": [],
        "related_chunk_ids": ["B2.1-003"],
        "subsections": []
      }
    ],
    "document_level_entities": [
      "KarmaCash",
      "Zen/Tranquility",
      "Design Philosophy", 
      "Japandi-inspired palette",
      "Financial Anxiety",
      "Progressive Disclosure"
    ],
    "document_level_cross_references": []
  };

  // Upload to the correct path expected by Bible Access Module
  const correctPath = 'bible/sections/b2/optimized/b2.1_design_philosophy.optimized.json';
  const file = bucket.file(correctPath);
  
  await file.save(JSON.stringify(optimizedData, null, 2), {
    metadata: { contentType: 'application/json' }
  });
  
  console.log(`✅ Created B2.1 optimized file at: ${correctPath}`);
  return correctPath;
}

// Main execution
async function main() {
  try {
    await createB2_1_Optimized();
    console.log('✅ B2.1 repair completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();