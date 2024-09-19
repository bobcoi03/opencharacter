type Model = {
    id: string;
    name: string;
};

type Models = {
    [key: string]: Model;
};

// Create the models object
export const models: Models = {
    'gemma2-9b-it': { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    'gemma-7b-it': { id: 'gemma-7b-it', name: 'Gemma 7B' },
    'llama3-groq-70b-8192-tool-use-preview': { id: 'llama3-groq-70b-8192-tool-use-preview', name: 'Llama 3 Groq 70B Tool Use (Preview)' },
    'llama3-groq-8b-8192-tool-use-preview': { id: 'llama3-groq-8b-8192-tool-use-preview', name: 'Llama 3 Groq 8B Tool Use (Preview)' },
    'llama-3.1-70b-versatile': { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Preview)' },
    'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Preview)' },
    'llama-guard-3-8b': { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B' },
    'llama3-70b-8192': { id: 'llama3-70b-8192', name: 'Meta Llama 3 70B' },
    'llama3-8b-8192': { id: 'llama3-8b-8192', name: 'Meta Llama 3 8B' },
    'mixtral-8x7b-32768': { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    'gpt-4o-mini': { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
    "lzlv-70b": {id: "lizpreciatior/lzlv-70b-fp16-hf", name: "lzlv 70b"},
    "DeepSeek V2.5": {id: "deepseek/deepseek-chat", name: "DeepSeek V2.5"},
    'gryphe/mythomax-l2-13b': { id: 'gryphe/mythomax-l2-13b', name: 'Gryphe Mythomax L2 13B' },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);