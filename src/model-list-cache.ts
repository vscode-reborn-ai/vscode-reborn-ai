import * as crypto from 'crypto';
import ky from 'ky';
import { ExtensionContext, SecretStorage } from "vscode";
import { Model, Role } from "./renderer/types";

// All data cached with this class, is stored in the SecretStorage with this key
const CACHE_STORAGE_KEY = 'chatgpt_reborn_model_cache';
// Special Featherless endpoint for fetching detailed model data
const FEATHERLESS_DETAILED_MODEL_ENDPOINT = 'https://api.featherless.ai/feather/models';

/*

* Caching Strategies:
- default: 1 day

* How caching works for localhost APIs:
- ideally ~10 seconds is passed in for localhost APIs
- Note: not sure how common local proxies for cloud APIs are, could be problematic

* How caching works for most cloud APIs:
- the 1 day default should be fine

* How caching works for Featherless API:
- Basic model data (id, name) - the 1 day default should be fine
- Detailed model data (favs, downloads, status) - ignores argument, uses 1 week for detailed data
- Model readme - fetched on demand (it's not included in detailed model data)

*/

interface CacheEntry {
  modelList: Model[];
  lastUpdated: number;
  featherless?: {
    detailedFetchTimestamp: number;
  };
}

/* Don't confuse the key below with the CACHE_STORAGE_KEY
   The API URL + hashed API key is used as the cache key
   This allows us to cache models across different APIs and keys */
interface CacheStorage {
  [key: string]: CacheEntry;
}


export class ModelCache {
  private static _instance: ModelCache;
  private cache: CacheStorage = {};
  private modelList: Model[] = [];
  private apiUrl: string = '';
  private apiKey: string = '';

  // Default cache duration is set to 1 day (86,400,000 ms)
  constructor(private secretStorage: SecretStorage, private defaultCacheDuration: number = 86400000) { }

  // Singleton pattern to ensure only one instance is used
  static init(context: ExtensionContext, defaultCacheDuration?: number): ModelCache {
    if (!ModelCache._instance) {
      ModelCache._instance = new ModelCache(context.secrets, defaultCacheDuration);
    }
    return ModelCache._instance;
  }

  private isFeatherless(apiUrl: string = this.apiUrl): boolean {
    return apiUrl.includes('api.featherless.ai');
  }

  // Generates a unique cache key using the API URL and a hash of the API key
  private generateCacheKey(apiUrl: string, apiKey: string): string {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    return `${apiUrl}_${hash}`;
  }

  // Retrieves models from the cache or fetches them if not available or expired
  async getModels(apiUrl: string, apiKey: string, cacheDuration?: number): Promise<Model[]> {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.cache = await this.getCacheData();
    // The key to the data for this API URL and API key combination
    const cacheKey = this.generateCacheKey(apiUrl, apiKey);
    // Cached model list + caching metadata
    this.cache[cacheKey] = this.cache[cacheKey] ?? {
      modelList: [],
      lastUpdated: 0
    };

    // Fetch model list and update cache if necessary
    // fetchModels() determines if the cache is expired
    this.cache[cacheKey] = await this.fetchModels(apiUrl, apiKey, this.cache[cacheKey], cacheDuration ?? this.defaultCacheDuration);

    // Store the updated cache
    await this.secretStorage.store(CACHE_STORAGE_KEY, JSON.stringify(this.cache));

    this.modelList = this.cache[cacheKey].modelList;

    // Return the model list
    return this.modelList;
  }

  // lastUpdated timestamp is optional - this is more for full model list pulls
  // To avoid messing with full list caching, do not update the timestamp for individual model updates
  async updateCache(lastUpdated?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(this.apiUrl, this.apiKey);

    this.cache[cacheKey] = {
      ...this.cache[cacheKey],
      modelList: this.modelList,
    };

    // Update timestamp (optional)
    if (lastUpdated) {
      this.cache[cacheKey].lastUpdated = lastUpdated;
    }

    // Store the updated cache
    await this.secretStorage.store(CACHE_STORAGE_KEY, JSON.stringify(this.cache));
  }

  // Get string data from the cache, parse it, and return as JS object
  // TODO: object validation
  private async getCacheData(): Promise<CacheStorage> {
    const cacheStringData = await this.secretStorage.get(CACHE_STORAGE_KEY);
    let cacheObject: CacheStorage = {};

    if (cacheStringData) {
      try {
        cacheObject = JSON.parse(cacheStringData);
      } catch (e) {
        console.error("[Reborn AI] Error parsing model cache:", e);
      }
    }

    return this.cache = cacheObject;
  }

  // New function to fetch detailed models with pagination support
  private async fetchFeatherlessDetailedModelList(cacheEntry: CacheEntry): Promise<CacheEntry> {
    const detailedModels: Model[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const startTime = Date.now();
      try {
        const result = await ky.get(FEATHERLESS_DETAILED_MODEL_ENDPOINT, {
          searchParams: {
            page: currentPage.toString(),
            per_page: '50',
          },
        }).json() as {
          items: {
            id: string;
            created_at: string;
            updated_at: string;
            name: string;
            owned_by: string;
            model_class: string;
            favorites: number;
            downloads: number;
            status: string;
            health: string;
          }[];
          pagination: {
            current_page: number;
            per_page: number;
            total_items: number;
            total_pages: number;
          };
        };

        for (const item of result.items) {
          detailedModels.push({
            id: item.id,
            name: item.name,
            created: Date.parse(item.created_at),
            object: "model",
            owned_by: item.owned_by as Role,
            featherless: {
              favorites: item.favorites,
              downloads: item.downloads,
              status: item.status,
              health: item.health,
            },
          });
        }

        totalPages = result.pagination.total_pages;
      } catch (error) {
        console.error(`[Reborn AI] Error fetching detailed models on page ${currentPage}:`, error);
        throw error;
      }

      currentPage++;
      // Add a delay to avoid hitting the API too quickly
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 200) {
        await new Promise(resolve => setTimeout(resolve, 200 - elapsedTime));
      }
    } while (currentPage <= totalPages);

    cacheEntry.modelList = this.mergeModelLists(cacheEntry.modelList, detailedModels);
    cacheEntry.lastUpdated = Date.now();
    cacheEntry.featherless = {
      ...cacheEntry.featherless,
      detailedFetchTimestamp: Date.now(),
    };

    return cacheEntry;
  }

  // New function to fetch individual model details
  private async fetchFeatherlessModel(modelId: string): Promise<Model> {
    const encodedModelId = encodeURIComponent(modelId);
    const url = `${FEATHERLESS_DETAILED_MODEL_ENDPOINT}/${encodedModelId}`;

    try {
      const item = await ky.get(url, {
        headers: {
          "HTTP-Referer": "https://github.com/vscode-reborn-ai/vscode-reborn-ai",
          "X-Title": "VSCode Reborn AI",
        }
      }).json() as {
        id: string;
        created_at: string;
        updated_at: string;
        name: string;
        owned_by: string;
        model_class: string;
        favorites: number;
        downloads: number;
        status: string;
        health: string;
        readme: string;
      };

      return {
        id: item.id,
        name: item.name,
        created: Date.parse(item.created_at),
        object: "model",
        owned_by: item.owned_by as Role,
        featherless: {
          favorites: item.favorites,
          downloads: item.downloads,
          status: item.status,
          health: item.health,
          readme: item.readme,
        },
      };
    } catch (error) {
      console.error(`[Reborn AI] Error fetching detailed model ${modelId}:`, error);
      throw error;
    }
  }

  // Get detailed data about a model
  // This is needed with Featherless to fetch the model description ("readme")
  public async getDetailedModelData(modelId: string): Promise<Model> {
    // Check if a model list is available
    if (!this.modelList || this.modelList.length === 0) {
      throw new Error("[Reborn AI] Model Cache - getDetailedModelData() - Model list is empty.");
    }

    let model = this.modelList.find(m => m.id === modelId);

    // Check if the model is found in the list
    if (!model) {
      throw new Error(`[Reborn AI] Model Cache - getDetailedModelData() - Model with ID ${modelId} not found.`);
    }

    // * Fetch extra data for certain APIs
    // For now, this is only Featherless—no need to re-fetch from OpenAI-compatible APIs
    // OpenRouter sends extra data within the OpenAI-compatible API response
    if (this.isFeatherless() && !model.featherless?.readme) {
      // Featherless has a separate API with their own special data
      model = await this.fetchFeatherlessModel(modelId);

      // Update the model list with the updated model
      this.modelList = this.modelList.map(m => m.id === modelId ? model as Model : m);

      // Update cache with the updated model list
      this.updateCache();
    }

    return model;
  }

  private mergeModelLists(oldModelData: Model[], newModelData: Model[]): Model[] {
    const modelMap = new Map<string, Model>();

    for (const model of oldModelData) {
      modelMap.set(model.id, model);
    }

    let updatedModelsCount = 0;
    let newModelsCount = 0;

    for (const model of newModelData) {
      const existingModel = modelMap.get(model.id);

      if (existingModel) {
        // Model found
        // This will preserve existing properties while updating with new ones
        Object.assign(existingModel, {
          ...existingModel,
          ...model,
        });
        updatedModelsCount++;
      } else {
        // New model
        modelMap.set(model.id, model);
        newModelsCount++;
      }
    }

    console.log(`[Reborn AI] Merged models: ${updatedModelsCount} updated, ${newModelsCount} new.`);

    return Array.from(modelMap.values());
  }

  private async fetchModels(apiUrl: string, apiKey: string, cacheEntry: CacheEntry | undefined, cacheDuration: number): Promise<CacheEntry> {
    let modelListResult: { object: string; data: Model[]; };
    cacheEntry = {
      // Defaults
      modelList: [],
      lastUpdated: 0,
      // Populate with existing data if available
      ...cacheEntry,
    };

    const now = Date.now();
    const cacheExpired = now - cacheEntry.lastUpdated > cacheDuration;
    // If the cache is expired, fetch new models
    if (cacheExpired) {
      console.log("[Reborn AI] Fetching basic models from API... cache expired:", now - cacheEntry.lastUpdated, ">", cacheDuration);
      try {
        modelListResult = await ky.get(apiUrl, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://github.com/vscode-reborn-ai/vscode-reborn-ai",
            "X-Title": "VSCode Reborn AI",
          },
          hooks: {
            afterResponse: [
              async (_input, _options, response) => {
                switch (response.status) {
                  case 401:
                    throw new Error("Missing API key");
                  case 404:
                    throw new Error("Model endpoint not found");
                  default:
                    return response;
                }
              },
            ],
          },
        }).json();

        cacheEntry.lastUpdated = Date.now();
        cacheEntry.modelList = this.mergeModelLists(cacheEntry.modelList, modelListResult.data);
      } catch (error) {
        console.error("[Reborn AI] Error fetching models:", error);
        throw error;
      }
    } else {
      console.log("[Reborn AI] Using cached models.");
    }

    // * Completely separate - fetching Featherless AI's detailed models
    // This requires ~50 requests to get all models, so only running once a week
    if (this.isFeatherless(apiUrl)) {
      const oneWeekMs = 7 * 24 * 3600 * 1000;

      if (cacheEntry.featherless) {
        const detailedFetchTimestamp = cacheEntry.featherless.detailedFetchTimestamp;
        const detailedDataExpired = Date.now() - detailedFetchTimestamp > oneWeekMs;

        if (detailedDataExpired) {
          console.log('[Reborn AI] Detailed data is older than 1 week, fetching new detailed data.');

          // Detailed data is older than 1 week, fetch new detailed data
          cacheEntry = await this.fetchFeatherlessDetailedModelList(cacheEntry);

          console.log('[Reborn AI] Successfully fetched and cached updated Featherless models.');
          return cacheEntry;
        } else {
          console.log('[Reborn AI] Checking for models missing detailed data.');

          // Check for models missing detailed data
          // { status } for example, is only available from the detailed data endpoint
          const FEATHERLESS_DATA_PROP_TO_TEST = 'status';
          const modelsMissingDetail = cacheEntry.modelList.filter(model => !model.featherless?.[FEATHERLESS_DATA_PROP_TO_TEST]);

          if (modelsMissingDetail.length > 0) {
            // There are models missing detailed data
            console.log(`[Reborn AI] Found ${modelsMissingDetail.length} models missing detailed data.`);
            if (modelsMissingDetail.length > 40) {
              // More than 40 models are missing detailed data, fetch all detailed models
              console.log('[Reborn AI] Fetching detailed data for all models due to high count.');

              // Fetch detailed data for all models
              cacheEntry = await this.fetchFeatherlessDetailedModelList(cacheEntry);

              console.log('[Reborn AI] Fetched and cached detailed Featherless models for missing data.');
              return cacheEntry;
            } else {
              // Less than 40 models are missing detailed data, fetch models individually
              console.log('[Reborn AI] Fetching detailed data for individual models.');
              for (const model of modelsMissingDetail) {
                // Fetch models individually
                const detailedModel = await this.fetchFeatherlessModel(model.id);
                const index = cacheEntry.modelList.findIndex(m => m.id === model.id);

                if (index !== -1) {
                  cacheEntry.modelList[index] = detailedModel;
                }
              }

              console.log('[Reborn AI] Fetched and cached individual Featherless models for missing data.');
              return cacheEntry;
            }
          } else {
            // All models have detailed data
            console.log('[Reborn AI] Using cached Featherless models with detailed data.');
            return cacheEntry;
          }
        }
      } else {
        console.log('[Reborn AI] No featherless data in cache, fetching detailed data. Featherless:', cacheEntry?.featherless);

        // No featherless data in cache, fetch detailed data
        cacheEntry = await this.fetchFeatherlessDetailedModelList(cacheEntry);

        console.log('[Reborn AI] Fetched and cached Featherless models with detailed data.');
        return cacheEntry;
      }
    }

    return cacheEntry;
  }
}
