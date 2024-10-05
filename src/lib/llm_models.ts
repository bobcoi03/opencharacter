type Model = {
    id: string;
    name: string;
};

type Models = {
    [key: string]: Model;
};

// Create the models object
export const models = {
    "gryphe/mythomax-l2-13b": {
        "id": "gryphe/mythomax-l2-13b",
        "name": "MythomaxL213B"
    },
    "microsoft/wizardlm-2-7b": {
        "id": "microsoft/wizardlm-2-7b",
        "name": "microsoft/wizardlm-2-7b",
    },
    "mistralai/mistral-nemo": {
        "id": "mistralai/mistral-nemo",
        "name": "mistralai/mistral-nemo"
    },
    "google/gemini-flash-1.5-8b": {
        "id": "google/gemini-flash-1.5-8b",
        "name": "google/gemini-flash-1.5-8b",
    },
    "mistralai/mistral-7b-instruct": {
        "id": "mistralai/mistral-7b-instruct",
        "name": "mistralai/mistral-7b-instruct"
    },
    "google/gemma-2-9b-it": {
        "id": "google/gemma-2-9b-it",
        "name": "google/gemma-2-9b-it"
    },
    "mistralai/mistral-7b-instruct:nitro": {
        "id": "mistralai/mistral-7b-instruct:nitro",
        "name": "mistralai/mistral-7b-instruct:nitro"
    },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);

// Function to validate if a model name exists
export const isValidModel = (model_name: string): boolean => {
    return model_name in models;
};
