// src/lib/utils.ts

// Hapus baris ini:
// import { type ClassValue, clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// Hapus atau komen kode ini:
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// Gunakan hanya fungsi ini:
export function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}