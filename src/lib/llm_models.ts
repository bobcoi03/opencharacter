type Model = {
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
    "openai/o1-mini": {
        "id": "openai/o1-mini",
        "name": "O1Mini"
    },
    "openai/o1-preview-2024-09-12": {
        "id": "openai/o1-preview-2024-09-12",
        "name": "O1Preview20240912"
    },
    "openai/o1-preview": {
        "id": "openai/o1-preview",
        "name": "O1Preview"
    },
    "mistralai/pixtral-12b": {
        "id": "mistralai/pixtral-12b",
        "name": "Pixtral12B"
    },
    "cohere/command-r-plus-08-2024": {
        "id": "cohere/command-r-plus-08-2024",
        "name": "CommandRPlus082024"
    },
    "cohere/command-r-08-2024": {
        "id": "cohere/command-r-08-2024",
        "name": "CommandR082024"
    },
    "qwen/qwen-2-vl-7b-instruct": {
        "id": "qwen/qwen-2-vl-7b-instruct",
        "name": "Qwen2Vl7BInstruct"
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
    "openai/chatgpt-4o-latest": {
        "id": "openai/chatgpt-4o-latest",
        "name": "Chatgpt4OLatest"
    },
    "sao10k/l3-lunaris-8b": {
        "id": "sao10k/l3-lunaris-8b",
        "name": "L3Lunaris8B"
    },
    "aetherwiing/mn-starcannon-12b": {
        "id": "aetherwiing/mn-starcannon-12b",
        "name": "MnStarcannon12B"
    },
    "openai/gpt-4o-2024-08-06": {
        "id": "openai/gpt-4o-2024-08-06",
        "name": "Gpt4O20240806"
    },
    "nothingiisreal/mn-celeste-12b": {
        "id": "nothingiisreal/mn-celeste-12b",
        "name": "MnCeleste12B"
    },
    "google/gemini-pro-1": {
        "id": "google/gemini-pro-1",
        "name": "GeminiPro1"
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
    "anthropic/claude-3": {
        "id": "anthropic/claude-3",
        "name": "Claude3"
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
    "openai/gpt-4o-2024-05-13": {
        "id": "openai/gpt-4o-2024-05-13",
        "name": "Gpt4O20240513"
    },
    "openai/gpt-4o": {
        "id": "openai/gpt-4o",
        "name": "Gpt4O"
    },
    "openai/gpt-4o:extended": {
        "id": "openai/gpt-4o:extended",
        "name": "Gpt4OExtended"
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
    "openai/gpt-4-turbo": {
        "id": "openai/gpt-4-turbo",
        "name": "Gpt4Turbo"
    },
    "cohere/command-r-plus": {
        "id": "cohere/command-r-plus",
        "name": "CommandRPlus"
    },
    "cohere/command-r-plus-04-2024": {
        "id": "cohere/command-r-plus-04-2024",
        "name": "CommandRPlus042024"
    },
    "databricks/dbrx-instruct": {
        "id": "databricks/dbrx-instruct",
        "name": "DbrxInstruct"
    },
    "sophosympatheia/midnight-rose-70b": {
        "id": "sophosympatheia/midnight-rose-70b",
        "name": "MidnightRose70B"
    },
    "cohere/command-r": {
        "id": "cohere/command-r",
        "name": "CommandR"
    },
    "cohere/command": {
        "id": "cohere/command",
        "name": "Command"
    },
    "anthropic/claude-3-haiku": {
        "id": "anthropic/claude-3-haiku",
        "name": "Claude3Haiku"
    },
    "anthropic/claude-3-haiku:beta": {
        "id": "anthropic/claude-3-haiku:beta",
        "name": "Claude3HaikuBeta"
    },
    "anthropic/claude-3-sonnet": {
        "id": "anthropic/claude-3-sonnet",
        "name": "Claude3Sonnet"
    },
    "anthropic/claude-3-sonnet:beta": {
        "id": "anthropic/claude-3-sonnet:beta",
        "name": "Claude3SonnetBeta"
    },
    "anthropic/claude-3-opus": {
        "id": "anthropic/claude-3-opus",
        "name": "Claude3Opus"
    },
    "anthropic/claude-3-opus:beta": {
        "id": "anthropic/claude-3-opus:beta",
        "name": "Claude3OpusBeta"
    },
    "cohere/command-r-03-2024": {
        "id": "cohere/command-r-03-2024",
        "name": "CommandR032024"
    },
    "mistralai/mistral-large": {
        "id": "mistralai/mistral-large",
        "name": "MistralLarge"
    },
    "openai/gpt-4-turbo-preview": {
        "id": "openai/gpt-4-turbo-preview",
        "name": "Gpt4TurboPreview"
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
    "google/gemini-pro-vision": {
        "id": "google/gemini-pro-vision",
        "name": "GeminiProVision"
    },
    "google/gemini-pro": {
        "id": "google/gemini-pro",
        "name": "GeminiPro"
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
    "anthropic/claude-instant-1": {
        "id": "anthropic/claude-instant-1",
        "name": "ClaudeInstant1"
    },
    "anthropic/claude-2": {
        "id": "anthropic/claude-2",
        "name": "Claude2"
    },
    "anthropic/claude-2:beta": {
        "id": "anthropic/claude-2:beta",
        "name": "Claude2Beta"
    },
    "teknium/openhermes-2": {
        "id": "teknium/openhermes-2",
        "name": "Openhermes2"
    },
    "openai/gpt-4-vision-preview": {
        "id": "openai/gpt-4-vision-preview",
        "name": "Gpt4VisionPreview"
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
    "openai/gpt-4-1106-preview": {
        "id": "openai/gpt-4-1106-preview",
        "name": "Gpt41106Preview"
    },
    "google/palm-2-codechat-bison-32k": {
        "id": "google/palm-2-codechat-bison-32k",
        "name": "Palm2CodechatBison32K"
    },
    "google/palm-2-chat-bison-32k": {
        "id": "google/palm-2-chat-bison-32k",
        "name": "Palm2ChatBison32K"
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
    "openai/gpt-4-32k-0314": {
        "id": "openai/gpt-4-32k-0314",
        "name": "Gpt432K0314"
    },
    "openai/gpt-4-32k": {
        "id": "openai/gpt-4-32k",
        "name": "Gpt432K"
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
    "anthropic/claude-instant-1:beta": {
        "id": "anthropic/claude-instant-1:beta",
        "name": "ClaudeInstant1Beta"
    },
    "undi95/remm-slerp-l2-13b": {
        "id": "undi95/remm-slerp-l2-13b",
        "name": "RemmSlerpL213B"
    },
    "undi95/remm-slerp-l2-13b:extended": {
        "id": "undi95/remm-slerp-l2-13b:extended",
        "name": "RemmSlerpL213BExtended"
    },
    "google/palm-2-codechat-bison": {
        "id": "google/palm-2-codechat-bison",
        "name": "Palm2CodechatBison"
    },
    "google/palm-2-chat-bison": {
        "id": "google/palm-2-chat-bison",
        "name": "Palm2ChatBison"
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
    "openai/gpt-4-0314": {
        "id": "openai/gpt-4-0314",
        "name": "Gpt40314"
    },
    "openai/gpt-4": {
        "id": "openai/gpt-4",
        "name": "Gpt4"
    },
};
  
// Helper function to get an array of model IDs
export const getModelIds = (): string[] => Object.keys(models);

// Helper function to get an array of Model objects
export const getModelArray = (): Model[] => Object.values(models);