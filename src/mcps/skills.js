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
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(SKILLS_DIR, `${safe}.md`);
}

export default async () => {
    const tools = [];

    tools.push(create_tool(
        'list_skills',
        `List all available skills with their name, description, tags, and line count.

Each skill has YAML front matter with title, description, and tags.
Use get_skill to read the full content of any skill.`,
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

                    // Parse YAML front matter (between --- markers)
                    let title = name;
                    let description = '(no description)';
                    let tags = [];

                    if (lines[0]?.trim() === '---') {
                        const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
                        if (endIdx > 0) {
                            const yamlLines = lines.slice(1, endIdx);
                            for (const yl of yamlLines) {
                                if (yl.startsWith('title:')) {
                                    title = yl.replace(/^title:\s*['"]?|['"]?\s*$/g, '').trim();
                                } else if (yl.startsWith('description:')) {
                                    description = yl.replace(/^description:\s*['"]?|['"]?\s*$/g, '').trim();
                                } else if (yl.startsWith('tags:')) {
                                    const tagMatch = yl.match(/tags:\s*\[([^\]]+)\]/);
                                    if (tagMatch) {
                                        tags = tagMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
                                    }
                                }
                            }
                        }
                    }

                    return { name, title, description, tags, lineCount };
                }));

                const out = rows.map(r => {
                    const tagStr = r.tags.length ? r.tags.join(', ') : '-';
                    return `  ${r.name.padEnd(14)} ${String(r.lineCount).padEnd(5)} ${r.description}\n     ${''.padEnd(14)} tags: ${tagStr}`;
                }).join('\n');

                return `Available skills:\n\n${'Name'.padEnd(15)} Lines  Description\n${'-'.repeat(15)} ${'-'.repeat(5)}  ${'-'.repeat(40)}\n${out}\n\nUse \`get_skill({name: "..."})\` to read the full content.`;
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

Skills are stored as markdown files with YAML front matter. Use clear, instructional markdown — headers, bullet lists, examples.
The name should be short and descriptive (e.g. "tests", "git-commits", "api-design").
**Important:** Every skill file must start with YAML front matter between \`---\` markers:
\`\`\`
---
title: "Human-readable Title"
description: "Brief summary of what the skill teaches."
tags: ["tag1", "tag2", "tag3"]
---
\`\`\`
The title, description, and tags are shown by list_skills so agents can quickly understand what the skill covers.`,
        {
            name: { type: 'string', description: 'Skill name (without .md extension, alphanumeric/dashes/underscores)' },
            content: { type: 'string', description: 'Full markdown content of the skill, must include YAML front matter with title, description, and tags' },
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

    return { name: 'skills', tools, description: 'Manage reusable agent skills (add, list, get, delete). Skills are markdown files with YAML front matter (title, description, tags) stored persistently.' };
};