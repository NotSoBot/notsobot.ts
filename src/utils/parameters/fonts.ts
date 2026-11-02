// a saved font's name the way the api stores it (`normalize_saved_font_name`), lowercase with spaces and dashes as _
export function normalizeSavedFontName(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

// what a saved font's name can be (the api's `SAVED_FONT_NAME`)
export const SAVED_FONT_NAME = /^[a-z0-9_]{1,32}$/;
