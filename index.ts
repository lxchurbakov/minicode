import path from 'path';
import Agent from './core/agent';
import Config from './core/config';
// import Models from './core/models';

// import Session from './core/session';
import Toolbox from './core/toolbox';
import { create_tool } from './lib/utils';
import Session from './core/session';
import Repl from './lib/repl';

import Plugware from './core/plugware';

const config = new Config();

//
// List config
//

// TODO

//
// List models
//

// const models = new Models(config);

// TODO

// 
// List agents
//

// const agents = new Agents(config);

// TODO

// 
// Start application
//

;(async () => {
    // const model = 
    // if (!model) {
    //     console.log('nope');
    //     return;
    // }

    // TODO one shot support

    const plugware = new Plugware(config);

    await plugware.load(path.resolve(process.cwd(), './plugins/files/index.ts'));

    //

    const agent = new Agent(config, plugware, config.get_agent_config('plan'));

    // const toolbox = new Toolbox();

    // toolbox.add(create_tool(
    //     'get_time',
    //     'Get current date and time in ISO format.',
    //     {},
    //     async () => new Date().toISOString(),
    // ));

    const conversation = new Session(agent, plugware, process.stdout.write.bind(process.stdout));
    const repl = new Repl();

    repl.onInput.on(async (value) => {
        // repl.write(value + '\n');
        await conversation.push(value);
    });

    // const session = new Session(agent, toolbox);

    // Plugins

    

    // plugware.load(path.resolve(process.cwd(), './plugins/skills/index.ts'))
    
})();
