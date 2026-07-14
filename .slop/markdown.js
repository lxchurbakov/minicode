import chalk from 'chalk';

// ── Syntax highlighting ──────────────────────────────────────────
const KW = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'function', 'const', 'let', 'var', 'import', 'export', 'from',
    'class', 'extends', 'new', 'this', 'async', 'await', 'try', 'catch',
    'throw', 'finally', 'typeof', 'instanceof', 'in', 'of', 'yield', 'def',
    'lambda', 'True', 'False', 'None', 'and', 'or', 'not', 'is', 'with',
    'as', 'pass', 'raise', 'except', 'elif',
]);

const highlight = code => {
    const subs = [];
    const ph = i => `\x01${String.fromCharCode(65 + i)}\x02`;
    let i = 0;
    const esc = (re, fn) => { code = code.replace(re, m => { subs.push(fn(m)); return ph(i++); }); };

    esc(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, m => chalk.green(m));
    esc(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, m => chalk.gray(m));

    for (const kw of KW) code = code.replace(new RegExp(`\\b${kw}\\b`, 'g'), m => chalk.magenta(m));
    code = code.replace(/\b(\d+\.?\d*)\b/g, m => chalk.yellow(m));
    code = code.replace(/\b([a-zA-Z_$][\w$]*)\s*\(/g, (m, n) => KW.has(n) ? m : chalk.blue(n) + '(');

    return code.replace(/\x01([A-Z])\x02/g, (_, c) => subs[c.charCodeAt(0) - 65] || '');
};

const boxW = () => Math.min(60, (process.stdout.columns || 80) - 4);
const padLine = (line, w) => {
    const visible = line.replace(/\x1b\[[0-9;]*m/g, '').length;
    return line + ' '.repeat(Math.max(0, w - visible));
};

// ── Streaming markdown renderer ──────────────────────────────────
class Markdown {
    constructor() {
        this.buf = '';
        this.inCode = false;
        this.codeLang = '';
        this.codeLines = [];
        this.blankRun = 0;
    }

    _collapse(rendered, isBlank) {
        if (isBlank) {
            this.blankRun++;
            if (this.blankRun > 1) return null;
            return rendered;
        }
        this.blankRun = 0;
        return rendered;
    }

    process(chunk) {
        this.buf += chunk;
        let out = '';

        let idx;
        while ((idx = this.buf.indexOf('\n')) !== -1) {
            const line = this.buf.slice(0, idx);
            this.buf = this.buf.slice(idx + 1);
            const rendered = this._processLine(line);
            const isBlank = !this.inCode && rendered.replace(/\x1b\[[0-9;]*m/g, '').trim() === '';
            const kept = this._collapse(rendered, isBlank);
            if (kept !== null) out += kept + '\n';
        }

        return out;
    }

    _processLine(line) {
        if (line.startsWith('```')) {
            if (this.inCode) {
                const w = boxW();
                const code = this.codeLines.map(l => highlight(l));
                const langLabel = this.codeLang ? ` ${this.codeLang} ` : '';
                const topBar = '─'.repeat(w - langLabel.length);
                const lines = [
                    chalk.gray('┌' + topBar + langLabel + '┐'),
                    ...code.map(l => chalk.gray('│ ') + padLine(l, w - 2) + chalk.gray(' │')),
                    chalk.gray('└' + '─'.repeat(w) + '┘'),
                ];
                this.inCode = false;
                this.codeLines = [];
                this.codeLang = '';
                return lines.join('\n');
            } else {
                this.inCode = true;
                this.codeLang = line.slice(3).trim();
                return '';
            }
        }

        if (this.inCode) {
            this.codeLines.push(line);
            return '';
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const lvl = headingMatch[1].length;
            const txt = headingMatch[2];
            const colors = [chalk.bold.cyan, chalk.bold.green, chalk.bold.yellow, chalk.yellow, chalk.white, chalk.gray];
            return (colors[lvl - 1] || chalk.white)(txt);
        }

        return line
            .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
            .replace(/\*(.+?)\*/g, (_, t) => chalk.italic(t))
            .replace(/`([^`]+)`/g, (_, t) => chalk.cyan(t));
    }

    flush() {
        let out = '';
        if (this.buf) {
            const rendered = this._processLine(this.buf);
            this.buf = '';
            const isBlank = !this.inCode && rendered.replace(/\x1b\[[0-9;]*m/g, '').trim() === '';
            const kept = this._collapse(rendered, isBlank);
            if (kept !== null) out += kept;
        }
        if (this.inCode) {
            const w = boxW();
            const code = this.codeLines.map(l => highlight(l));
            const langLabel = this.codeLang ? ` ${this.codeLang} ` : '';
            const topBar = '─'.repeat(w - langLabel.length);
            out += [
                chalk.gray('┌' + topBar + langLabel + '┐'),
                ...code.map(l => chalk.gray('│ ') + padLine(l, w - 2) + chalk.gray(' │')),
                chalk.gray('└' + '─'.repeat(w) + '┘'),
            ].join('\n');
            this.inCode = false;
            this.codeLines = [];
        }
        return out;
    }
}

// ── Factory function that returns a write function ──────────────
export const createMarkdownWriter = () => {
    const md = new Markdown();

    const write = (chunk) => {
        const output = md.process(chunk);
        if (output) process.stdout.write(output);
    };

    write.flush = () => {
        const output = md.flush();
        if (output) process.stdout.write(output);
    };

    return write;
};

export default createMarkdownWriter();
