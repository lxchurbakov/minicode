import chalk from 'chalk';
// import { build_status_bar } from '../lib/utils.js';

const parse_arguments = (raw) => {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

const get_delta = (chunk) => {
    return chunk.choices?.[0]?.delta;
};

const add_call_delta = (calls, call) => {
    const index = call.index;

    if (!calls[index]) calls[index] = { id: '', name: '', args: '' };

    if (call.id) calls[index].id += call.id;
    if (call.function?.name) calls[index].name += call.function.name;
    if (call.function?.arguments) calls[index].args += call.function.arguments;

    return calls;
};

export default (model, tools, write) => { // , tools, writer 
    const messages = [{ role: 'system', content: model.prompt }];

    const session = {
        input: 0,
        output: 0,
        context: 0,
        requests: 0,
        startedAt: Date.now(),
    };

    // let abortController = null;

    const run = async () => {
        try {
            const stream = await model.complete(messages, tools.definitions(), {
                // signal: abortController.signal,
            });

            let response = '';
            let calls = [];

            write('\n');

            for await (const chunk of stream) {
                if (chunk.usage) {
                    session.input += chunk.usage.prompt_tokens || 0;
                    session.output += chunk.usage.completion_tokens || 0;
                    session.context = chunk.usage.prompt_tokens || 0;
                }

                const delta = get_delta(chunk);

                if (!delta) {
                    continue;
                }

                if (delta.content) {
                    response += delta.content;
                    write(delta.content);
                }

                if (delta.tool_calls) {
                    for (const call of delta.tool_calls) {
                        calls = add_call_delta(calls, call);
                    }
                }
            }

            write('\n');
            write('\n');

            const message = { role: 'assistant', content: response || null };

            if (calls.length) {
                message.tool_calls = calls.map((call, index) => ({
                    id: call.id || `call_${index}`,
                    type: 'function',
                    function: { name: call.name, arguments: call.args },
                }));
            }

            messages.push(message);

            if (message.tool_calls) {
                const results = await Promise.all(message.tool_calls.map(async (call) => {
                    console.log(chalk.dim(`~ Tool call ${call.function.name} (${call.function.arguments})`));

                    const result = await tools.call({
                        name: call.function.name,
                        args: parse_arguments(call.function.arguments),
                    });

                    return { id: call.id, result };
                }));

                for (const { id, result } of results) {
                    messages.push({ role: 'tool', tool_call_id: id, content: String(result) });
                }

                return run();
            }
        } catch (e) {
            write(chalk.red(`[Error] ${e.message}`) + '\n');
            write(chalk.dim(`  (check your network / API key / model config)`) + '\n');
            write('\n');
        }
    };

    const push = (content) => {
        messages.push({ role: 'user', content });

        return run();
    };

    // const abort = () => {
    //     abortController?.abort();
    // };

    // const getSession = () => ({ ...session, modelName: agent.name });

    // const clear = () => {
    //     messages.length = 1; // Keep system prompt
    //     session.inputTokens = 0;
    //     session.outputTokens = 0;
    //     session.requests = 0;
    //     session.startedAt = Date.now();
    // };

    // const setAgent = (newAgent) => {
    //     if (!newAgent) return false;
    //     currentAgent = newAgent;
    //     messages[0] = { role: 'system', content: currentAgent.prompt };
    //     return true;
    // };

    // return { run, push, abort, getSession, clear, setAgent };
    return { push, run };
};
