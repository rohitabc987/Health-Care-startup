import * as admin from "firebase-admin";
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function initializeFirebaseAdmin(): { app: App | null; db: Firestore | null } {
  if (getApps().length > 0) {
    const app = getApps()[0]!;
    return { app, db: getFirestore(app) };
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "orderlygathernew-0720960-a5b5e";

  // Option 1: File in src/ or project root
  const rootDir = process.cwd();
  const fileCandidates: string[] = [
    path.join(rootDir, "src", "orderlygathernew-0720960-a5b5e-firebase-adminsdk-fbsvc-5a1a7bc98f.json"),
    path.join(rootDir, "src", "serviceAccountKey.json"),
    path.join(rootDir, "serviceAccountKey.json"),
    process.env.GOOGLE_APPLICATION_CREDENTIALS ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS) : "",
  ].filter(Boolean);

  for (const filePath of fileCandidates) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const serviceAccount = JSON.parse(fileContent);
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
        return { app, db: getFirestore(app) };
      } catch (err) {
        console.warn(`[Firebase Admin] Failed reading credentials from ${filePath}:`, err);
      }
    }
  }

  // Option 2: Full JSON string in FIREBASE_SERVICE_ACCOUNT_KEY env var
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envJson) {
    try {
      const serviceAccount = JSON.parse(envJson);
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      return { app, db: getFirestore(app) };
    } catch (err) {
      console.warn("[Firebase Admin] Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY env var:", err);
    }
  }

  // Option 3: Individual env variables (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      privateKey = privateKey.replace(/\\n/g, "\n");
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return { app, db: getFirestore(app) };
    } catch (err) {
      console.warn("[Firebase Admin] Failed initializing with individual env vars:", err);
    }
  }

  // Option 4: Fallback initialize with Project ID (relies on GCP environment / ADC)
  try {
    const app = initializeApp({ projectId });
    return { app, db: getFirestore(app) };
  } catch (err) {
    console.warn("[Firebase Admin] Fallback initialization notice:", err);
    return { app: null, db: null };
  }
}

try {
  const init = initializeFirebaseAdmin();
  adminApp = init.app;
  adminDb = init.db;
} catch (e) {
  console.warn("[Firebase Admin] Global init error:", e);
}

export { admin, adminApp, adminDb };

