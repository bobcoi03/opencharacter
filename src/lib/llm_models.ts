export type Model = {
    id: string;
    name: string;
};

type Models = {
    [key: string]: Model;
};

// Create the models object
export const models = {
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
    "liquid/lfm-40b": {
        "id": "liquid/lfm-40b",
        "name": "Lfm40B"
    },
    "liquid/lfm-40b:free": {
        "id": "liquid/lfm-40b:free",
        "name": "Lfm40BFree"
    },
    "thedrummer/rocinante-12b": {
        "id": "thedrummer/rocinante-12b",
        "name": "Rocinante12B"
    },
    "anthracite-org/magnum-v2-72b": {
        "id": "anthracite-org/magnum-v2-72b",
        "name": "MagnumV272B"
    },
    "meta-llama/llama-3": {
        "id": "meta-llama/llama-3",
        "name": "Llama3"
    },
    "qwen/qwen-2": {
        "id": "qwen/qwen-2",
        "name": "Qwen2"
    },
    "qwen/qwen-2-vl-72b-instruct": {
        "id": "qwen/qwen-2-vl-72b-instruct",
        "name": "Qwen2Vl72BInstruct"
    },
    "neversleep/llama-3": {
        "id": "neversleep/llama-3",
        "name": "Llama3"
    },
    "openai/o1-mini-2024-09-12": {
        "id": "openai/o1-mini-2024-09-12",
        "name": "O1Mini20240912"
    },
    "mistralai/pixtral-12b": {
        "id": "mistralai/pixtral-12b",
        "name": "Pixtral12B"
    },
    "google/gemini-flash-8b-1": {
        "id": "google/gemini-flash-8b-1",
        "name": "GeminiFlash8B1"
    },
    "sao10k/l3": {
        "id": "sao10k/l3",
        "name": "L3"
    },
    "ai21/jamba-1-5-large": {
        "id": "ai21/jamba-1-5-large",
        "name": "Jamba15Large"
    },
    "ai21/jamba-1-5-mini": {
        "id": "ai21/jamba-1-5-mini",
        "name": "Jamba15Mini"
    },
    "microsoft/phi-3": {
        "id": "microsoft/phi-3",
        "name": "Phi3"
    },
    "nousresearch/hermes-3-llama-3": {
        "id": "nousresearch/hermes-3-llama-3",
        "name": "Hermes3Llama3"
    },
    "perplexity/llama-3": {
        "id": "perplexity/llama-3",
        "name": "Llama3"
    },
    "sao10k/l3-lunaris-8b": {
        "id": "sao10k/l3-lunaris-8b",
        "name": "L3Lunaris8B"
    },
    "aetherwiing/mn-starcannon-12b": {
        "id": "aetherwiing/mn-starcannon-12b",
        "name": "MnStarcannon12B"
    },
    "nothingiisreal/mn-celeste-12b": {
        "id": "nothingiisreal/mn-celeste-12b",
        "name": "MnCeleste12B"
    },
    "mistralai/codestral-mamba": {
        "id": "mistralai/codestral-mamba",
        "name": "CodestralMamba"
    },
    "mistralai/mistral-nemo": {
        "id": "mistralai/mistral-nemo",
        "name": "MistralNemo"
    },
    "openai/gpt-4o-mini-2024-07-18": {
        "id": "openai/gpt-4o-mini-2024-07-18",
        "name": "Gpt4OMini20240718"
    },
    "openai/gpt-4o-mini": {
        "id": "openai/gpt-4o-mini",
        "name": "Gpt4OMini"
    },
    "qwen/qwen-2-7b-instruct:free": {
        "id": "qwen/qwen-2-7b-instruct:free",
        "name": "Qwen27BInstructFree"
    },
    "qwen/qwen-2-7b-instruct": {
        "id": "qwen/qwen-2-7b-instruct",
        "name": "Qwen27BInstruct"
    },
    "google/gemma-2-27b-it": {
        "id": "google/gemma-2-27b-it",
        "name": "Gemma227BIt"
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
    "google/gemma-2-9b-it": {
        "id": "google/gemma-2-9b-it",
        "name": "Gemma29BIt"
    },
    "ai21/jamba-instruct": {
        "id": "ai21/jamba-instruct",
        "name": "JambaInstruct"
    },
    "sao10k/l3-euryale-70b": {
        "id": "sao10k/l3-euryale-70b",
        "name": "L3Euryale70B"
    },
    "cognitivecomputations/dolphin-mixtral-8x22b": {
        "id": "cognitivecomputations/dolphin-mixtral-8x22b",
        "name": "DolphinMixtral8X22B"
    },
    "qwen/qwen-2-72b-instruct": {
        "id": "qwen/qwen-2-72b-instruct",
        "name": "Qwen272BInstruct"
    },
    "nousresearch/hermes-2-pro-llama-3-8b": {
        "id": "nousresearch/hermes-2-pro-llama-3-8b",
        "name": "Hermes2ProLlama38B"
    },
    "mistralai/mistral-7b-instruct-v0": {
        "id": "mistralai/mistral-7b-instruct-v0",
        "name": "Mistral7BInstructV0"
    },
    "mistralai/mistral-7b-instruct:free": {
        "id": "mistralai/mistral-7b-instruct:free",
        "name": "Mistral7BInstructFree"
    },
    "mistralai/mistral-7b-instruct": {
        "id": "mistralai/mistral-7b-instruct",
        "name": "Mistral7BInstruct"
    },
    "mistralai/mistral-7b-instruct:nitro": {
        "id": "mistralai/mistral-7b-instruct:nitro",
        "name": "Mistral7BInstructNitro"
    },
    "microsoft/phi-3-mini-128k-instruct:free": {
        "id": "microsoft/phi-3-mini-128k-instruct:free",
        "name": "Phi3Mini128KInstructFree"
    },
    "microsoft/phi-3-mini-128k-instruct": {
        "id": "microsoft/phi-3-mini-128k-instruct",
        "name": "Phi3Mini128KInstruct"
    },
    "microsoft/phi-3-medium-128k-instruct:free": {
        "id": "microsoft/phi-3-medium-128k-instruct:free",
        "name": "Phi3Medium128KInstructFree"
    },
    "microsoft/phi-3-medium-128k-instruct": {
        "id": "microsoft/phi-3-medium-128k-instruct",
        "name": "Phi3Medium128KInstruct"
    },
    "neversleep/llama-3-lumimaid-70b": {
        "id": "neversleep/llama-3-lumimaid-70b",
        "name": "Llama3Lumimaid70B"
    },
    "perplexity/llama-3-sonar-large-32k-online": {
        "id": "perplexity/llama-3-sonar-large-32k-online",
        "name": "Llama3SonarLarge32KOnline"
    },
    "perplexity/llama-3-sonar-large-32k-chat": {
        "id": "perplexity/llama-3-sonar-large-32k-chat",
        "name": "Llama3SonarLarge32KChat"
    },
    "perplexity/llama-3-sonar-small-32k-online": {
        "id": "perplexity/llama-3-sonar-small-32k-online",
        "name": "Llama3SonarSmall32KOnline"
    },
    "perplexity/llama-3-sonar-small-32k-chat": {
        "id": "perplexity/llama-3-sonar-small-32k-chat",
        "name": "Llama3SonarSmall32KChat"
    },
    "meta-llama/llama-guard-2-8b": {
        "id": "meta-llama/llama-guard-2-8b",
        "name": "LlamaGuard28B"
    },
    "qwen/qwen-72b-chat": {
        "id": "qwen/qwen-72b-chat",
        "name": "Qwen72BChat"
    },
    "qwen/qwen-110b-chat": {
        "id": "qwen/qwen-110b-chat",
        "name": "Qwen110BChat"
    },
    "neversleep/llama-3-lumimaid-8b": {
        "id": "neversleep/llama-3-lumimaid-8b",
        "name": "Llama3Lumimaid8B"
    },
    "neversleep/llama-3-lumimaid-8b:extended": {
        "id": "neversleep/llama-3-lumimaid-8b:extended",
        "name": "Llama3Lumimaid8BExtended"
    },
    "sao10k/fimbulvetr-11b-v2": {
        "id": "sao10k/fimbulvetr-11b-v2",
        "name": "Fimbulvetr11BV2"
    },
    "meta-llama/llama-3-70b-instruct": {
        "id": "meta-llama/llama-3-70b-instruct",
        "name": "Llama370BInstruct"
    },
    "meta-llama/llama-3-70b-instruct:nitro": {
        "id": "meta-llama/llama-3-70b-instruct:nitro",
        "name": "Llama370BInstructNitro"
    },
    "meta-llama/llama-3-8b-instruct:free": {
        "id": "meta-llama/llama-3-8b-instruct:free",
        "name": "Llama38BInstructFree"
    },
    "meta-llama/llama-3-8b-instruct": {
        "id": "meta-llama/llama-3-8b-instruct",
        "name": "Llama38BInstruct"
    },
    "meta-llama/llama-3-8b-instruct:nitro": {
        "id": "meta-llama/llama-3-8b-instruct:nitro",
        "name": "Llama38BInstructNitro"
    },
    "meta-llama/llama-3-8b-instruct:extended": {
        "id": "meta-llama/llama-3-8b-instruct:extended",
        "name": "Llama38BInstructExtended"
    },
    "mistralai/mixtral-8x22b-instruct": {
        "id": "mistralai/mixtral-8x22b-instruct",
        "name": "Mixtral8X22BInstruct"
    },
    "microsoft/wizardlm-2-7b": {
        "id": "microsoft/wizardlm-2-7b",
        "name": "Wizardlm27B"
    },
    "microsoft/wizardlm-2-8x22b": {
        "id": "microsoft/wizardlm-2-8x22b",
        "name": "Wizardlm28X22B"
    },
    "databricks/dbrx-instruct": {
        "id": "databricks/dbrx-instruct",
        "name": "DbrxInstruct"
    },
    "sophosympatheia/midnight-rose-70b": {
        "id": "sophosympatheia/midnight-rose-70b",
        "name": "MidnightRose70B"
    },
    "openai/gpt-3": {
        "id": "openai/gpt-3",
        "name": "Gpt3"
    },
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo": {
        "id": "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
        "name": "NousHermes2Mixtral8X7BDpo"
    },
    "mistralai/mistral-medium": {
        "id": "mistralai/mistral-medium",
        "name": "MistralMedium"
    },
    "mistralai/mistral-small": {
        "id": "mistralai/mistral-small",
        "name": "MistralSmall"
    },
    "mistralai/mistral-tiny": {
        "id": "mistralai/mistral-tiny",
        "name": "MistralTiny"
    },
    "austism/chronos-hermes-13b": {
        "id": "austism/chronos-hermes-13b",
        "name": "ChronosHermes13B"
    },
    "nousresearch/nous-hermes-yi-34b": {
        "id": "nousresearch/nous-hermes-yi-34b",
        "name": "NousHermesYi34B"
    },
    "cognitivecomputations/dolphin-mixtral-8x7b": {
        "id": "cognitivecomputations/dolphin-mixtral-8x7b",
        "name": "DolphinMixtral8X7B"
    },
    "mistralai/mixtral-8x7b-instruct": {
        "id": "mistralai/mixtral-8x7b-instruct",
        "name": "Mixtral8X7BInstruct"
    },
    "mistralai/mixtral-8x7b-instruct:nitro": {
        "id": "mistralai/mixtral-8x7b-instruct:nitro",
        "name": "Mixtral8X7BInstructNitro"
    },
    "mistralai/mixtral-8x7b": {
        "id": "mistralai/mixtral-8x7b",
        "name": "Mixtral8X7B"
    },
    "gryphe/mythomist-7b:free": {
        "id": "gryphe/mythomist-7b:free",
        "name": "Mythomist7BFree"
    },
    "openchat/openchat-7b:free": {
        "id": "openchat/openchat-7b:free",
        "name": "Openchat7BFree"
    },
    "openchat/openchat-7b": {
        "id": "openchat/openchat-7b",
        "name": "Openchat7B"
    },
    "neversleep/noromaid-20b": {
        "id": "neversleep/noromaid-20b",
        "name": "Noromaid20B"
    },
    "teknium/openhermes-2": {
        "id": "teknium/openhermes-2",
        "name": "Openhermes2"
    },
    "alpindale/goliath-120b": {
        "id": "alpindale/goliath-120b",
        "name": "Goliath120B"
    },
    "undi95/toppy-m-7b:free": {
        "id": "undi95/toppy-m-7b:free",
        "name": "ToppyM7BFree"
    },
    "undi95/toppy-m-7b": {
        "id": "undi95/toppy-m-7b",
        "name": "ToppyM7B"
    },
    "undi95/toppy-m-7b:nitro": {
        "id": "undi95/toppy-m-7b:nitro",
        "name": "ToppyM7BNitro"
    },
    "openrouter/auto": {
        "id": "openrouter/auto",
        "name": "Auto"
    },
    "jondurbin/airoboros-l2-70b": {
        "id": "jondurbin/airoboros-l2-70b",
        "name": "AiroborosL270B"
    },
    "xwin-lm/xwin-lm-70b": {
        "id": "xwin-lm/xwin-lm-70b",
        "name": "XwinLm70B"
    },
    "pygmalionai/mythalion-13b": {
        "id": "pygmalionai/mythalion-13b",
        "name": "Mythalion13B"
    },
    "nousresearch/nous-hermes-llama2-13b": {
        "id": "nousresearch/nous-hermes-llama2-13b",
        "name": "NousHermesLlama213B"
    },
    "huggingfaceh4/zephyr-7b-beta:free": {
        "id": "huggingfaceh4/zephyr-7b-beta:free",
        "name": "Zephyr7BBetaFree"
    },
    "mancer/weaver": {
        "id": "mancer/weaver",
        "name": "Weaver"
    },
    "anthropic/claude-1": {
        "id": "anthropic/claude-1",
        "name": "Claude1"
    },
    "undi95/remm-slerp-l2-13b": {
        "id": "undi95/remm-slerp-l2-13b",
        "name": "RemmSlerpL213B"
    },
    "undi95/remm-slerp-l2-13b:extended": {
        "id": "undi95/remm-slerp-l2-13b:extended",
        "name": "RemmSlerpL213BExtended"
    },
    "gryphe/mythomax-l2-13b:nitro": {
        "id": "gryphe/mythomax-l2-13b:nitro",
        "name": "MythomaxL213BNitro"
    },
    "gryphe/mythomax-l2-13b:extended": {
        "id": "gryphe/mythomax-l2-13b:extended",
        "name": "MythomaxL213BExtended"
    },
    "meta-llama/llama-2-13b-chat": {
        "id": "meta-llama/llama-2-13b-chat",
        "name": "Llama213BChat"
    },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);