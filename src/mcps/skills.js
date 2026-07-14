import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { create_tool } from '../../lib/tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, '../../skills');

// Ensure skills directory exists
async function ensureSkillsDir() {
    await fs.mkdir(SKILLS_DIR, { recursive: true });
}

// Resolve skill file path (name -> .md file)
function skillPath(name) {
    // Sanitize name: only allow alphanumeric, dashes, underscores
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(SKILLS_DIR, `${safe}.md`);
}

export default () => {
    const tools = [];

    tools.push(create_tool(
        'list_skills',
        `List all available skills with their name, line count, and a first-line preview.

Returns a table of skills. Use get_skill to read the full content of any skill.`,
        {},
        async () => {
            try {
                await ensureSkillsDir();
                const entries = await fs.readdir(SKILLS_DIR);
                const mdFiles = entries.filter(f => f.endsWith('.md')).sort();

                if (mdFiles.length === 0) return 'No skills found.';

                const rows = await Promise.all(mdFiles.map(async (file) => {
                    const name = file.replace(/\.md$/, '');
                    const content = await fs.readFile(path.join(SKILLS_DIR, file), 'utf8');
                    const lines = content.split('\n');
                    const lineCount = lines.length;
                    const preview = lines[0]?.trim().slice(0, 80) || '(empty)';
                    return { name, lineCount, preview };
                }));

                const nameW = Math.max(4, ...rows.map(r => r.name.length));
                const linesW = 5;
                const header = `${'Name'.padEnd(nameW)}  ${'Lines'.padEnd(linesW)}  Preview`;
                const divider = `${'-'.repeat(nameW)}  ${'-'.repeat(linesW)}  ${'-'.repeat(40)}`;
                const body = rows.map(r =>
                    `${r.name.padEnd(nameW)}  ${String(r.lineCount).padEnd(linesW)}  ${r.preview}`
                ).join('\n');

                return `${header}\n${divider}\n${body}`;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'get_skill',
        `Read the full content of a named skill.

Returns the raw markdown content of the skill.`,
        {
            name: { type: 'string', description: 'Skill name (without .md extension)' },
        },
        async ({ name }) => {
            try {
                await ensureSkillsDir();
                const filePath = skillPath(name);
                const content = await fs.readFile(filePath, 'utf8');
                return content;
            } catch (e) {
                if (e.code === 'ENOENT') return `Skill "${name}" not found. Use list_skills to see available skills.`;
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'add_skill',
        `Add or update a skill (upsert). If the skill already exists it will be overwritten.

Skills are stored as markdown files. Use clear, instructional markdown — headers, bullet lists, examples.
The name should be short and descriptive (e.g. "tests", "git-commits", "api-design").`,
        {
            name: { type: 'string', description: 'Skill name (without .md extension, alphanumeric/dashes/underscores)' },
            content: { type: 'string', description: 'Full markdown content of the skill' },
        },
        async ({ name, content }) => {
            try {
                await ensureSkillsDir();
                const filePath = skillPath(name);
                const existed = await fs.access(filePath).then(() => true).catch(() => false);
                await fs.writeFile(filePath, content, 'utf8');
                const lines = content.split('\n').length;
                const action = existed ? 'Updated' : 'Added';
                return `${action} skill "${name}" (${lines} lines, saved to ${path.resolve(filePath)})`;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        },
    ));

    tools.push(create_tool(
        'delete_skill',
        `Remove a skill by name. This is permanent.`,
        {
            name: { type: 'string', description: 'Skill name to delete (without .md extension)' },
        },
        async ({ name }) => {
            try {
                await ensureSkillsDir();
                const filePath = skillPath(name);
                await fs.unlink(filePath);
                return `Deleted skill "${name}".`;
            } catch (e) {
                if (e.code === 'ENOENT') return `Skill "${name}" not found.`;
                return `Error: ${e.message}`;
            }
        },
    ));

    return { name: 'skills', tools, description: 'Manage reusable agent skills (add, list, get, delete). Skills are markdown instructions stored persistently.' };
};
