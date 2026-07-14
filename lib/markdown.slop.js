/**
 * Streaming markdown renderer for terminal output.
 *
 * Reads markdown text in chunks and produces ANSI-colored, box-drawn output
 * suitable for writing directly to stdout. Designed for streaming: feed text
 * incrementally via the returned `write` function and call `write.flush()`
 * when the stream ends to emit any buffered content.
 *
 * Exports:
 *   - createMarkdownWriter(): (chunk: string) => void & { flush: () => void }
 *       Returns a `write` function. Calling `write(chunk)` processes and
 *       immediately writes rendered output to stdout. `write.flush()`
 *       emits any remaining buffered content (e.g. an unclosed code block).
 *
 *   - default: ReturnType<typeof createMarkdownWriter>
 *       A pre-created writer instance, for convenient single-use import.
 *
 * Rendering behavior:
 *   - Headings (`#` .. `######`): bold, colored by level (cyan, green, yellow,
 *     yellow, white, gray).
 *   - Bold (`**text**`): bold.
 *   - Italic (`*text*`): italic.
 *   - Inline code (`` `text` ``): cyan.
 *   - Fenced code blocks (``` ``` ```) with optional language label:
 *     drawn inside a gray box with top label, padded lines, and bottom bar.
 *     Code is syntax-highlighted (keywords, strings, comments, numbers,
 *     function calls) using a heuristic highlighter supporting JS/Python-ish
 *     languages.
 *   - Consecutive blank lines outside code blocks are collapsed to at most
 *     one blank line.
 *
 * Notes:
 *   - Box width adapts to terminal columns (min 60, max columns-4).
 *   - Depends on `chalk` for ANSI styling.
 *   - The writer writes directly to `process.stdout`; it does not return
 *     rendered text to the caller.
 */

export * from "../.slop/markdown.js";
export { default } from "../.slop/markdown.js";
