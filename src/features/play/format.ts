export function explainAward(
  text: string,
  names: Record<string, string>,
): string {
  let result = text;
  for (const [id, name] of Object.entries(names).sort(
    (a, b) => b[0].length - a[0].length,
  ))
    result = result.replaceAll(id, name);
  return result;
}
