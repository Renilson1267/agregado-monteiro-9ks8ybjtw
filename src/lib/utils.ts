/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza uma string removendo acentos, convertendo para minúsculas e eliminando espaços duplicados
 */
export function normalizarTexto(txt: string | null | undefined): string {
  if (!txt) return ""
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}
