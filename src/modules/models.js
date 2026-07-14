import OpenAI from 'openai';

const parse_key = (json) => {
    const replacements = {
        // YA_CLOUD_API_KEY: process.env.YA_CLOUD_API_KEY,
        ...process.env,
    };

    // return json.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    //     return replacements[varName] ?? match;
    // });
    if (json.startsWith('{{') && json.endsWith('}}')) {
        // console.log(json, json.substr(2, json.length - 4));
        return replacements[json.substr(2, json.length - 4)];
    }

    return json;
};

export default (config) => {
    const models = {
        list: () => {
            return config.models.map(({ name, description }) => {
                return { name, description };
            });
        },
        get: (name) => {
            return config.models.find(($) => $.name === name) ?? config.models.find(($) => $.default);
        },
        build: (name) => {
            const model_from_config = models.get(name);

            if (!model_from_config) {
                throw new Error(`model ${name} is not found`);
            }

            const prompt = model_from_config.prompt;

            const client = new OpenAI({
                baseURL: model_from_config.url,
                apiKey: parse_key(model_from_config.key),
            });

            // console.log(parse_key(model_from_config.key));

            const complete = async (messages, tools) => {
                return client.chat.completions.create({
                    model: model_from_config.model,
                    messages: messages,
                    tools: tools?.length ? tools : undefined,
                    tool_choice: tools?.length ? 'auto' : undefined,
                    stream: true,
                    stream_options: { include_usage: true },
                    // signal,
                });
            };

            return {
                name, complete, prompt: model_from_config.prompt
            };
        },
    };

    return models;
};
