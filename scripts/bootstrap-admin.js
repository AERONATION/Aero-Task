/**
 * AeroTask - Admin Bootstrap Helper
 * 
 * In production or development:
 * Regular user registration strictly sets `systemRole = 'user'`.
 * This script provides guidance or automated promotion of a user to `systemRole = 'admin'`.
 * 
 * Usage:
 * node scripts/bootstrap-admin.js <user-email-or-uid>
 */

console.log(`
=====================================================
AeroTask - Administrator Account Provisioning Guide
=====================================================

To promote a registered user to Administrator:

METHOD 1: Cloud Firestore Console (Instant & Safest)
-----------------------------------------------------
1. Go to https://console.firebase.google.com
2. Select your Firebase project.
3. In the left navigation, click 'Firestore Database'.
4. Open the 'users' collection.
5. Click on the document matching the target user's UID.
6. Edit the 'systemRole' field value:
   Change: "user"
   To:     "admin"
7. Click Save. The user now has full administrative privileges!

METHOD 2: Firebase Admin SDK
----------------------------
If you have a service account key (serviceAccountKey.json):
Set the systemRole to 'admin' using the Firebase Admin Node SDK:
admin.firestore().collection('users').doc(targetUid).update({ systemRole: 'admin' });
`);
