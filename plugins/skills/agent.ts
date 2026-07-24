import fs from 'fs';
import { create_tool } from '../../lib/utils';
import path from 'path';

export default class Skills {
    constructor (private ctx: any) {
        // add tools to work with skills        
        const { toolbox } = this.ctx.core;

        toolbox.add(create_tool(
            'get_skill',
            `Read the full content of a named skill. Returns the raw markdown content of the skill.`,
            {
                name: { type: 'string', description: 'Skill name (without .md extension)' },
            },
            ({ name }: any) => {
                this.load_from_file(name);
                // try {
                //     await ensureSkillsDir();
                //     const filePath = skillPath(name);
                //     const content = await fs.readFile(filePath, 'utf8');
                //     return content;
                // } catch (e) {
                //     if (e.code === 'ENOENT') return `Skill "${name}" not found. Use list_skills to see available skills.`;
                //     return `Error: ${e.message}`;
                // }
            },
        ))


        // read available skills from uwd cwd awd
        // add their short description to the prompt
        this.load(`Use skills when applicable. Available skills are: "user" (gets information about user). THERE IS NO OTHER SKILLS that are not mentioned here. DO NOT LOAD SKILLS unless needed.`);

        this.ctx.plugins.skills = this;
    }

    public load = (skill: string) => {
        // add whole skill to the prompt
        const { session } = this.ctx.core;

        session.add({ role: 'system', content: skill });
    };

    public load_from_file = (p: string) => {
        return this.load(fs.readFileSync(path.resolve(process.cwd(), './skills', p + '.md')).toString());
    };
}