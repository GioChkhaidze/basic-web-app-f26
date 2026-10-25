export default function QueryProcessor(query: string): string {
  if (query.toLowerCase().includes("shakespeare")) {
    return (
      "William Shakespeare (26 April 1564 - 23 April 1616) was an " +
      "English poet, playwright, and actor, widely regarded as the greatest " +
      "writer in the English language and the world's pre-eminent dramatist."
    );
  }

  if (query.toLowerCase().includes("name")) {
    return "gchkhaid";
  }

  if (query.toLowerCase().includes("age")) {
    return "67";
  }

  if (query.toLowerCase().includes("andrew id")) {
    return "gchkhaid";
  }

  const plusMatch = query.match(/what is (-?\d+) plus (-?\d+)/i);
  if (plusMatch) {
    return (parseInt(plusMatch[1]) + parseInt(plusMatch[2])).toString();
  }

  const largestMatch = query.match(/which of the following numbers is the largest:\s*([-\d,\s]+)/i);
  if (largestMatch) {
    const numbers = largestMatch[1].split(",").map((n) => parseInt(n.trim()));
    return Math.max(...numbers).toString();
  }

  return "";
}
