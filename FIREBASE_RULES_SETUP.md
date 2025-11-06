# Firebase Realtime Database Rules Setup

## Issue
The application is getting a permission denied error when trying to access Firebase data:
```
Firebase: Connection error: Error: permission_denied at /cache_metadata: Client doesn't have permission to access the desired data.
```

## Required Firebase Database Rules

To fix this issue, you need to update your Firebase Realtime Database rules in the Firebase Console. 

### Steps to Fix:

1. **Open Firebase Console**: https://console.firebase.google.com/project/poly-3b4c5/database/poly-3b4c5-default-rtdb/rules

2. **Replace the current rules with these rules:**

```json
{
  "rules": {
    // Allow read access to markets data for all clients
    "markets": {
      ".read": true,
      ".write": "auth != null",  // Allow authenticated writes (Firebase Admin SDK)
      ".indexOn": ["polymarket_id", "end_date"]
    },
    
    // Allow read access to cache metadata for all clients
    "cache_metadata": {
      ".read": true,
      ".write": "auth != null"  // Allow authenticated writes (Firebase Admin SDK)
    },
    
    // Allow read access to agent predictions for all clients
    "agent_predictions": {
      ".read": true,
      ".write": "auth != null",  // Allow authenticated writes (Firebase Admin SDK)
      ".indexOn": ["market_id", "agent_id", "created_at"]
    },
    
    // Allow read access to predictions metadata
    "predictions_metadata": {
      ".read": true,
      ".write": "auth != null"  // Allow authenticated writes (Firebase Admin SDK)
    },
    
    // Allow read access to agent balances
    "agent_balances": {
      ".read": true,
      ".write": "auth != null",  // Allow authenticated writes (Firebase Admin SDK)
      ".indexOn": ["agent_id"]
    },
    
    // Allow read access to market odds
    "market_odds": {
      ".read": true,
      ".write": "auth != null"  // Allow authenticated writes (Firebase Admin SDK)
    },
    
    // Deny all other paths by default
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

3. **Click "Publish" to save the rules**

## Why These Rules Are Needed

- The client-side components need to read Firebase data in real-time
- All writes are handled by server-side admin APIs using Firebase Admin SDK
- This provides a secure setup where clients can read but only the server can write
- The rules allow access to the specific paths our application uses
- **IMPORTANT**: The `.indexOn` fields are critical for performance - they prevent the "unspecified index" warnings

## Current Issue: Firebase Performance Warnings

When you click "Trigger AI" you're seeing repeated warnings like:
```
FIREBASE WARNING: Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ".indexOn": "market_id" at /agent_predictions to your security rules for better performance.
```

**This happens because:**
1. Multiple components query Firebase with `orderByChild('market_id')`
2. Firebase has to download ALL predictions and filter client-side (inefficient)
3. The warnings repeat because multiple queries happen simultaneously during AI analysis

**The solution:** Add the indexes shown in the rules above.

## CRITICAL FIX for Predictions Not Saving

⚠️ **IMPORTANT**: The rules have been updated to allow Firebase Admin SDK writes:

- Changed from `.write: false` to `.write: "auth != null"`
- This allows the server-side Firebase Admin SDK to write data
- Clients still cannot write directly (they're not authenticated)
- Only the server with Admin SDK credentials can write

**If predictions aren't saving, this is likely the cause!**

## Alternative Quick Fix (Development Only)

For development/testing, you can temporarily use these permissive rules:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

**⚠️ WARNING: Do not use permissive rules in production!**

## Current Application Behavior

With the updated code changes, the application now handles permission errors gracefully:
- If metadata access is denied, the app continues without metadata
- Real-time predictions feed will still work if agent_predictions is readable
- The app shows appropriate error messages instead of crashing

## Testing the Fix

After updating the Firebase rules:
1. Refresh the application
2. Check the browser console - permission errors should be gone
3. Verify real-time updates are working in the dashboard
4. Test the live predictions feed