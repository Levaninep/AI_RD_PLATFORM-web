export function isDemoModeEnabled(): boolean {
  const value =
    process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE ?? "false";
  return value.trim().toLowerCase() === "true";
}
