import OpenAI from 'openai';

import Config, { AgentConfig, ModelConfig } from "./config";
import { Message } from '../lib/types';
import Toolbox from './toolbox';
import Plugware from '../core/plugware';

export default class Agent {
    private client: OpenAI;
    private model_config: ModelConfig;
    public toolbox = new Toolbox();

    constructor (private config: Config, private plugware: Plugware, public agent_config: AgentConfig) {
        this.model_config = this.config.get_model_config(this.agent_config.model)!;

        this.client = new OpenAI({
            baseURL: this.model_config.url,
            apiKey: this.model_config.key,
        });

        // ── Let plugins hook into agent creation ──
        this.plugware.bus.parallel.sync({ name: 'agent-setup-complete', payload: this });
    }

    public complete = (messages: Message[], tools: any[] = []) => {
        return this.client.chat.completions.create({
            model: this.model_config.model,
            messages: messages as any,
            tools: tools?.length ? tools : undefined,
            tool_choice: tools?.length ? 'auto' : undefined,
            stream: true,
            stream_options: { include_usage: true },
        });
    };
}