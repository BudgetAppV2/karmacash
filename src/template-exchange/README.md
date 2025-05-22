# Template Exchange System

This directory contains the implementation of the Template Exchange System, which facilitates the exchange of templates between Google AI Studio and Cursor AI.

## Project Structure

```
src/template-exchange/
├── models/             # Data models and schema definitions
│   └── template-exchange-schema.js
├── api/                # API endpoints and Cloud Functions
├── utils/              # Utility functions and Firebase initialization
│   └── firebase.js
├── services/           # Business logic services
├── components/         # UI components for web interface
├── tests/              # Test files
│   └── template-model.test.js
└── docs/               # Documentation
    └── template-exchange-data-model.md
```

## Features

The Template Exchange System provides:

1. A Firestore database for storing template data
2. Cloud Functions for API endpoints 
3. A web interface for managing templates
4. Chrome extension for Google AI Studio integration
5. Integration script for Cursor AI

## Task Implementation Progress

This project is being implemented through a series of tasks:

- [x] FTR-7.1: Définition du modèle de données pour les templates Firebase
- [ ] FTR-7.2: Configuration de la collection Firestore et des règles de sécurité
- [ ] FTR-7.3: Développement des Cloud Functions pour l'API de gestion des templates
- [ ] FTR-7.4: Création de l'interface web minimaliste pour la gestion des templates
- [ ] FTR-7.5: Développement du script d'intégration pour Cursor AI
- [ ] FTR-7.6: Configuration du déploiement Firebase pour l'interface web
- [ ] FTR-7.7: Développement de l'extension Chrome pour Google AI Studio
- [ ] FTR-7.8: Empaquetage et déploiement de l'extension Chrome
- [ ] FTR-7.9: Tests d'intégration du flux de travail complet
- [ ] FTR-7.10: Documentation utilisateur et mise à jour de la Bible

## Getting Started

To start working on this project:

1. Set up Firebase project credentials
2. Initialize Firebase Admin SDK
3. Configure Firestore security rules
4. Deploy Cloud Functions

## Documentation

For detailed documentation:

- See `docs/template-exchange-data-model.md` for the data model design
- Refer to the Context7 documentation queries in `docs/00_context7-docs-by-task.md` 