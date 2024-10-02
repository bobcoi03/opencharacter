export type Model = {
    id: string;
    name: string;
};

type Models = {
    [key: string]: Model;
};

// Create the models object
export const models = {
    "meta-llama/llama-3.1-405b-instruct:free": {
        "id": "meta-llama/llama-3.1-405b-instruct:free",
        "name": "meta-llama/llama-3.1-405b-instruct:free"
    },
    "deepseek/deepseek-chat": {
        "id": "deepseek/deepseek-chat",
        "name": "DeepseekChat"
    },
    "lizpreciatior/lzlv-70b-fp16-hf": {
        "id": "lizpreciatior/lzlv-70b-fp16-hf",
        "name": "Lzlv70BFp16Hf"
    },
    "gryphe/mythomax-l2-13b": {
        "id": "gryphe/mythomax-l2-13b",
        "name": "MythomaxL213B"
    },
    "gryphe/mythomist-7b": {
        "id": "gryphe/mythomist-7b",
        "name": "Mythomist7B"
    },
    "liquid/lfm-40b:free": {
        "id": "liquid/lfm-40b:free",
        "name": "Lfm40BFree"
    },
    "alpindale/magnum-72b": {
        "id": "alpindale/magnum-72b",
        "name": "Magnum72B"
    },
    "nousresearch/hermes-2-theta-llama-3-8b": {
        "id": "nousresearch/hermes-2-theta-llama-3-8b",
        "name": "Hermes2ThetaLlama38B"
    },
    "google/gemma-2-9b-it:free": {
        "id": "google/gemma-2-9b-it:free",
        "name": "Gemma29BItFree"
    },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);