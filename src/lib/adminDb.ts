import {
  init,
  query as adminQuery,
  transact as adminTransact,
  tx as adminTx,
} from "@instantdb/admin";

const APP_ID_KEYS = [
  "NEXT_PUBLIC_INSTANT_APP_ID",
  "INSTANT_APP_ID",
  "PUBLIC_INSTANT_APP_ID",
  "EXPO_PUBLIC_INSTANT_APP_ID",
] as const;

const ADMIN_TOKEN_KEYS = [
  "INSTANT_APP_ADMIN_TOKEN",
  "NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN",
  "ADMIN_TOKEN",
] as const;

type ResolvedEnv = {
  value?: string;
  source: string | null;
};

type AdminCredentials = {
  appId?: string;
  adminToken?: string;
  appIdSource: string | null;
  adminTokenSource: string | null;
};

type AdminDb = {
  query: typeof adminQuery;
  transact: typeof adminTransact;
  tx: typeof adminTx;
};

let adminDb: AdminDb | null = null;

function resolveEnvValue(keys: readonly string[]): ResolvedEnv {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return { value, source: key };
    }
  }
  return { value: undefined, source: null };
}

function maskValue(value?: string) {
  if (!value) {
    return null;
  }
  if (value.length <= 4) {
    return `${value[0]}…`;
  }
  const start = value.slice(0, 4);
  const end = value.slice(-4);
  return `${start}…${end}`;
}

function resolveAdminCredentials(): AdminCredentials {
  const appIdResult = resolveEnvValue(APP_ID_KEYS);
  const adminTokenResult = resolveEnvValue(ADMIN_TOKEN_KEYS);

  return {
    appId: appIdResult.value,
    adminToken: adminTokenResult.value,
    appIdSource: appIdResult.source,
    adminTokenSource: adminTokenResult.source,
  };
}

function createEnvSnapshot(creds: AdminCredentials) {
  return {
    hasAppId: Boolean(creds.appId),
    hasAdminToken: Boolean(creds.adminToken),
    appIdSource: creds.appIdSource,
    adminTokenSource: creds.adminTokenSource,
    appIdPreview: maskValue(creds.appId),
    adminTokenPreview: maskValue(creds.adminToken),
  };
}

export function getAdminEnvSnapshot() {
  return createEnvSnapshot(resolveAdminCredentials());
}

export function getAdminDb() {
  const creds = resolveAdminCredentials();
  const snapshot = createEnvSnapshot(creds);
  const { appId, adminToken } = creds;

  if (!appId || !adminToken) {
    console.error("Instant admin client misconfigured", snapshot);
    return null;
  }

  if (!adminDb) {
    init({ appId, adminToken });
    adminDb = {
      query: adminQuery,
      transact: adminTransact,
      tx: adminTx,
    };
    console.info("Instant admin client initialized", snapshot);
  }

  return adminDb;
}
