import chalk from 'chalk';
import mcps from '../mcps/index.js';
import { create_tool } from '../../lib/tools.js';

export default async () => {
    const tools = [];
    const loadedMcps = new Set();

    const load_mcp = async (name) => {
        if (!mcps[name]) {
            throw new Error(`Unknown MCP: "${name}". Available: ${Object.keys(mcps).join(', ')}`);
        }

        if (loadedMcps.has(name)) {
            throw new Error(`MCP "${name}" already loaded.`);
        }

        const mcp = await mcps[name]();

        for (const tool of mcp.tools) {
            tools.push(tool);
        }

        loadedMcps.add(name);

        const toolList = mcp.tools.map(t => chalk.cyan(t.name)).join(chalk.dim(', '));

        console.log(`→ ${chalk.bold.green('MCP Loaded!')} ${chalk.yellow(mcp.name)} ${chalk.dim('|')} ${chalk.dim('Tools:')} ${toolList}`);
    };

    tools.push(create_tool(
        'load_mcp',
        `Load additional tools by connecting to an MCP (Model Context Protocol) server. Available: ${
            Object.entries(mcps).map(([name, description]) => {
                return `"${name}": ${description}`;
            }).join('; ')
        }`,
        {
            name: { type: 'string', description: `Name of the MCP to load. Available: ${Object.keys(mcps).map(n => `"${n}"`).join(', ')}` },
        },
        async ({ name }) => {
            try {
                return load_mcp(name);
            } catch (e) {
                return e.message;
            }
        },
    ));

    const definitions = () => tools.map(($) => $.definition);

    const call = async ({ name, args }) => {
        const tool = tools.find(($) => $.name === name);

        if (!tool) {
            return `Unknown tool: "${name}"`;
        }

        try {
            return await tool.handler(args);
        } catch (e) {
            return `Tool "${name}" threw an error: ${e.message}`;
        }
    };

    // Auto-load the minicode-defaults MCP (get_time, webfetch)
    await load_mcp('minicodeDefaults');
    await load_mcp('skills');

    return { definitions, call };
};
