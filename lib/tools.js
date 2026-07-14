export const create_tool = (name, description, properties, handler) => ({
    name,
    handler,
    definition: {
        type: 'function',
        function: { name, description, parameters: { type: 'object', properties } },
    },
});
