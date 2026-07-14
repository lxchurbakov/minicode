
export const parse_argv = (args) => {
    let positionals = [];
    let flags = {};
    let flag = null;

    for (let arg of args) {
        if (arg.startsWith('--')) {
            if (flag) {
                flags[flag] = true;
                flag = null;
            }
            
            flag = arg.slice(2);
            continue;
        }

        if (flag) {
            flags[flag] = arg;
            flag = null;
            continue;
        }

        positionals.push(arg);
    }

    if (flag) {
        flags[flag] = true;
        flag = null;
    }

    return { positionals, flags };
};
