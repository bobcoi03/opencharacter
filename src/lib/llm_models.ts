type Model = {
    id: string;
    name: string;
};

type Models = {
    [key: string]: Model;
};

// Create the models object
export const models: Models = {
    "google/gemini-flash-1.5": {id: "google/gemini-flash-1.5", name: "google/gemini-flash-1.5"},
    "lzlv-70b": {id: "lizpreciatior/lzlv-70b-fp16-hf", name: "lzlv 70b (most uncensored)"},
    "DeepSeek V2.5": {id: "deepseek/deepseek-chat", name: "DeepSeek V2.5 (moderate)"},
    'gryphe/mythomax-l2-13b': { id: 'gryphe/mythomax-l2-13b', name: 'Gryphe Mythomax L2 13B' },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);