# KarmaCash Bible

## Introduction
Welcome to the KarmaCash Bible - the comprehensive reference guide for the KarmaCash personal budgeting application. This document serves as the central source of truth for all aspects of the project, from vision and strategy to technical implementation details.

## Structure
The Bible is organized into logical sections, each covering a specific aspect of the project:

### B1: Vision, Roadmap & Strategy
- [B1.1 Project Vision & Goals](./B1_Vision_Roadmap_Strategy/B1.1_Project_Vision_Goals.md)
- [B1.2 Target Audience](./B1_Vision_Roadmap_Strategy/B1.2_Target_Audience.md)
- [B1.3 Roadmap & Milestones](./B1_Vision_Roadmap_Strategy/B1.3_Roadmap_Milestones.md)
- [B1.4 Post-MVP Features](./B1_Vision_Roadmap_Strategy/B1.4_PostMVP_Features.md)
- [B1.5 Commercialization](./B1_Vision_Roadmap_Strategy/B1.5_Commercialization.md)
- [B1.6 Competitive Analysis](./B1_Vision_Roadmap_Strategy/B1.6_Competitive_Analysis.md)

### B2: Core Principles & Standards
- [B2.1 Design Philosophy](./B2_Core_Principles_Standards/B2.1_Design_Philosophy.md)
- [B2.2 Technical Standards](./B2_Core_Principles_Standards/B2.2_Technical_Standards.md)
- [B2.3 Date Handling Guide](./B2_Core_Principles_Standards/B2.3_Date_Handling_Guide.md)
- [B2.4 Error Handling Strategy](./B2_Core_Principles_Standards/B2.4_Error_Handling_Strategy.md)
- [B2.5 Code & Project Structure](./B2_Core_Principles_Standards/B2.5_Code_Project_Structure.md)

### B3: UI/UX Implementation
- [B3.4 Guidelines](./B3_UI_UX_Implementation/B3.4_Guidelines.md)
- [B3.6 Glossary FR](./B3_UI_UX_Implementation/B3.6_Glossary_FR.md)
- [B3.7 Component Specs](./B3_UI_UX_Implementation/B3.7_Component_Specs.md)
- [B3.8 Style Guide v2](./B3_UI_UX_Implementation/B3.8_Style_Guide_v2.md)
- [B3.9 Mood Board](./B3_UI_UX_Implementation/B3.9_Mood_Board.md)
- [B3.11 Animations & Interactions](./B3_UI_UX_Implementation/B3.11_Animations_Interactions.md)
- [B3.12 Theme Impact Notes](./B3_UI_UX_Implementation/B3.12_Theme_Impact_Notes.md)

### B4: Architecture & Implementation
- [B4.1 Tech Stack Details](./B4_Architecture_Implementation/B4.1_Tech_Stack_Details.md)
- [B4.2 Frontend Structure](./B4_Architecture_Implementation/B4.2_Frontend_Structure.md)
- [B4.3 Backend Functions](./B4_Architecture_Implementation/B4.3_Backend_Functions.md)
- [B4.4 Logging System Impl](./B4_Architecture_Implementation/B4.4_Logging_System_Impl.md)

### B5: Data Models & Firestore
- [B5.1 Schema Overview](./B5_Data_Models_Firestore/B5.1_Schema_Overview.md)
- [B5.2 Collections & Schemas](./B5_Data_Models_Firestore/B5.2_Collections_Schemas.md)

### B6: Core Logic & Algorithms
- [B6.1 Budget Calculations](./B6_Core_Logic_Algorithms/B6.1_Budget_Calculations.md)
- [B6.2 Recurring Algorithm](./B6_Core_Logic_Algorithms/B6.2_Recurring_Algorithm.md)

### B7: Development Process
- [B7.1 AI Workflow & SHIP](./B7_Development_Process/B7.1_AI_Workflow_SHIP.md)
- [B7.2 Testing Strategy](./B7_Development_Process/B7.2_Testing_Strategy.md)
- [B7.3 Decision Log](./B7_Development_Process/B7.3_Decision_Log.md)
- [B7.4 Healthy Work Practices](./B7_Development_Process/B7.4_Healthy_Work_Practices.md)

### B8: Setup & Development
- [B8.1 Project Setup Guide](./B8_Setup_Development/B8.1_Project_Setup_Guide.md)

## Using This Documentation

- Each file is focused on a specific topic, making it easier to find relevant information
- Cross-references use the [BX.Y] notation (e.g., [B5.2]) to point to other relevant sections
- This modular structure allows for easier updates and maintenance as the project evolves
- Use the file structure for navigation or search functionality to find specific topics

## Critical Project Standards
- **Project Name**: KarmaCash
- **Visual Theme**: "Zen/Tranquility" with Japandi-inspired palette, Heroicons, and calm animations
- **Architecture**: Designing for Shared Budgets as a high-priority post-MVP feature
- **Date/Time Handling**: All date/time operations use strict UTC date component comparison
- **Recurring Transactions**: Generated via Firebase Callable Functions triggered from the UI
- **AI Workflow**: Structured process involving Context Keeper, Human Developer, and Code Generator
