export type Role = 'user' | 'assistant' | 'tool';
export type Message = { role: Role, content: string, tool_calls?: any[], tool_call_id?: string };
export type Stream = any;
