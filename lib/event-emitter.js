export class EventEmitter {
    listeners = [];

    on = (listener) => this.listeners.push(listener);
    off = (listener) => this.listeners = this.listeners.filter((l) => l !== listener);

    emitsa = (data) => this.listeners.reduce((acc, l) => acc.then(($data) => Promise.resolve(l($data))), Promise.resolve(data));
    emitss = (data) => this.listeners.reduce((acc, l) => l(acc), data);

    emitpa = (data) => Promise.all(this.listeners.map((l) => Promise.resolve(l(data))));
    emitps = (data) => this.listeners.map((l) => l(data));
};
