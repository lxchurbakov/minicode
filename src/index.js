#!/usr/bin/env node

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.FORCE_COLOR = '3';
process.removeAllListeners('warning');

import chalk from 'chalk';

import Repl from './modules/repl.js';
import Config from './modules/config.js';
import Models from './modules/models.js';
import Loop from './modules/loop.js';
import Tools from './modules/tools.js';

import markdown_write from '../lib/markdown.slop.js';

import { parse_argv } from '../lib/cli.js';

import dotenv from 'dotenv';
dotenv.config(); // cwd's .env, overwrites if present

const { positionals, flags } = parse_argv(process.argv.slice(2));

;(async () => {
    // Config is required in pretty much every scenario
    const config = await Config();
    const models = Models(config);

    // List models
    // TODO models list?
    if (positionals[0] === 'models') {
        console.log();
        console.log('Available models:');
        console.log();
        
        for (let model of models.list()) {
            console.log(`  ${chalk.green(model.name)}: ${model.description}`);
        }

        console.log();

        return;
    }

    // TODO make better looking and make it make more sense
    // plus add flag RAW
    if (positionals[0] === 'config') {
        return console.log(config);
    }

    //
    // Finally we start session
    //

    const repl = Repl();
    const model = models.build(flags.model)
    const tools = Tools();
    const loop = Loop(model, tools, markdown_write);

    // const write = markdown_write

    repl.onInput.on(async (line) => {
        await loop.push(line);
        // setTimeout(() => {
            // repl.write('message!' + line + '\n');
        // }, 1000);
    });

    repl.onEscape.on(() => {
        repl.write('escape' + '\n');
    });
})();
