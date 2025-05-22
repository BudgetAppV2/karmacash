# Template Exchange API Deployment Guide

This guide covers the steps needed to deploy the Template Exchange API as Firebase Cloud Functions.

## Prerequisites

Before you begin, ensure you have the following:

1. A Firebase project created in the [Firebase Console](https://console.firebase.google.com/)
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Node.js (v18 or later) and npm installed
4. Google Cloud CLI (optional, for more advanced deployment options)

## Setup Steps

### 1. Clone the Repository

If you haven't already, clone the repository containing the Template Exchange System:

```bash
git clone [repository-url]
cd [repository-directory]
```

### 2. Configure Firebase Project

Login to Firebase and select your project:

```bash
firebase login
firebase use --add
```

When prompted, select your Firebase project.

### 3. Generate Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Project Settings > Service Accounts
3. Click "Generate New Private Key"
4. Save the key file to a secure location (do not commit this to version control)

### 4. Set Up Firestore

If you haven't already set up Firestore in your Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Build > Firestore Database
3. Click "Create Database"
4. Choose "Start in production mode" and select your preferred region

### 5. Install Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd src/template-exchange/functions
npm install
```

### 6. Create API Key

Generate an API key for accessing the Template Exchange API:

```bash
cd ..  # Back to template-exchange directory
node scripts/create-api-key.js path/to/your/serviceAccountKey.json
```

This will create an API key in your Firestore database. Make note of this key as you'll need it to authenticate requests to the API.

### 7. Deploy Security Rules and Indexes

Deploy the Firestore security rules and indexes:

```bash
firebase deploy --only firestore
```

### 8. Deploy Cloud Functions

Deploy the Cloud Functions to Firebase:

```bash
firebase deploy --only functions
```

The deployment process will output the URLs for your Cloud Functions, including the primary API endpoint URL.

## Environment Configuration

### Setting Environment Variables

For security and configuration management, you can set environment variables for your Cloud Functions:

```bash
firebase functions:config:set api.key_collection="config" api.key_document="api_keys"
```

To view the current configuration:

```bash
firebase functions:config:get
```

## Testing the Deployment

After deployment, you can test the API using tools like curl or Postman:

```bash
# Get a template by session ID
curl -H "x-api-key: YOUR_API_KEY" https://your-project-id.web.app/api/templates/M1.S1

# Create a template
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"sessionId":"M1.S1","type":"handoff","content":"# Test Content"}' \
  https://your-project-id.web.app/api/templates
```

## Monitoring and Logging

### View Logs

To view logs for your Cloud Functions:

```bash
firebase functions:log
```

### Enable Alerts

In the Firebase Console:

1. Navigate to Functions > [your function]
2. Click on "Monitoring"
3. Set up alerts for errors, high latency, or other metrics

## Updating the Deployment

When you make changes to your code:

1. Make sure you test locally
2. Run `firebase deploy --only functions` to deploy the updates

## Rollback

If you need to rollback to a previous version:

```bash
firebase functions:list
firebase functions:rollback
```

Choose the version you want to rollback to when prompted.

## Troubleshooting

### Common Issues

1. **Deployment Errors**:
   - Check that your Node.js version matches what's specified in package.json
   - Verify that all dependencies are correctly installed

2. **Authentication Issues**:
   - Ensure the API key is correctly stored in Firestore
   - Verify that the security rules are correctly deployed

3. **Function Timeouts**:
   - Consider increasing the function timeout in `index.js` under `runtimeOpts`
   - Optimize database queries that might be taking too long

### Support Resources

If you encounter issues:

1. Check the Firebase Cloud Functions documentation
2. Review the logs in the Firebase Console
3. Check the error messages in the deployment output

## Scaling Considerations

As your usage grows:

1. Consider implementing additional sharding for better performance
2. Monitor your Firestore usage and costs
3. Implement caching strategies for frequently accessed templates
4. Consider upgrading your Firebase plan if you exceed the free tier limits 