type EnvOption = {
  requiredInProduction?: boolean;
  defaultValue?: string;
  developmentFallback?: string;
  warnInDevelopment?: boolean;
};

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProduction = NODE_ENV === "production";
const isProductionBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build";
const shouldEnforceRequired = isProduction && !isProductionBuildPhase;
const missingInProduction = new Set<string>();
const warnedInDevelopment = new Set<string>();

function readEnv(name: string, option: EnvOption = {}): string {
  const rawValue = process.env[name]?.trim();
  const value = rawValue && rawValue.length > 0 ? rawValue : undefined;

  if (value) {
    return value;
  }

  if (shouldEnforceRequired && option.requiredInProduction) {
    missingInProduction.add(name);
  }

  const fallback = option.defaultValue ?? option.developmentFallback;

  if (!isProduction && (option.warnInDevelopment ?? true)) {
    const key = `${name}:${fallback ?? ""}`;
    if (!warnedInDevelopment.has(key)) {
      warnedInDevelopment.add(key);
      const fallbackMessage =
        fallback != null ? ` Using fallback value for local development.` : "";
      console.warn(
        `[env] Missing ${name}.${fallbackMessage} Set it in your local .env file for parity with production.`,
      );
    }
  }

  return fallback ?? "";
}

export const env = {
  NODE_ENV,
  isProduction,
  DATABASE_URL: readEnv("DATABASE_URL", {
    requiredInProduction: true,
    developmentFallback:
      "postgresql://postgres:postgres@localhost:5432/ai_rd_platform",
  }),
  NEXTAUTH_SECRET: readEnv("NEXTAUTH_SECRET", {
    requiredInProduction: true,
    developmentFallback: "dev-only-auth-secret-change-me",
  }),
  NEXTAUTH_URL: readEnv("NEXTAUTH_URL", {
    requiredInProduction: true,
    warnInDevelopment: true,
  }),
  ADMIN_EMAIL: readEnv("ADMIN_EMAIL", {
    warnInDevelopment: false,
  }),
  ADMIN_EMAILS: readEnv("ADMIN_EMAILS", {
    warnInDevelopment: false,
  }),
  ALLOW_DEV_NO_LOGIN: readEnv("ALLOW_DEV_NO_LOGIN", {
    defaultValue: "true",
    warnInDevelopment: false,
  }),
  DEMO_MODE: readEnv("DEMO_MODE", {
    defaultValue: "false",
    warnInDevelopment: false,
  }),
};

if (shouldEnforceRequired && missingInProduction.size > 0) {
  const missing = [...missingInProduction].sort();
  throw new Error(
    `[env] Missing required environment variables: ${missing.join(", ")}.
Set them in Vercel → Project Settings → Environment Variables, then redeploy.`,
  );
}
