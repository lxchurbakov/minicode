import path from 'path';
import fs from 'fs/promises';
import merge from 'lodash/merge.js';
import { fileURLToPath } from 'url';

const GLOBAL_CONFIG = {
    version: '0.1',
};

const CWD = process.cwd();
const UWD = path.resolve('~');
const AWD = path.resolve(fileURLToPath(import.meta.url), '../../'); // TODO what if binary?

const load_config = async (p) => {
    const content = await fs.readFile(path.resolve(p, './.minicode.json'));
    const data = JSON.parse(content);

    return data;
};

const parse_config = (s) => {
    if (s === null) {
        return null;
    }

    if (Array.isArray(s)) {
        return s.map((v) => parse_config(v));
    }

    if (typeof s === 'object') {
        return Object.fromEntries(
            Object.entries(s).map(([key, value]) => ([
                key, parse_config(value),
            ])),
        );
    }

    if (typeof s === 'string') {
        const subs = {
            ...process.env,
        };

        if (s.startsWith('{{') && s.endsWith('}}')) {
            return subs[s.slice(2, -2)];
        }

        return s;
    }

    return s;
};

export default async () => {
    const config = await [AWD, UWD, CWD].reduce(async (acc, p) => {
        return acc.then(async (conf) => {
            return merge(conf, await load_config(p).catch(() => ({})));
        });
    }, Promise.resolve(GLOBAL_CONFIG));

    return config;
};

