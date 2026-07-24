export type Listener<T, R = void> = (value: T) => R;

export default class Emitter<T, R = void> {
    private listeners = [] as Listener<T, R>[];

    public on = (predicate: Listener<T, R>) => {
        this.listeners.push(predicate);
    };

    public parallel = {
        sync: (value: T) => {
            return this.listeners.map(($) => $(value));
        },
        async: async (value: T) => {
            return Promise.all(this.listeners.map(($) => $(value)));
        },
    };

    public chain = {
        sync: (value: T) => {
            return this.listeners.reduce((acc, $) => ($ as unknown as Listener<T, T>)(acc), value);
        },
        async: async (value: T) => {
            return this.listeners.reduce((acc, $) => acc.then((value) => Promise.resolve(($ as unknown as Listener<T, T>)(value))), Promise.resolve(value));
        },
    };
};
