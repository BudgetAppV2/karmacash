/**
 * Utility function to conditionally join class names together
 * This is useful for conditionally applying Tailwind classes
 * 
 * @param {...string} classes - Class names to be joined
 * @returns {string} - Joined class names
 */
export default function cn(...classes) {
  return classes.filter(Boolean).join(' ');
} 