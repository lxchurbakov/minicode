import chalk from 'chalk';
import { Message, Stream } from '../lib/types';
import Agent from './agent';
import Toolbox from './toolbox';
import Plugware from './plugware';

const parse_arguments = (raw: any) => {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

const get_delta = (chunk: any) => {
    return chunk.choices?.[0]?.delta;
};

const add_call_delta = (calls: any, call: any) => {
    const index = call.index;

    if (!calls[index]) calls[index] = { id: '', name: '', args: '' };

    if (call.id) calls[index].id += call.id;
    if (call.function?.name) calls[index].name += call.function.name;
    if (call.function?.arguments) calls[index].args += call.function.arguments;

    return calls;
};

export default class Session {
    constructor (
        private agent: Agent, 
        private plugware: Plugware,
        private write: (s: string) => void, 
        private messages: Message[] = [],
    ) {
        // ── Let plugins hook into session creation ──
        // this.plugware.triggerSessionCreate(this);
    }

    public run = async (): Promise<void> => {
        const stream = await this.agent.complete(this.messages, this.agent.toolbox.definitions());

        let response = '';
        let calls = [];

        this.write('\n');

        for await (const chunk of stream) {
            const delta = get_delta(chunk);

            if (!delta) {
                continue;
            }

            if (delta.content) {
                response += delta.content;
                this.write(delta.content);
            }

            if (delta.tool_calls) {
                for (const call of delta.tool_calls) {
                    calls = add_call_delta(calls, call);
                }
            }
        }

        this.write('\n');
        this.write('\n');

        const message = { role: 'assistant', content: response || null } as Message;

        if (calls.length) {
            message.tool_calls = calls.map((call: any, index: number) => ({
                id: call.id || `call_${index}`,
                type: 'function',
                function: { name: call.name, arguments: call.args },
            }));
        }

        this.messages.push(message);

        // ── Let plugins react to the response ──
        // await this.plugware.triggerAfterResponse(message);

        if (message.tool_calls) {
            const results = await Promise.all(message.tool_calls.map(async (call) => {
                this.write(chalk.dim(`~ tool_call: ${call.function.name} (${call.function.arguments.slice(0, 50)})\n`));

                const result = await this.agent.toolbox.call({
                    name: call.function.name,
                    args: parse_arguments(call.function.arguments),
                });

                return { id: call.id, result };
            }));

            for (const { id, result } of results) {
                this.messages.push({ role: 'tool', tool_call_id: id, content: String(result) });
            }

            return this.run();
        }
    };

    public push = (content: string) => {
        // ── Let plugins modify the message before sending ──
        this.plugware.bus.parallel.sync({ name: 'session/message', payload: { role: 'user', content } });
        this.messages.push({ role: 'user', content });

        return this.run();
    };

    public static fork (parent: Session, agent = parent.agent, plugware = parent.plugware, write = parent.write, messages = parent.messages) {
        return new Session(agent, plugware, write, messages);
    }

    public add = (m: Message) => {
        this.messages.push(m);
    };
};