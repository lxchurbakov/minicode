/**
 * File manipulation tools for the minicode agent runtime.
 *
 * Provides a comprehensive set of tools for reading, writing, editing,
 * searching, and managing files and directories. All tools handle
 * errors gracefully and return user-friendly messages.
 *
 * Exports:
 *   - default (function): Returns an object with {name, tools, description}
 *     where `tools` is an array of tool objects created via `create_tool`.
 *
 * Tools provided:
 *   - write_file(path, content): Write content to a file, creating
 *     directories as needed. Overwrites entire file. Returns OK message
 *     with resolved path and line count.
 *
 *   - read_file(path, offset?, limit?): Read file contents with optional
 *     line range. Returns lines prefixed with line numbers and a header
 *     showing the range. offset is 1-based, default 1. limit default all.
 *
 *   - edit_file(path, edits, dryRun?): Apply edits to a file. Supports
 *     replace, delete, insert, append operations. Edits are applied in
 *     reverse line order to preserve line numbers. dryRun shows result
 *     without writing.
 *
 *   - list_dir(path, recursive?, maxDepth?, ignore?): List directory
 *     contents with [D]/[F]/[L] prefixes and file sizes. Default ignores
 *     node_modules and .git. maxDepth defaults to 3.
 *
 *   - batch_files(operations): Perform batch file operations (read, write,
 *     copy, move, delete). Returns results for all operations and appends
 *     content from reads.
 *
 *   - search_files(pattern, path, recursive?, filePattern?, maxResults?,
 *       context?, ignore?): Search file contents with optional context
 *       lines around matches. Supports regex patterns and glob filePattern.
 *
 *   - file_info(path): Get detailed info about a file or directory —
 *     type, size, timestamps, and line count for small files.
 *
 * Notes:
 *   - Helper functions readFileLines and applyEdits are internal utilities.
 *   - All tools catch errors and return error strings (no throwing).
 *   - write_file and edit_file create parent directories automatically.
 *   - search_files skips binary/unreadable files silently.
 */

export * from "../../.slop/files.js";
export { default } from "../../.slop/files.js";