import chalk from 'chalk';
import * as readline from 'readline';

import Emitter from './emitter';

export default class Repl {
    rl: readline.Interface;

    public onInput = new Emitter<string>();
    public onEscape = new Emitter<void>();

    constructor () {
        readline.emitKeypressEvents(process.stdin);

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        const prompt = chalk.blue('> ');
       
        this.rl.setPrompt(prompt);
        this.rl.prompt();

        process.stdin.on('keypress', (str, key) => {
            if (key && key.name === 'escape') {
                this.onEscape.parallel.sync();
            }
        });

        this.rl.on('line', async (line) => {
            await this.onInput.parallel.async(line);

            this.rl.prompt();
        });

        this.rl.on('SIGINT', () => this.rl.close());
    }

    public write =(text: string) => {
        // Move to start of line, clear it
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        // Print the output
        process.stdout.write(text);
        // Redraw the prompt and current input
        this.rl.prompt(true);
    };
}
