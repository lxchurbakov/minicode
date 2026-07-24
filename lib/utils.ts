import { Tool } from "../core/toolbox";

export const create_tool = (name: string, description: string, properties: any, handler: any) => ({
    name,
    handler,
    definition: {
        type: 'function',
        function: { name, description, parameters: { type: 'object', properties } },
    },
} as Tool);
