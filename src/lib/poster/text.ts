export interface TextPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  lines: string[];
  drawnHeight: number;
}
/** Wrap on measured Unicode characters, preserving authored paragraph breaks. Never truncate. */
export function wrapText(
  text: string,
  width: number,
  measure: (text: string) => number,
): string[] {
  if (!Number.isFinite(width) || width <= 0)
    throw new Error("海报文字宽度无效。");
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const character of [...paragraph]) {
      if (line && measure(line + character) > width) {
        const characters = [...line];
        const carry =
          /[，。！？；：、）》」』】]/u.test(character) ||
          /[（《「『【]/u.test(characters.at(-1) || "")
            ? characters.pop() || ""
            : "";
        if (characters.length) lines.push(characters.join(""));
        line = carry + character;
      } else line += character;
      if (measure(line) > width) throw new Error("海报文字无法放入当前版式。");
    }
    lines.push(line);
  }
  return lines;
}
