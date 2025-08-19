// src/utils/cn.ts
/**
 * Utility function to conditionally join Tailwind CSS class names.
 * This is a common pattern for creating reusable components.
 * * @param classes - A list of strings or undefined values.
 * @returns A single string with all the valid class names joined by a space.
 */
export function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}