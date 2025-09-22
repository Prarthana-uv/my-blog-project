// Environment configuration utility
let envLoaded = false;

export function loadEnv() {
  if (!envLoaded && typeof process !== 'undefined') {
    try {
      // Try to load dotenv only in development
      if (process.env.NODE_ENV !== 'production') {
        import('dotenv').then(dotenv => {
          dotenv.config();
        }).catch(() => {
          // Fail silently in production
        });
      }
      envLoaded = true;
    } catch (error) {
      // Fail silently - environment variables might be set by the platform
    }
  }
}

export function getEnvVar(name, defaultValue = null) {
  loadEnv();
  return process.env[name] || defaultValue;
}

export function requireEnvVar(name) {
  const value = getEnvVar(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}