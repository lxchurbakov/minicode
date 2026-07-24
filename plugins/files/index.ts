import Agent from "../../core/agent";
import Plugware from "../../core/plugware";
import { create_tool } from "../../lib/utils";
// import { PluginHooks, PluginLoadContext } from "../../lib/types";
import fs from 'fs';

export default class FilesPlugin {
    // name = 'files';
    // description = 'Read, write, and list files in the workspace';

    constructor (private plugware: Plugware) {
        this.plugware.bus.on(({ name, payload }) => {
            if (name === 'agent-setup-complete') {
                this.on_agent_setup_complete(payload)
            }
        });
    }

    // onLoad?(ctx: PluginLoadContext) {
    //     // Could register event listeners here too
    // }

    on_agent_setup_complete = (agent: Agent) => {
        agent.toolbox.add(create_tool(
            'read_file',
            `Read the full contents of a file from the workspace. Returns the file content as a string.`,
            {
                path: { type: 'string', description: 'Relative path to the file (e.g., "src/index.ts")' },
            },
            ({ path }: any) => {
                try {
                    const content = fs.readFileSync(path, 'utf8');
                    return content;
                } catch (e: any) {
                    if (e.code === 'ENOENT') return `File "${path}" not found.`;
                    return `Error: ${e.message}`;
                }
            },
        ));

        agent.toolbox.add(create_tool(
            'list_dir',
            `List the contents of a directory. Returns an array of file and folder names.`,
            {
                path: { type: 'string', description: 'Relative path to the directory (e.g., "." or "src")' },
            },
            ({ path }: any) => {
                try {
                    const entries = fs.readdirSync(path, { withFileTypes: true });
                    const result = entries.map((entry: fs.Dirent) => {
                        const type = entry.isDirectory() ? '📁' : '📄';
                        return `${type} ${entry.name}`;
                    });
                    return result.length > 0 
                        ? `Contents of "${path}":\n` + result.join('\n')
                        : `Directory "${path}" is empty.`;
                } catch (e: any) {
                    if (e.code === 'ENOENT') return `Directory "${path}" not found.`;
                    return `Error: ${e.message}`;
                }
            },
        ));

        // console.log(agent)

        if (!agent.agent_config.plugins.files?.only_read) {
            agent.toolbox.add(create_tool(
                'write_file',
                `Write content to a file. Creates the file if it doesn't exist, overwrites if it does.`,
                {
                    path: { type: 'string', description: 'Relative path to the file (e.g., "src/data.json")' },
                    content: { type: 'string', description: 'The content to write to the file' },
                },
                ({ path, content }: any) => {
                    try {
                        const dir = path.substring(0, path.lastIndexOf('/'));
                        if (dir) fs.mkdirSync(dir, { recursive: true });
                        
                        fs.writeFileSync(path, content, 'utf8');
                        return `Successfully wrote ${content.length} bytes to "${path}".`;
                    } catch (e: any) {
                        return `Error: ${e.message}`;
                    }
                },
            ));
        }
    }
}