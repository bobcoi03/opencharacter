type Model = {
    id: string;
    name: string;
    paid: boolean;
};

type Models = {
    [key: string]: Model;
};

export const models: Models = {
    "gryphe/mythomax-l2-13b": {
        id: "gryphe/mythomax-l2-13b",
        name: "MythomaxL213B",
        paid: false
    },
    "microsoft/wizardlm-2-7b": {
        id: "microsoft/wizardlm-2-7b",
        name: "microsoft/wizardlm-2-7b",
        paid: false
    },
    "mistralai/mistral-nemo": {
        id: "mistralai/mistral-nemo",
        name: "mistralai/mistral-nemo",
        paid: false
    },
    "google/gemini-flash-1.5-8b": {
        id: "google/gemini-flash-1.5-8b",
        name: "google/gemini-flash-1.5-8b",
        paid: false
    },
    "mistralai/mistral-7b-instruct": {
        id: "mistralai/mistral-7b-instruct",
        name: "mistralai/mistral-7b-instruct",
        paid: false
    },
    "google/gemma-2-9b-it": {
        id: "google/gemma-2-9b-it",
        name: "google/gemma-2-9b-it",
        paid: false
    },
    "mistralai/mistral-7b-instruct:nitro": {
        id: "mistralai/mistral-7b-instruct:nitro",
        name: "mistralai/mistral-7b-instruct:nitro",
        paid: false
    },
    "meta-llama/llama-3.1-70b-instruct": {
        id: "meta-llama/llama-3.1-70b-instruct",
        name: "meta-llama/llama-3.1-70b-instruct",
        paid: true
    },
    "nousresearch/hermes-3-llama-3.1-70b": {
        id: "nousresearch/hermes-3-llama-3.1-70b",
        name: "nousresearch/hermes-3-llama-3.1-70b",
        paid: true
    },
    "deepseek/deepseek-chat": {
        id: "deepseek/deepseek-chat",
        name: "deepseek/deepseek-chat",
        paid: true
    },
    "microsoft/phi-3.5-mini-128k-instruct": {
        id: "microsoft/phi-3.5-mini-128k-instruct",
        name: "microsoft/phi-3.5-mini-128k-instruct",
        paid: true
    },
    "ai21/jamba-1-5-mini": {
        id: "ai21/jamba-1-5-mini",
        name: "ai21/jamba-1-5-mini",
        paid: true
    },
    "mistralai/codestral-mamba": {
        id: "mistralai/codestral-mamba",
        name: "mistralai/codestral-mamba",
        paid: true
    },
    "openai/gpt-4o-mini": {
        id: "openai/gpt-4o-mini",
        name: "openai/gpt-4o-mini",
        paid: true,
    },
    "anthropic/claude-3-haiku": {
        id: "anthropic/claude-3-haiku",
        name: "anthropic/claude-3-haiku",
        paid: true,
    },
    "cognitivecomputations/dolphin-mixtral-8x22b": {
        id: "cognitivecomputations/dolphin-mixtral-8x22b",
        name: "cognitivecomputations/dolphin-mixtral-8x22b",
        paid: true,
    },
    "google/gemma-2-27b-it": {
        id: "google/gemma-2-27b-it",
        name: "google/gemma-2-27b-it",
        paid: true,
    },
    "mistralai/mixtral-8x7b-instruct": {
        id: "mistralai/mixtral-8x7b-instruct",
        name: "mistralai/mixtral-8x7b-instruct",
        paid: true,
    },
    "gryphe/mythomist-7b": {
        id: "gryphe/mythomist-7b",
        name: "gryphe/mythomist-7b",
        paid: true,
    },
    "anthropic/claude-instant-1:beta": {
        id: "anthropic/claude-instant-1:beta",
        name: "anthropic/claude-instant-1:beta",
        paid: true
    }
};

export const getModelIds = (): string[] => Object.keys(models);

export const getModelArray = (): Model[] => Object.values(models);

export const isValidModel = (modelName: string): boolean => modelName in models;

export const isPaidModel = (modelName: string): boolean => {
    const model = models[modelName];
    return model ? model.paid : false;
};

export const getPaidModelIds = (): string[] => 
    Object.keys(models).filter(id => models[id].paid);

export const getPaidModelArray = (): Model[] => 
    Object.values(models).filter(model => model.paid);

export const getFreeModelIds = (): string[] => 
    Object.keys(models).filter(id => !models[id].paid);

export const getFreeModelArray = (): Model[] => 
    Object.values(models).filter(model => !model.paid);

export const getModelsByType = (paid: boolean): Model[] => 
    Object.values(models).filter(model => model.paid === paid);