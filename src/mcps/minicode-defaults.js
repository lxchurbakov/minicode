import { exec } from 'child_process';
import { promisify } from 'util';

import { create_tool } from '../../lib/tools.js';

const execAsync = promisify(exec);

export default async () => {
    const tools = [];

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
        'run_command',
        'Execute a shell command and return stdout + stderr output.',
        {
            command: { type: 'string', description: 'Shell command to execute' },
            cwd: { type: 'string', description: 'Working directory (defaults to current)' },
            timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
        },
        async ({ command, cwd, timeout = 30000 }) => {
            const { stdout, stderr } = await execAsync(command, {
                cwd,
                timeout,
                maxBuffer: 10 * 1024 * 1024,
            });
            let result = '';
            if (stdout) result += `stdout:\n${stdout}\n`;
            if (stderr) result += `stderr:\n${stderr}`;
            return result.trim() || '(no output)';
        },
    ));

    return { name: 'minicode-defaults', tools, description: 'Basic utility tools: get_time, webfetch, and run_command.' };
};