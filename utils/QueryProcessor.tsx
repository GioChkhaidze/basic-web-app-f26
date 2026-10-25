const ARITHMETIC_OPERATORS = "plus|minus|multiplied by|times|divided by|to the power of";

const SCRABBLE_SCORES: Record<string, number> = {
  a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1,
  d: 2, g: 2,
  b: 3, c: 3, m: 3, p: 3,
  f: 4, h: 4, v: 4, w: 4, y: 4,
  k: 5,
  j: 8, x: 8,
  q: 10, z: 10,
};

const GENERAL_KNOWLEDGE: [string, string][] = [
  ["eiffel tower", "Paris"],
  ["colour is a banana", "yellow"],
  ["color is a banana", "yellow"],
  ["james bond in the film dr no", "Sean Connery"],
  ["currency did spain use before the euro", "peseta"],
];

// Exponents first (right-associative), then multiplication/division, then addition/subtraction.
function evaluate<T>(values: T[], operators: string[], apply: (operator: string, a: T, b: T) => T): T {
  for (let i = operators.length - 1; i >= 0; i--) {
    if (operators[i] === "to the power of") {
      values.splice(i, 2, apply(operators[i], values[i], values[i + 1]));
      operators.splice(i, 1);
    }
  }
  for (const level of [["multiplied by", "times", "divided by"], ["plus", "minus"]]) {
    let i = 0;
    while (i < operators.length) {
      if (level.includes(operators[i])) {
        values.splice(i, 2, apply(operators[i], values[i], values[i + 1]));
        operators.splice(i, 1);
      } else {
        i++;
      }
    }
  }
  return values[0];
}

// BigInt keeps large results (e.g. 97 to the power of 13) exact.
function applyBigInt(operator: string, a: bigint, b: bigint): bigint {
  if (operator === "plus") return a + b;
  if (operator === "minus") return a - b;
  if (operator === "to the power of") {
    let result = BigInt(1);
    for (let i = BigInt(0); i < b; i++) result *= a;
    return result;
  }
  return a * b;
}

function applyNumber(operator: string, a: number, b: number): number {
  if (operator === "plus") return a + b;
  if (operator === "minus") return a - b;
  if (operator === "divided by") return a / b;
  if (operator === "to the power of") return Math.pow(a, b);
  return a * b;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function isSquare(n: number): boolean {
  const root = Math.round(Math.sqrt(n));
  return root * root === n;
}

function isCube(n: number): boolean {
  const root = Math.round(Math.cbrt(n));
  return root * root * root === n;
}

function fibonacci(n: number): bigint {
  let a = BigInt(0);
  let b = BigInt(1);
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

function sortLetters(word: string): string {
  return word.toLowerCase().split("").sort().join("");
}

export default function QueryProcessor(query: string): string {
  const arithmeticMatch = query.match(
    new RegExp(`what is (-?\\d+(?:\\s+(?:${ARITHMETIC_OPERATORS})\\s+-?\\d+)+)`, "i")
  );
  if (arithmeticMatch) {
    const parts = arithmeticMatch[1].toLowerCase().split(new RegExp(`\\s+(${ARITHMETIC_OPERATORS})\\s+`));
    const operands = parts.filter((_, i) => i % 2 === 0);
    const operators = parts.filter((_, i) => i % 2 === 1);
    if (operators.includes("divided by")) {
      return evaluate(operands.map(Number), operators, applyNumber).toString();
    }
    return evaluate(operands.map((n) => BigInt(n)), operators, applyBigInt).toString();
  }

  const listMatch = query.match(/which of the following numbers (?:is|are) (.+?):\s*([-\d,\s]+)/i);
  if (listMatch) {
    const property = listMatch[1].toLowerCase();
    const numbers = listMatch[2].split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
    if (property.includes("largest")) return Math.max(...numbers).toString();
    if (property.includes("smallest")) return Math.min(...numbers).toString();

    let matches: number[] = [];
    if (property.includes("square") && property.includes("cube")) {
      matches = numbers.filter((n) => isSquare(n) && isCube(n));
    } else if (property.includes("square")) {
      matches = numbers.filter(isSquare);
    } else if (property.includes("cube")) {
      matches = numbers.filter(isCube);
    } else if (property.includes("prime")) {
      matches = numbers.filter(isPrime);
    } else if (property.includes("even")) {
      matches = numbers.filter((n) => n % 2 === 0);
    } else if (property.includes("odd")) {
      matches = numbers.filter((n) => n % 2 !== 0);
    }
    return matches.join(", ");
  }

  const fibonacciMatch = query.match(/what is the (\d+)(?:st|nd|rd|th) number in the fibonacci sequence/i);
  if (fibonacciMatch) {
    return fibonacci(parseInt(fibonacciMatch[1])).toString();
  }

  const anagramMatch = query.match(/anagram of ["“”']?([a-z]+)["“”']?:\s*(.+)/i);
  if (anagramMatch) {
    const word = anagramMatch[1].toLowerCase();
    const candidates = anagramMatch[2].replace(/\?\s*$/, "").split(",").map((w) => w.trim());
    return candidates
      .filter((w) => w.toLowerCase() !== word && sortLetters(w) === sortLetters(word))
      .join(", ");
  }

  const scrabbleMatch = query.match(/scrabble score of ([a-z]+)/i);
  if (scrabbleMatch) {
    const letters = scrabbleMatch[1].toLowerCase().split("");
    return letters.reduce((score, letter) => score + (SCRABBLE_SCORES[letter] || 0), 0).toString();
  }

  for (const [question, answer] of GENERAL_KNOWLEDGE) {
    if (query.toLowerCase().includes(question)) {
      return answer;
    }
  }

  // Loose keyword checks go last so they don't swallow the questions above
  // (e.g. "age" inside "average", or "name" in an anagram's word list).
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

  return "";
}
