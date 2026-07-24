export type Tool = {
    name: string;
    definition: unknown;
    handler: any;
}

export default class Toolbox {
    private tools = [] as Tool[];

    public call = async ({ name, args }: any) => {
        const tool = this.tools.find(($) => $.name === name);

        if (!tool) {
            return `Unknown tool: "${name}"`;
        }

        try {
            return await tool.handler(args);
        } catch (e: unknown) {
            return `Tool "${name}" threw an error: ${e}`;
        }
    };

    public definitions = () => {
        return this.tools.map(($) => $.definition);
    };

    public add = (tool: Tool) => {
        // for (const tool of tools_from_toolbox) {
        this.tools.push(tool);
                    // }
        // const load_toolbox = (() => {
        //         const loaded = new Set();
        
        //         return async (name) => {
        //             if (!toolboxes[name]) {
        //                 throw new Error(`Unknown toolbox: "${name}". Available: ${Object.keys(toolboxes).join(', ')}`);
        //             }
        
        //             if (loaded.has(name)) {
        //                 throw new Error(`Toolbox "${name}" already loaded.`);
        //             }
        
        //             const toolbox = toolboxes[name];
        //             const tools_from_toolbox = await toolbox.loader(ctx);
        
        //             // console.log({ tools })
        
        //             
        
        //             loaded.add(name);
        
        //             const toolList = tools_from_toolbox.map(t => chalk.cyan(t.name)).join(chalk.dim(', '));
        
        //             console.log(`→ ${chalk.bold.green('toolbox loaded')} ${chalk.yellow(toolbox.name)} ${chalk.dim('|')} ${chalk.dim('tools:')} ${toolList}`);
        //         };
        //     })();
    };
}
// name,
//     handler,
//     definition: {
//         type: 'function',
//         function: { name, description, parameters: { type: 'object', properties } },
//     },