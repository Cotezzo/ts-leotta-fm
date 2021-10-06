export const capitalizeFirstLetter = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1)

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}