WAREFLOW — WAREHOUSE ORDER FULFILLMENT SYSTEM
==============================================

WHAT'S INCLUDED
- Dashboard, Orders, Inventory, Picking, Packing and Dispatch workflows
- CSV export and fulfillment reports
- Firebase Email/Password Authentication
- Cloud Firestore workspace sync for orders, products, suppliers, staff directory and notifications
- Dark-first professional UI with a saved light-theme toggle
- Analytics, order tracking timeline, supplier directory and staff directory
- Code 128 barcode generation and camera barcode scanning
- Low-stock notification center
- Print-friendly barcode and report output
- Local browser demo mode if Firebase is not configured / unavailable

RUN LOCALLY
1. Extract this folder.
2. Open it in VS Code.
3. Run with VS Code Live Server (or another local HTTP server). Do not open index.html as file://.
4. The Firebase web configuration is in firebase.js. Replace it if you use another Firebase project.
5. For camera barcode scanning, use HTTPS or localhost and allow camera permission.

FIREBASE SETUP
1. Open Firebase Console → Authentication → Sign-in method → enable Email/Password.
2. Create a Cloud Firestore database.
3. In Firestore Rules, publish the contents of firestore.rules.
4. Register your first account using the app's Create an account option.
5. In Firestore → users → [your new UID], change role from "staff" to "admin". This bootstrap promotion is intentionally a manual trusted-admin action; the browser cannot grant itself admin privileges.
6. Sign out and sign in again. New accounts default to staff. To authorize another team member, they must register, then an admin can change their users/{uid}.role to "staff" in the Firebase Console.
7. The app creates/updates workspaces/main after an authorized user signs in. Firestore sync is shared by all authorized staff/admin accounts.

SECURITY NOTES
- Firebase web API keys identify the Firebase project; they are not server secrets. Protect data with Authentication and Firestore Rules.
- Never publish permissive Firestore rules such as allow read, write: if true.
- This is a front-end academic/demo implementation. For production, use trusted server-side role administration, audit logs, App Check, stronger validation, and a backend for privileged operations.
- The staff directory is an operational directory; adding a directory entry does not create a Firebase login. Firebase accounts and roles are managed through Authentication and the users collection.
- Camera scanning and CDN libraries require an internet connection. Barcode generation uses JsBarcode; camera scanning uses html5-qrcode.

DEMO MODE
On the sign-in screen, choose “Continue in demo mode” to use browser LocalStorage without Firebase login. Demo data is local to that browser/device and is not cloud-synchronized.

PROJECT FILES
- index.html       Application structure and feature pages
- style.css        Responsive dark/light UI styles
- app.js           Existing order/inventory/picking/packing/dispatch logic
- features.js      Analytics, tracking, suppliers, staff, notifications, barcode tools
- firebase.js      Firebase Authentication and Firestore synchronization
- firestore.rules  Recommended Firestore access rules
