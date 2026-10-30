/**
 * Tokenizer minimal, suffisant pour le terminal simulé : espaces, quotes simples et
 * doubles, échappement par backslash. Pas d'expansion de variables.
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let started = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === undefined) break;

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === '\\' && quote === '"') {
        const next = input[index + 1];
        if (next !== undefined) {
          current += next;
          index += 1;
        }
      } else {
        current += char;
      }
      started = true;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }

    if (char === '\\') {
      const next = input[index + 1];
      if (next !== undefined) {
        current += next;
        index += 1;
        started = true;
      }
      continue;
    }

    if (/\s/.test(char)) {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }

    current += char;
    started = true;
  }

  if (started) tokens.push(current);
  return tokens;
}
