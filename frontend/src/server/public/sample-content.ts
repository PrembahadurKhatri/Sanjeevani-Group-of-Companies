export function canUseBundledSamples(databaseConfigured: boolean, environment = process.env.NODE_ENV): boolean {
  return !databaseConfigured && environment !== "production";
}
