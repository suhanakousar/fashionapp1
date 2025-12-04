// Bytez SDK client wrapper
// REVIEW REQUIRED: API key management and rate limiting

/**
 * Bytez SDK wrapper for model inference
 * Uses Bytez API directly (SDK pattern similar to what user requested)
 */

const BYTEZ_API_URL = "https://api.bytez.com/v1";
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;

interface BytezModel {
  run(payload: any): Promise<{ error?: string; output?: string | string[] | { url?: string } }>;
}

class BytezSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || BYTEZ_API_KEY || "";
    this.baseUrl = BYTEZ_API_URL;
    
    if (!this.apiKey) {
      console.warn("BYTEZ_API_KEY not configured. Bytez model calls will fail.");
    }
  }

  model(modelId: string): BytezModel {
    return {
      run: async (payload: any) => {
        if (!this.apiKey) {
          throw new Error("BYTEZ_API_KEY not configured");
        }

        try {
          const response = await fetch(`${this.baseUrl}/models/${modelId}/predict`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: payload }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bytez API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          
          // Handle different response formats
          if (data.error) {
            return { error: data.error };
          }
          
          // Output might be in different formats
          const output = data.output || data.result || data;
          
          return { output };
        } catch (error: any) {
          console.error(`Bytez model ${modelId} error:`, error);
          return { error: error.message || "Unknown error" };
        }
      },
    };
  }
}

// Export singleton instance
const sdk = new BytezSDK();
export default sdk;

// Also export class for testing
export { BytezSDK };

