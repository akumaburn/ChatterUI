import './jsi';
import type { NativeContextParams, NativeLlamaContext, NativeCompletionParams, NativeParallelCompletionParams, NativeCompletionTokenProb, NativeCompletionResult, NativeTokenizeResult, NativeEmbeddingResult, NativeSessionLoadResult, NativeEmbeddingParams, NativeRerankParams, NativeRerankResult, NativeCompletionTokenProbItem, NativeCompletionResultTimings, JinjaFormattedChatResult, FormattedChatResult, NativeImageProcessingResult, NativeBackendDeviceInfo, ParallelStatus, ParallelRequestStatus } from './types';
export type RNLlamaMessagePart = {
    type: string;
    text?: string;
    image_url?: {
        url?: string;
    };
    input_audio?: {
        format: string;
        data?: string;
        url?: string;
    };
};
export type RNLlamaOAICompatibleMessage = {
    role: string;
    content?: string | RNLlamaMessagePart[];
    reasoning_content?: string;
};
export type { NativeContextParams, NativeLlamaContext, NativeCompletionParams, NativeParallelCompletionParams, NativeCompletionTokenProb, NativeCompletionResult, NativeTokenizeResult, NativeEmbeddingResult, NativeSessionLoadResult, NativeEmbeddingParams, NativeRerankParams, NativeRerankResult, NativeCompletionTokenProbItem, NativeCompletionResultTimings, FormattedChatResult, JinjaFormattedChatResult, NativeImageProcessingResult, NativeBackendDeviceInfo, ParallelStatus, ParallelRequestStatus, };
export declare const RNLLAMA_MTMD_DEFAULT_MEDIA_MARKER = "<__media__>";
export declare const installJsi: () => Promise<void>;
export type ToolCall = {
    type: 'function';
    id?: string;
    function: {
        name: string;
        arguments: string;
    };
};
export type TokenData = {
    token: string;
    completion_probabilities?: Array<NativeCompletionTokenProb>;
    content?: string;
    reasoning_content?: string;
    tool_calls?: Array<ToolCall>;
    accumulated_text?: string;
    requestId?: number;
};
export type ContextParams = Omit<NativeContextParams, 'flash_attn_type' | 'cache_type_k' | 'cache_type_v' | 'pooling_type'> & {
    flash_attn_type?: 'auto' | 'on' | 'off';
    cache_type_k?: 'f16' | 'f32' | 'q8_0' | 'q4_0' | 'q4_1' | 'iq4_nl' | 'q5_0' | 'q5_1';
    cache_type_v?: 'f16' | 'f32' | 'q8_0' | 'q4_0' | 'q4_1' | 'iq4_nl' | 'q5_0' | 'q5_1';
    pooling_type?: 'none' | 'mean' | 'cls' | 'last' | 'rank';
};
export type EmbeddingParams = NativeEmbeddingParams;
export type RerankParams = {
    normalize?: number;
};
export type RerankResult = {
    score: number;
    index: number;
    document?: string;
};
export type CompletionResponseFormat = {
    type: 'text' | 'json_object' | 'json_schema';
    json_schema?: {
        strict?: boolean;
        schema: object;
    };
    schema?: object;
};
export type CompletionBaseParams = {
    prompt?: string;
    messages?: RNLlamaOAICompatibleMessage[];
    chatTemplate?: string;
    chat_template?: string;
    jinja?: boolean;
    tools?: object;
    parallel_tool_calls?: object;
    tool_choice?: string;
    response_format?: CompletionResponseFormat;
    media_paths?: string | string[];
    add_generation_prompt?: boolean;
    now?: string | number;
    chat_template_kwargs?: Record<string, string>;
    /**
     * When enabled, forces the chat parser to treat the entire model output as
     * plain content, skipping separate parsing of reasoning tokens and tool calls.
     * Also bypasses jinja template validation so templates that only accept typed
     * content (e.g. TranslateGemma) are not rejected during capability detection.
     */
    force_pure_content?: boolean;
    /**
     * Prefill text to be used for chat parsing (Generation Prompt + Content)
     * Used for if last assistant message is for prefill purpose
     */
    prefill_text?: string;
};
export type CompletionParams = Omit<NativeCompletionParams, 'emit_partial_completion' | 'prompt'> & CompletionBaseParams;
/**
 * Parameters for parallel completion requests.
 * Extends CompletionParams with parallel-mode specific options like state management.
 */
export type ParallelCompletionParams = Omit<NativeParallelCompletionParams, 'emit_partial_completion' | 'prompt'> & CompletionBaseParams;
export type BenchResult = {
    nKvMax: number;
    nBatch: number;
    nUBatch: number;
    flashAttn: number;
    isPpShared: number;
    nGpuLayers: number;
    nThreads: number;
    nThreadsBatch: number;
    pp: number;
    tg: number;
    pl: number;
    nKv: number;
    tPp: number;
    speedPp: number;
    tTg: number;
    speedTg: number;
    t: number;
    speed: number;
};
export declare class LlamaContext {
    id: number;
    gpu: boolean;
    reasonNoGPU: string;
    devices: NativeLlamaContext['devices'];
    model: NativeLlamaContext['model'];
    androidLib: NativeLlamaContext['androidLib'];
    systemInfo: NativeLlamaContext['systemInfo'];
    /**
     * Parallel processing namespace for non-blocking queue operations
     */
    parallel: {
        /**
         * Queue a completion request for parallel processing (non-blocking)
         * @param params Parallel completion parameters (includes state management)
         * @param onToken Callback fired for each generated token
         * @returns Promise resolving to object with requestId, promise (resolves to completion result), and stop function
         */
        completion: (params: ParallelCompletionParams, onToken?: ((requestId: number, data: TokenData) => void) | undefined) => Promise<{
            requestId: number;
            promise: Promise<NativeCompletionResult>;
            stop: () => Promise<void>;
        }>;
        /**
         * Queue an embedding request for parallel processing (non-blocking)
         * @param text Text to embed
         * @param params Optional embedding parameters
         * @returns Promise resolving to object with requestId and promise (resolves to embedding result)
         */
        embedding: (text: string, params?: EmbeddingParams) => Promise<{
            requestId: number;
            promise: Promise<NativeEmbeddingResult>;
        }>;
        /**
         * Queue rerank requests for parallel processing (non-blocking)
         * @param query The query text to rank documents against
         * @param documents Array of document texts to rank
         * @param params Optional reranking parameters
         * @returns Promise resolving to object with requestId and promise (resolves to rerank results)
         */
        rerank: (query: string, documents: string[], params?: RerankParams) => Promise<{
            requestId: number;
            promise: Promise<RerankResult[]>;
        }>;
        enable: (config?: {
            n_parallel?: number;
            n_batch?: number;
        }) => Promise<boolean>;
        disable: () => Promise<boolean>;
        configure: (config: {
            n_parallel?: number;
            n_batch?: number;
        }) => Promise<boolean>;
        /**
         * Get current parallel processing status (one-time snapshot)
         * @returns Promise resolving to current parallel status
         */
        getStatus: () => Promise<ParallelStatus>;
        /**
         * Subscribe to parallel processing status changes
         * @param callback Called whenever parallel status changes
         * @returns Object with remove() method to unsubscribe
         */
        subscribeToStatus: (callback: (status: ParallelStatus) => void) => Promise<{
            remove: () => void;
        }>;
    };
    constructor({ contextId, gpu, devices, reasonNoGPU, model, androidLib, systemInfo, }: NativeLlamaContext);
    loadSession(filepath: string): Promise<NativeSessionLoadResult>;
    saveSession(filepath: string, options?: {
        tokenSize: number;
    }): Promise<number>;
    isLlamaChatSupported(): boolean;
    isJinjaSupported(): boolean;
    getFormattedChat(messages: RNLlamaOAICompatibleMessage[], template?: string | null, params?: {
        jinja?: boolean;
        response_format?: CompletionResponseFormat;
        tools?: object;
        parallel_tool_calls?: object;
        tool_choice?: string;
        enable_thinking?: boolean;
        reasoning_format?: 'none' | 'auto' | 'deepseek';
        add_generation_prompt?: boolean;
        now?: string | number;
        chat_template_kwargs?: Record<string, string>;
        force_pure_content?: boolean;
    }): Promise<FormattedChatResult | JinjaFormattedChatResult>;
    completion(params: CompletionParams, callback?: (data: TokenData) => void): Promise<NativeCompletionResult>;
    stopCompletion(): Promise<void>;
    tokenize(text: string, { media_paths: mediaPaths, }?: {
        media_paths?: string[];
    }): Promise<NativeTokenizeResult>;
    detokenize(tokens: number[]): Promise<string>;
    embedding(text: string, params?: EmbeddingParams): Promise<NativeEmbeddingResult>;
    rerank(query: string, documents: string[], params?: RerankParams): Promise<RerankResult[]>;
    bench(pp: number, tg: number, pl: number, nr: number): Promise<BenchResult>;
    applyLoraAdapters(loraList: Array<{
        path: string;
        scaled?: number;
    }>): Promise<void>;
    removeLoraAdapters(): Promise<void>;
    getLoadedLoraAdapters(): Promise<Array<{
        path: string;
        scaled?: number;
    }>>;
    /**
     * Initialize multimodal support (vision/audio) with a projector model.
     * @param path - Path to the multimodal projector model file (mmproj)
     * @param use_gpu - Whether to use GPU for multimodal processing (default: true)
     * @param image_min_tokens - Minimum number of tokens for image input (for dynamic resolution models)
     * @param image_max_tokens - Maximum number of tokens for image input (for dynamic resolution models).
     *                           Lower values reduce memory usage and improve speed for high-resolution images.
     *                           Recommended: 256-512 for faster inference, up to 4096 for maximum detail.
     */
    initMultimodal({ path, use_gpu: useGpu, image_min_tokens: imageMinTokens, image_max_tokens: imageMaxTokens, }: {
        path: string;
        use_gpu?: boolean;
        image_min_tokens?: number;
        image_max_tokens?: number;
    }): Promise<boolean>;
    isMultimodalEnabled(): Promise<boolean>;
    getMultimodalSupport(): Promise<{
        vision: boolean;
        audio: boolean;
    }>;
    releaseMultimodal(): Promise<void>;
    initVocoder({ path, n_batch: nBatch, }: {
        path: string;
        n_batch?: number;
    }): Promise<boolean>;
    isVocoderEnabled(): Promise<boolean>;
    getFormattedAudioCompletion(speaker: object | null, textToSpeak: string): Promise<{
        prompt: string;
        grammar?: string;
    }>;
    getAudioCompletionGuideTokens(textToSpeak: string): Promise<Array<number>>;
    decodeAudioTokens(tokens: number[]): Promise<Array<number>>;
    releaseVocoder(): Promise<void>;
    /**
     * Clear the KV cache and reset conversation state
     * @param clearData If true, clears both metadata and tensor data buffers (slower). If false, only clears metadata (faster).
     * @returns Promise that resolves when cache is cleared
     *
     * Call this method between different conversations to prevent cache contamination.
     * Without clearing, the model may use cached context from previous conversations,
     * leading to incorrect or unexpected responses.
     *
     * For hybrid architecture models (e.g., LFM2), this is essential as they
     * use recurrent state that cannot be partially removed - only fully cleared.
     */
    clearCache(clearData?: boolean): Promise<void>;
    release(): Promise<void>;
}
export declare function toggleNativeLog(enabled: boolean): Promise<void>;
export declare function addNativeLogListener(listener: (level: string, text: string) => void): {
    remove: () => void;
};
export declare function setContextLimit(limit: number): Promise<void>;
export declare function loadLlamaModelInfo(model: string): Promise<Object>;
export declare function getBackendDevicesInfo(): Promise<Array<NativeBackendDeviceInfo>>;
export declare function initLlama({ model, is_model_asset: isModelAsset, pooling_type: poolingType, lora, lora_list: loraList, devices, ...rest }: ContextParams, onProgress?: (progress: number) => void): Promise<LlamaContext>;
export declare function releaseAllLlama(): Promise<void>;
export declare const BuildInfo: {
    number: string;
    commit: string;
};
//# sourceMappingURL=index.d.ts.map