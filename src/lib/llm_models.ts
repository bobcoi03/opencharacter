type Model = {
    id: string;
    name: string;
    paid: boolean;
    metered?: boolean;
};

type Models = {
    [key: string]: Model;
};

export const models: Models = {
    "liquid/lfm-7b": {
        id: "liquid/lfm-7b",
        name: "liquid/lfm-7b",
        paid: false,
    },
    "liquid/lfm-3b": {
        id: "liquid/lfm-3b",
        name: "liquid/lfm-3b",
        paid: false,
    },
    "mistralai/ministral-3b": {
        id: "mistralai/ministral-3b",
        name: "mistralai/ministral-3b",
        paid: false,
    },
    "mistralai/ministral-8b": {
        id: "mistralai/ministral-8b",
        name: "mistralai/ministral-8b",
        paid: false,
    },
    "gryphe/mythomax-l2-13b": {
        id: "gryphe/mythomax-l2-13b",
        name: "gryphe/mythomax-l2-13b",
        paid: false
    },
    "amazon/nova-micro-v1": {
        id: "amazon/nova-micro-v1",
        name: "amazon/nova-micro-v1",
        paid: false,
    },
    "microsoft/phi-4": {
        id: "microsoft/phi-4",
        name: "microsoft/phi-4",
        paid: false,
    },
    "microsoft/wizardlm-2-7b": {
        id: "microsoft/wizardlm-2-7b",
        name: "microsoft/wizardlm-2-7b",
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
    "meta-llama/llama-3.2-3b-instruct": {
        id: "meta-llama/llama-3.2-3b-instruct",
        name: "meta-llama/llama-3.2-3b-instruct",
        paid: false,
    },
    "meta-llama/llama-3.2-1b-instruct": {
        id: "meta-llama/llama-3.2-1b-instruct",
        name: "meta-llama/llama-3.2-1b-instruct",
        paid: false,
    },
    "meta-llama/llama-3.1-8b-instruct": {
        id: "meta-llama/llama-3.1-8b-instruct",
        name: "meta-llama/llama-3.1-8b-instruct",
        paid: false,
    },
    "qwen/qwen-2-7b-instruct": {
        id: "qwen/qwen-2-7b-instruct",
        name: "qwen/qwen-2-7b-instruct",
        paid: false,
    },
    "mistralai/mistral-7b-instruct-v0.3": {
        id: "mistralai/mistral-7b-instruct-v0.3",
        name: "mistralai/mistral-7b-instruct-v0.3",
        paid: false
    },
    "meta-llama/llama-3-8b-instruct": {
        id: "meta-llama/llama-3-8b-instruct",
        name: "meta-llama/llama-3-8b-instruct",
        paid: false
    },
    "mistralai/mistral-nemo": {
        id: "mistralai/mistral-nemo",
        name: "mistralai/mistral-nemo",
        paid: false,
    },
    "sao10k/l3-lunaris-8b": {
        id: "sao10k/l3-lunaris-8b",
        name: "sao10k/l3-lunaris-8b",
        paid: false,
    },
    "nousresearch/hermes-2-pro-llama-3-8b": {
        id: "nousresearch/hermes-2-pro-llama-3-8b",
        name: "nousresearch/hermes-2-pro-llama-3-8b",
        paid: false,
    },
    "openchat/openchat-7b": {
        id: "openchat/openchat-7b",
        name: "openchat/openchat-7b",
        paid: false,
    },
    "undi95/toppy-m-7b:nitro": {
        id: "undi95/toppy-m-7b:nitro",
        name: "undi95/toppy-m-7b:nitro",
        paid: false,
    },
    "amazon/nova-lite-v1": {
        id: "amazon/nova-lite-v1",
        name: "amazon/nova-lite-v1",
        paid: false,
    },
    "mistralai/pixtral-12b": {
        id: "mistralai/pixtral-12b",
        name: "mistralai/pixtral-12b",
        paid: false,
    },
    "thedrummer/unslopnemo-12b": {
        id: "thedrummer/unslopnemo-12b",
        name: "thedrummer/unslopnemo-12b",
        paid: true,
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
    "mistralai/mistral-small-24b-instruct-2501": {
        id: "mistralai/mistral-small-24b-instruct-2501",
        name: "mistralai/mistral-small-24b-instruct-2501",
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
    },
    "nvidia/llama-3.1-nemotron-70b-instruct": {
        id: "nvidia/llama-3.1-nemotron-70b-instruct",
        name: "nvidia/llama-3.1-nemotron-70b-instruct",
        paid: true,
    },
    "deepseek/deepseek-chat-v3-0324": {
        id: "deepseek/deepseek-chat-v3-0324",
        name: "deepseek/deepseek-chat-v3-0324",
        paid: true
    },
    "thedrummer/rocinante-12b": {
        id: "thedrummer/rocinante-12b",
        name: "thedrummer/rocinante-12b",
        paid: true
    },
    "eva-unit-01/eva-qwen-2.5-14b": {
        id: "eva-unit-01/eva-qwen-2.5-14b",
        name: "eva-unit-01/eva-qwen-2.5-14b",
        paid: true
    },
    "mistralai/mistral-tiny": {
        id: "mistralai/mistral-tiny",
        name: "mistralai/mistral-tiny",
        paid: true,
    },
    "mistralai/mistral-small": {
        id: "mistralai/mistral-small",
        name: "mistralai/mistral-small",
        paid: true,
    },
    "qwen/qwen-turbo": {
        id: "qwen/qwen-turbo",
        name: "qwen/qwen-turbo",
        paid: true,
    },
    "qwen/qwen-plus": {
        id: "qwen/qwen-plus",
        name: "qwen/qwen-plus",
        paid: true,
    },
    "deepseek/deepseek-r1-distill-qwen-1.5b": {
        id: "deepseek/deepseek-r1-distill-qwen-1.5b",
        name: "deepseek/deepseek-r1-distill-qwen-1.5b",
        paid: true,
    },
    "deepseek/deepseek-r1-distill-qwen-32b": {
        id: "deepseek/deepseek-r1-distill-qwen-32b",
        name: "deepseek/deepseek-r1-distill-qwen-32b",
        paid: true,
    },
    "deepseek/deepseek-r1-distill-llama-70b": {
        id: "deepseek/deepseek-r1-distill-llama-70b",
        name: "deepseek/deepseek-r1-distill-llama-70b",
        paid: true,
    },
    "qwen/qvq-72b-preview": {
        id: "qwen/qvq-72b-preview",
        name: "qwen/qvq-72b-preview",
        paid: true,
    },
    "qwen/qwq-32b-preview": {
        id: "qwen/qwq-32b-preview",
        name: "qwen/qwq-32b-preview",
        paid: true,
    },
    "qwen/qwen-2.5-coder-32b-instruct": {
        id: "qwen/qwen-2.5-coder-32b-instruct",
        name: "qwen/qwen-2.5-coder-32b-instruct",
        paid: true,
    },
    "mistralai/codestral-2501": {
        id: "mistralai/codestral-2501",
        name: "mistralai/codestral-2501",
        paid: true,
    },
    "meta-llama/llama-3.3-70b-instruct": {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "meta-llama/llama-3.3-70b-instruct",
        paid: true,
    },
    "deepseek/deepseek-r1-distill-llama-3.1-70b": {
        id: "deepseek/deepseek-r1-distill-llama-3.1-70b",
        name: "deepseek/deepseek-r1-distill-llama-3.1-70b",
        paid: true,
    },
    "anthropic/claude-3.7-sonnet": {
        id: "anthropic/claude-3.7-sonnet",
        name: "anthropic/claude-3.7-sonnet",
        paid: true,
        metered: true,
    },
    "anthropic/claude-3.7-sonnet:thinking": {
        id: "anthropic/claude-3.7-sonnet:thinking",
        name: "anthropic/claude-3.7-sonnet:thinking",
        paid: true,
        metered: true,
    },
    "deepseek/deepseek-r1": {
        id: "deepseek/deepseek-r1",
        name: "deepseek/deepseek-r1",
        paid: true,
        metered: true,
    },
    "openai/gpt-4o-2024-11-20": {
        id: "openai/gpt-4o-2024-11-20",
        name: "openai/gpt-4o-2024-11-20",
        paid: true,
        metered: true,
    },
    "openai/o3-mini-high": {
        id: "openai/o3-mini-high",
        name: "openai/o3-mini-high",
        paid: true,
        metered: true,
    },
    "allenai/llama-3.1-tulu-3-405b": {
        id: "allenai/llama-3.1-tulu-3-405b",
        name: "allenai/llama-3.1-tulu-3-405b",
        paid: true,
        metered: true,
    },
    "aion-labs/aion-1.0": {
        id: "aion-labs/aion-1.0",
        name: "aion-labs/aion-1.0",
        paid: true,
        metered: true,
    },
    "qwen/qwen-max": {
        id: "qwen/qwen-max",
        name: "qwen/qwen-max",
        paid: true,
        metered: true,
    },
    "openai/o1": {
        id: "openai/o1",
        name: "openai/o1",
        paid: true,
        metered: true,
    },
    "x-ai/grok-2-1212": {
        id: "x-ai/grok-2-1212",
        name: "x-ai/grok-2-1212",
        paid: true,
        metered: true,
    },
    "mistralai/mistral-large-2411": {
        id: "mistralai/mistral-large-2411",
        name: "mistralai/mistral-large-2411",
        paid: true,
        metered: true,
    },
    "neversleep/llama-3.1-lumimaid-70b": {
        id: "neversleep/llama-3.1-lumimaid-70b",
        name: "neversleep/llama-3.1-lumimaid-70b",
        paid: true,
        metered: true,
    },
    "x-ai/grok-beta": {
        id: "x-ai/grok-beta",
        name: "x-ai/grok-beta",
        paid: true,
        metered: true,
    },
    "inflection/inflection-3-pi": {
        id: "inflection/inflection-3-pi",
        name: "inflection/inflection-3-pi",
        paid: true,
        metered: true,
    },
    "cohere/command-r-plus-08-2024": {
        id: "cohere/command-r-plus-08-2024",
        name: "cohere/command-r-plus-08-2024",
        paid: true,
        metered: true,
    },
    "ai21/jamba-1-5-large": {
        id: "ai21/jamba-1-5-large",
        name: "ai21/jamba-1-5-large",
        paid: true,
        metered: true,
    },
    "01-ai/yi-large": {
        id: "01-ai/yi-large",
        name: "01-ai/yi-large",
        paid: true,
        metered: true,
    },
    "neversleep/llama-3-lumimaid-70b": {
        id: "neversleep/llama-3-lumimaid-70b",
        name: "neversleep/llama-3-lumimaid-70b",
        paid: true,
        metered: true,
    },
    "anthropic/claude-3-opus": {
        id: "anthropic/claude-3-opus",
        name: "anthropic/claude-3-opus",
        paid: true,
        metered: true,
    },
    "anthropic/claude-3-sonnet": {
        id: "anthropic/claude-3-sonnet",
        name: "anthropic/claude-3-sonnet",
        paid: true,
        metered: true,
    },
    "alpindale/goliath-120b": {
        id: "alpindale/goliath-120b",
        name: "alpindale/goliath-120b",
        paid: true,
        metered: true,
    },
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

// Add function to check if model is a DAW API model
export const isDAWModel = (modelName: string): boolean => {
    return modelName.startsWith('DAW API -');
};

// Get all DAW API models
export const getDAWModelIds = (): string[] => 
    Object.keys(models).filter(id => isDAWModel(id));

// Get free DAW API models
export const getFreeDAWModelIds = (): string[] =>
    Object.keys(models).filter(id => isDAWModel(id) && !models[id].paid);

// Get all metered models
export const getMeteredModelIds = (): string[] =>
    Object.keys(models).filter(id => models[id].metered);

// Get all metered models as array
export const getMeteredModelArray = (): Model[] =>
    Object.values(models).filter(model => model.metered);

// Check if model is metered
export const isMeteredModel = (modelName: string): boolean => {
    const model = models[modelName];
    return model ? !!model.metered : false;
};