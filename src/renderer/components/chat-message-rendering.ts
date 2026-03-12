const CODE_BLOCK_SEGMENT_REGEX = /(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g;
const DISPLAY_LINE_BREAK_REGEX = /(?:\n|<br\s*\/?>)/gi;
const DUPLICATE_BREAK_NEWLINE_REGEX = /<br\s*\/?>\n/gi;

export const splitMessageContentSegments = (content: string): string[] =>
  content.split(CODE_BLOCK_SEGMENT_REGEX).filter(Boolean);

export const splitMessageDisplayLines = (content: string): string[] =>
  content.replace(DUPLICATE_BREAK_NEWLINE_REGEX, "<br>").split(DISPLAY_LINE_BREAK_REGEX);
