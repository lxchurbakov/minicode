import chalk from 'chalk';
import * as readline from 'readline';

import { EventEmitter } from '../../lib/event-emitter.js';

export default () => {
    // Enable keypress events before creating readline
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

    const prompt = chalk.blue('> ');
    const onInput = new EventEmitter();
    const onEscape = new EventEmitter();

    const write = (text) => {
        // Move to start of line, clear it
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        // Print the output
        process.stdout.write(text);
        // Redraw the prompt and current input
        rl.prompt(true);
    };

    rl.setPrompt(prompt);
    rl.prompt();

    process.stdin.on('keypress', (str, key) => {
        if (key && key.name === 'escape') {
            onEscape.emitps();
        }
    });

    rl.on('line', async (line) => {
        await onInput.emitpa(line);
        rl.prompt();
    });

    rl.on('SIGINT', () => rl.close());

    return {
        write, onInput, onEscape
    };
};
