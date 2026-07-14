import fs from 'fs/promises';
import path from 'path';

import { create_tool } from '../../lib/tools.js';

// Helper: read file with optional line range
async function readFileLines(filePath, offset = 1, limit = null) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    const startIdx = Math.max(0, offset - 1);
    const endIdx = limit ? Math.min(startIdx + limit, totalLines) : totalLines;
    
    const selectedLines = lines.slice(startIdx, endIdx);
    const result = selectedLines.map((line, i) => `${startIdx + i + 1}:${line}`).join('\n');
    
    const meta = `[Lines ${startIdx + 1}-${endIdx} of ${totalLines}]`;
    return `${meta}\n${result}`;
}

// Helper: apply edits to file content
function applyEdits(content, edits) {
    let lines = content.split('\n');
    
    // Sort edits by line number descending to avoid index shifting issues
    const sortedEdits = [...edits].sort((a, b) => (b.line || 0) - (a.line || 0));
    
    for (const edit of sortedEdits) {
        const { type, line, count, text } = edit;
        const idx = line - 1;
        
        switch (type) {
            case 'replace':
                lines.splice(idx, count || 1, ...(text || '').split('\n'));
                break;
            case 'delete':
                lines.splice(idx, count || 1);
                break;
            case 'insert':
                lines.splice(idx, 0, ...(text || '').split('\n'));
                break;
            case 'append':
                lines.push(...(text || '').split('\n'));
                break;
        }
    }
    
    return lines.join('\n');
}

export default () => {
    const tools = [];

    tools.push(create_tool(
        'write_file',
        'Write content to file (creates directories if needed). Overwrites entire file.',
        {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
        },
        async ({ path: filePath, content }) => {
            try {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content);
                const lines = content.split('\n').length;
                return `OK wrote ${path.resolve(filePath)} (${lines} lines written)`;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'read_file',
        `Read file contents with optional line range.

Returns lines prefixed with line numbers for easy reference.
Examples:
- Read entire file: read_file({path: "src/index.js"})
- Read lines 10-30: read_file({path: "src/index.js", offset: 10, limit: 20})
- Read from line 50 to end: read_file({path: "src/index.js", offset: 50})`,
        {
            path: { type: 'string', description: 'File path to read' },
            offset: { type: 'number', description: 'Starting line number (1-based, default: 1)' },
            limit: { type: 'number', description: 'Maximum number of lines to read (default: all)' },
        },
        async ({ path: filePath, offset = 1, limit = null }) => {
            try {
                return await readFileLines(filePath, offset, limit);
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'edit_file',
        `Apply edits to a file. Edits are applied in reverse line order to preserve line numbers.

Edit types:
- replace: Replace lines starting at 'line' (count lines) with 'text'
- delete: Delete 'count' lines starting at 'line'
- insert: Insert 'text' before 'line'
- append: Append 'text' to end of file

Example: edit_file({path: "file.js", edits: [
  {type: "replace", line: 5, count: 2, text: "new line 1\\nnew line 2"},
  {type: "delete", line: 10, count: 3},
  {type: "insert", line: 1, text: "// Header comment"}
]})`,
        {
            path: { type: 'string', description: 'File path to edit' },
            edits: {
                type: 'array',
                description: 'List of edits to apply',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['replace', 'delete', 'insert', 'append'] },
                        line: { type: 'number', description: 'Line number (1-based)' },
                        count: { type: 'number', description: 'Number of lines to replace/delete' },
                        text: { type: 'string', description: 'Text to insert/replace with' },
                    },
                },
            },
            dryRun: { type: 'boolean', description: 'If true, show resulting file content without writing (default: false)' },
        },
        async ({ path: filePath, edits, dryRun = false }) => {
            try {
                let content = '';
                try {
                    content = await fs.readFile(filePath, 'utf8');
                } catch (e) {
                    if (e.code !== 'ENOENT') throw e;
                    // File doesn't exist, start with empty content
                }
                const newContent = applyEdits(content, edits);
                if (!dryRun) {
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, newContent);
                    const lines = newContent.split('\n').length;
                    return `OK (${edits.length} edits applied, ${lines} lines total)`;
                } else {
                    return `DRY RUN result:\n\n${newContent}`;
                }
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'list_dir',
        `List directory contents with file types and sizes.

Returns entries with [D] for directories, [F] for files with size, [L] for symlinks.
Use recursive option to list subdirectories.`,
        {
            path: { type: 'string', description: 'Directory path to list' },
            recursive: { type: 'boolean', description: 'List subdirectories recursively (default: false)' },
            maxDepth: { type: 'number', description: 'Max depth for recursive listing (default: 3)' },
            ignore: { type: 'array', description: 'Patterns to ignore (default: ["node_modules", ".git"])', items: { type: 'string' } },
        },
        async ({ path: dirPath, recursive = false, maxDepth = 3, ignore = ['node_modules', '.git'] }) => {
            try {
                const results = [];
                const ignoreSet = new Set(ignore);
                
                async function listDir(dir, depth = 0) {
                    const indent = '  '.repeat(depth);
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    
                    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
                        if (ignoreSet.has(entry.name)) continue;
                        
                        const fullPath = path.join(dir, entry.name);
                        
                        if (entry.isSymbolicLink()) {
                            const target = await fs.readlink(fullPath).catch(() => '?');
                            results.push(`${indent}[L] ${entry.name} -> ${target}`);
                        } else if (entry.isDirectory()) {
                            results.push(`${indent}[D] ${entry.name}/`);
                            if (recursive && depth < maxDepth) {
                                await listDir(fullPath, depth + 1);
                            }
                        } else {
                            const stat = await fs.stat(fullPath);
                            const size = formatSize(stat.size);
                            results.push(`${indent}[F] ${entry.name} (${size})`);
                        }
                    }
                }
                
                function formatSize(bytes) {
                    if (bytes < 1024) return `${bytes}B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
                }
                
                await listDir(dirPath);
                return results.length ? results.join('\n') : '(empty directory)';
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'batch_files',
        `Perform batch file operations.

Operations:
- read: Read file content
- write: Write content to file
- copy: Copy file from src to dest
- move: Move/rename file from src to dest
- delete: Delete file

Example: batch_files({operations: [
  {op: "read", path: "file1.js"},
  {op: "read", path: "file2.js", offset: 10, limit: 20},
  {op: "write", path: "file2.js", content: "..."},
  {op: "copy", src: "a.js", dest: "b.js"},
  {op: "delete", path: "old.js"}
]})`,
        {
            operations: {
                type: 'array',
                description: 'List of file operations',
                items: {
                    type: 'object',
                    properties: {
                        op: { type: 'string', enum: ['read', 'write', 'copy', 'move', 'delete'] },
                        path: { type: 'string', description: 'File path (for read, write, delete)' },
                        src: { type: 'string', description: 'Source path (for copy, move)' },
                        dest: { type: 'string', description: 'Destination path (for copy, move)' },
                        content: { type: 'string', description: 'Content to write (for write)' },
                        offset: { type: 'number', description: 'Starting line number for read (1-based, default: 1)' },
                        limit: { type: 'number', description: 'Max lines to read (default: all)' },
                    },
                },
            },
        },
        async ({ operations }) => {
            const results = [];
            const fileContents = {};
            
            for (let i = 0; i < operations.length; i++) {
                const { op, path: filePath, src, dest, content, offset, limit } = operations[i];
                try {
                    switch (op) {
                        case 'read':
                            const data = await readFileLines(filePath, offset || 1, limit || null);
                            fileContents[filePath] = data;
                            results.push(`[${i + 1}] read ${filePath}: OK`);
                            break;
                        case 'write':
                            await fs.mkdir(path.dirname(filePath), { recursive: true });
                            await fs.writeFile(filePath, content);
                            results.push(`[${i + 1}] write ${filePath}: OK`);
                            break;
                        case 'copy':
                            await fs.mkdir(path.dirname(dest), { recursive: true });
                            await fs.copyFile(src, dest);
                            results.push(`[${i + 1}] copy ${src} -> ${dest}: OK`);
                            break;
                        case 'move':
                            await fs.mkdir(path.dirname(dest), { recursive: true });
                            await fs.rename(src, dest);
                            results.push(`[${i + 1}] move ${src} -> ${dest}: OK`);
                            break;
                        case 'delete':
                            await fs.unlink(filePath);
                            results.push(`[${i + 1}] delete ${filePath}: OK`);
                            break;
                        default:
                            results.push(`[${i + 1}] Unknown operation: ${op}`);
                    }
                } catch (e) {
                    results.push(`[${i + 1}] ${op} ${filePath || src}: Error - ${e.message}`);
                }
            }
            
            let output = results.join('\n');
            
            // Append file contents for read operations
            for (const [filePath, content] of Object.entries(fileContents)) {
                output += `\n\n--- ${filePath} ---\n${content}`;
            }
            
            return output;
        },
    ));

    tools.push(create_tool(
        'search_files',
        `Search for text/pattern in files.

Searches file contents and returns matching lines with optional context.`,
        {
            pattern: { type: 'string', description: 'Search pattern (regex supported)' },
            path: { type: 'string', description: 'File or directory to search' },
            recursive: { type: 'boolean', description: 'Search subdirectories (default: true)' },
            filePattern: { type: 'string', description: 'File name pattern to match, e.g., "*.js" (default: all files)' },
            maxResults: { type: 'number', description: 'Maximum results to return (default: 50)' },
            context: { type: 'number', description: 'Number of context lines before and after match (default: 0)' },
            ignore: { type: 'array', description: 'Directory names to skip (default: ["node_modules", ".git"])', items: { type: 'string' } },
        },
        async ({ pattern, path: searchPath, recursive = true, filePattern, maxResults = 50, context = 0, ignore = ['node_modules', '.git'] }) => {
            try {
                const ignoreSet = new Set(ignore);
                const results = [];
                
                async function searchFile(filePath) {
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const lines = content.split('\n');
                        
                        lines.forEach((line, idx) => {
                            const regex = new RegExp(pattern, 'gi');
                            const matches = regex.test(line);
                            if (matches && results.length < maxResults) {
                                if (context > 0) {
                                    const start = Math.max(0, idx - context);
                                    const end = Math.min(lines.length, idx + context + 1);
                                    const snippet = lines.slice(start, end).map((l, i) => {
                                        const lineNum = start + i + 1;
                                        const marker = (start + i === idx) ? '>' : ' ';
                                        return `${marker} ${lineNum}: ${l}`;
                                    }).join('\n');
                                    results.push(`${filePath}:\n${snippet}`);
                                } else {
                                    results.push(`${filePath}:${idx + 1}: ${line.trim()}`);
                                }
                            }
                        });
                    } catch (e) {
                        // Skip files that can't be read (binary, permission, etc.)
                    }
                }
                
                async function searchDir(dir) {
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    
                    for (const entry of entries) {
                        if (results.length >= maxResults) break;
                        if (ignoreSet.has(entry.name)) continue;
                        
                        const fullPath = path.join(dir, entry.name);
                        
                        if (entry.isDirectory() && recursive) {
                            await searchDir(fullPath);
                        } else if (entry.isFile()) {
                            if (!filePattern || matchGlob(entry.name, filePattern)) {
                                await searchFile(fullPath);
                            }
                        }
                    }
                }
                
                function matchGlob(name, pattern) {
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
                    return regex.test(name);
                }
                
                const stat = await fs.stat(searchPath);
                if (stat.isDirectory()) {
                    await searchDir(searchPath);
                } else {
                    await searchFile(searchPath);
                }
                
                if (results.length === 0) return 'No matches found';
                const suffix = results.length >= maxResults ? `\n... (limited to ${maxResults} results)` : '';
                const separator = context > 0 ? '\n\n' : '\n';
                return `Found ${results.length} matches:${separator}${results.join(separator)}${suffix}`;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'file_info',
        'Get detailed information about a file or directory.',
        {
            path: { type: 'string', description: 'File or directory path' },
        },
        async ({ path: filePath }) => {
            try {
                const stat = await fs.stat(filePath);
                const info = {
                    path: path.resolve(filePath),
                    type: stat.isDirectory() ? 'directory' : 'file',
                    size: stat.size,
                    created: stat.birthtime.toISOString(),
                    modified: stat.mtime.toISOString(),
                    accessed: stat.atime.toISOString(),
                };
                
                if (stat.isFile()) {
                    const content = await fs.readFile(filePath, 'utf8').catch(() => null);
                    if (content) {
                        info.lines = content.split('\n').length;
                        info.encoding = 'utf8';
                    } else {
                        info.encoding = 'binary';
                    }
                }
                
                return Object.entries(info)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n');
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    return { name: 'files', tools, description: 'Tools to work with files (edit, write, read) and folders.' };
};
