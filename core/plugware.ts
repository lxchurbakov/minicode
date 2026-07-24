import Emitter from "../lib/emitter";
// // import Agent from "../core/agent";
// // import Session from "../core/session";
// import Config from "../core/config";
// // import { PluginHooks } from "../lib/types";

import Config from "./config";

// // const app = {};
// export const bus = new Emitter();
// // const bus = {};
// const ctx = { app, core, bus, plugins };

// export const load = async (p: string) => {
//     const module = await import(p);
//     const Plugin = module.default;
//     const plugin = new Plugin(ctx);

//     return plugin;
// };



// // export default class Plugware {
// //     // private plugins: PluginHooks[] = [];
// //     

// //     constructor (public config: Config) {

// //     }

// //     // public emit = this.bus.emit;

// //     // {
// //     //     parallel: {
// //     //         async: <T = unknown>(name: string, payload: T) => {
// //     //             return this.bus.parallel.async({ name, payload }).then(($) => $.map(($$) => $$.payload)
// //     //         },
// //     //         sync: <T = unknown>(name: string, payload: T) => {
// //     //             return this.bus.parallel.sync({ name, payload });
// //     //         },
// //     //     },
// //     //     chain: {
// //     //         async: <T = unknown>(name: string, payload: T) => {
// //     //             return this.bus.chain.async({ name, payload });
// //     //         },
// //     //         sync: <T = unknown>(name: string, payload: T) => {
// //     //             return this.bus.chain.sync({ name, payload });
// //     //         },
// //     //     }
// //     // };

// //     // public on = <T = unknown, R = unknown>(name: string, listener: (value: T) => R) => {
// //     //     this.bus.on((msg: { name: string, payload: T }) => {
// //     //         if (msg.name === name) {
// //     //             listener(msg.payload);
// //     //         }
// //     //     });
// //     // };

// //     public load = async (p: string) => {
// //         const module = await import(p);
// //         const Plugin = module.default;
// //         const plugin = new Plugin(this);
// //         // const plugin: PluginHooks = new PluginClass(this);

// //         // this.plugins.push(plugin);

// //         // if (plugin.onLoad) {
// //         //     await plugin.onLoad({
// //         //         config: this.config!,
// //         //         bus: this.bus,
// //         //     });
// //         // }

// //         // console.log(`→ plugin loaded: ${plugin.name}`);

// //         // return plugin;
// //     };

// //     // // ── Lifecycle triggers ──

// //     // /** Call when an Agent is constructed */
// //     // public triggerAgentCreate = (agent: Agent) => {
// //     //     for (const plugin of this.plugins) {
// //     //         plugin.onAgentCreate?.(agent);
// //     //     }
// //     // };

// //     // /** Call when a Session is constructed */
// //     // public triggerSessionCreate = (session: Session) => {
// //     //     for (const plugin of this.plugins) {
// //     //         plugin.onSessionCreate?.(session);
// //     //     }
// //     // };

// //     // /** Call before a message is sent to the model */
// //     // public triggerBeforeMessage = (message: import("../lib/types").Message) => {
// //     //     let msg = message;
// //     //     for (const plugin of this.plugins) {
// //     //         const result = plugin.onBeforeMessage?.(msg);
// //     //         if (result) msg = result;
// //     //     }
// //     //     return msg;
// //     // };

// //     // /** Call after assistant responds */
// //     // public triggerAfterResponse = async (message: import("../lib/types").Message) => {
// //     //     for (const plugin of this.plugins) {
// //     //         await plugin.onAfterResponse?.(message);
// //     //     }
// //     // };
// // }
export default class Plugware {
    public bus = new Emitter<{ name: string, payload: any }>();

    constructor (public config: Config) {

    }

    public load = async (p: string) => {
        const module = await import(p);
        const Plugin = module.default;
        const plugin = new Plugin(this);
    };
}