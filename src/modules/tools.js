import mcps from '../mcps/index.js';
import { create_tool } from '../../lib/tools.js';

export default () => {
    const tools = [];
    const loadedMcps = new Set();

    tools.push(create_tool(
        'get_time',
        'Get current date and time in ISO format.',
        {},
        async () => new Date().toISOString(),
    ));

    tools.push(create_tool(
        'webfetch',
        'Fetch content from a URL and return the response as text.',
        {
            url: { type: 'string', description: 'The URL to fetch' },
            method: { type: 'string', description: 'HTTP method (default: GET)' },
            headers: { type: 'object', description: 'Optional HTTP headers as key-value pairs' },
            body: { type: 'string', description: 'Optional request body (for POST, PUT, etc.)' },
        },
        async ({ url, method = 'GET', headers = {}, body }) => {
            const res = await fetch(url, {
                method,
                headers,
                ...(body ? { body } : {}),
            });
            const text = await res.text();
            return `HTTP ${res.status} ${res.statusText}\n\n${text}`;
        },
    ));


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
            if (!mcps[name]) {
                return `Unknown MCP: "${name}". Available: ${Object.keys(mcps).join(', ')}`;
            }

            if (loadedMcps.has(name)) {
                return `MCP "${name}" already loaded.`;
            }

            const mcp = mcps[name]();

            for (const tool of mcp.tools) {
                tools.push(tool);
            }

            loadedMcps.add(name);

            return `Loaded MCP "${name}" with ${mcp.tools.length} tools: ${mcp.tools.map(t => t.name).join(', ')}`;
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

    return { definitions, call };
};
