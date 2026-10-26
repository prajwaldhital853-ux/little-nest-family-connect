import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge( {
  extend: { classGroups: { "font-size": [ { text: [ "h1", "h2", "h3", "h4", "large", "small", "meta" ] } ] } }
} );

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
