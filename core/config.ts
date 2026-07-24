import path from 'path';
import fs from 'fs';

import get from 'lodash/get';
import merge from 'lodash/merge';

const GLOBAL_CONFIG = {
    version: '0.1',
};

export type ModelConfig = {
    name: string;
    description: string;
    url: string;
    key: string;
    model: string;
};

export type AgentConfig = {
    name: string;
    description: string;
    model: string;
    prompt: string;
    plugins: Record<string, any>;
};

export default class Config {
    private config = {} as Record<string, unknown>;

    constructor () {
        // Project working dir
        const CWD = process.cwd();
        // User working dir
        // const UWD = path.resolve('~');
        // Application working dir
        // const AWD = path.resolve(__dirname, '../');

        this.config = merge(
            GLOBAL_CONFIG, 
            [CWD,/* UWD, AWD */].map((p) => this.parse(this.load(p))).reduce((a, b) => merge(a, b)),
        );
    }

    private load = (p: string) => {
        try {
            const buffer = fs.readFileSync(path.resolve(p, './.minicode.json'));
            const content = buffer.toString();
            const data = JSON.parse(content);

            return data;
        } catch (e) {
            return null;
        }
    };

    private parse = (config: unknown): unknown => {
        if (config === null) {
            return null;
        }

        if (Array.isArray(config)) {
            return config.map(($: unknown) => this.parse($));
        }

        if (typeof config === 'object') {
            return Object.fromEntries(
                Object.entries(config).map(([key, value]) => ([
                    key, this.parse(value),
                ])),
            );
        }

        if (typeof config === 'string') {
            const subs = {
                ...process.env,
            };

            if (config.startsWith('{{') && config.endsWith('}}')) {
                return subs[config.slice(2, -2)] ?? null;
            }

            return config;
        }

        return config;
    };

    public whole = () => {
        return this.config;
    };

    public get = <T = unknown>(field: string) => {
        return get(this.config, field) as T;
    };

    public models = () => {
        return this.get<ModelConfig[]>('models');
    };

    public agents = () => {
        return this.get<AgentConfig[]>('agents');
    };

    public get_model_config = (name: string) => {
        return this.models().find(($) => $.name === name) as ModelConfig;
    };

    public get_agent_config = (name: string) => {
        return this.agents().find(($) => $.name === name) as AgentConfig;
    };
};
