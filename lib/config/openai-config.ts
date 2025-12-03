/**
 * OpenAI Configuration
 * Reads API key from database (app_settings) or environment variable
 */

import { golangAPI } from '@/lib/api';

let cachedApiKey: string | null = null;

/**
 * Get OpenAI API Key from database or environment
 */
export async function getOpenAIApiKey(): Promise<string> {
  // Return cached key if available
  if (cachedApiKey) {
    return cachedApiKey;
  }

  try {
    // Try to get from database first
    const response = await golangAPI.get('/api/erp/settings/ai.openai.apiKey');
    
    if (response.data?.success && response.data.data?.value) {
      let apiKey = response.data.data.value;
      
      // Parse JSON value if it's a string
      if (typeof apiKey === 'string') {
        try {
          apiKey = JSON.parse(apiKey);
        } catch {
          // Already a plain string
        }
      }
      
      cachedApiKey = apiKey;
      return apiKey;
    }
  } catch (error) {
    console.warn('Failed to load OpenAI key from database:', error);
  }

  throw new Error('OpenAI API key not found. Please configure it via: 1) System environment variable OPENAI_API_KEY, or 2) Database app_settings table');
}

/**
 * Get OpenAI Model from database or use default
 */
export async function getOpenAIModel(): Promise<string> {
  try {
    const response = await golangAPI.get('/api/erp/settings/ai.openai.model');
    
    if (response.data?.success && response.data.data?.value) {
      let model = response.data.data.value;
      
      // Parse JSON value
      if (typeof model === 'string') {
        try {
          model = JSON.parse(model);
        } catch {
          // Already a plain string
        }
      }
      
      return model;
    }
  } catch (error) {
    console.warn('Failed to load OpenAI model from database, using default');
  }

  return 'gpt-4o-mini'; // Default model
}

/**
 * Get OpenAI Project Name from database or environment
 */
export async function getOpenAIProjectName(): Promise<string> {
  try {
    const response = await golangAPI.get('/api/erp/settings/ai.openai.projectName');
    
    if (response.data?.success && response.data.data?.value) {
      let projectName = response.data.data.value;
      
      // Parse JSON value
      if (typeof projectName === 'string') {
        try {
          projectName = JSON.parse(projectName);
        } catch {
          // Already a plain string
        }
      }
      
      return projectName;
    }
  } catch (error) {
    console.warn('Failed to load OpenAI project name from database');
  }

  // Fallback to environment variable
  const envName = process.env.OPENAI_PROJECT_NAME || process.env.NEXT_PUBLIC_OPENAI_PROJECT_NAME;
  
  if (envName) {
    return envName;
  }

  return 'YeeloHomeopathy'; // Default
}

/**
 * Get OpenAI Project ID from database or environment
 */
export async function getOpenAIProjectID(): Promise<string> {
  try {
    const response = await golangAPI.get('/api/erp/settings/ai.openai.projectId');
    
    if (response.data?.success && response.data.data?.value) {
      let projectID = response.data.data.value;
      
      // Parse JSON value
      if (typeof projectID === 'string') {
        try {
          projectID = JSON.parse(projectID);
        } catch {
          // Already a plain string
        }
      }
      
      return projectID;
    }
  } catch (error) {
    console.warn('Failed to load OpenAI project ID from database');
  }

  // Fallback to environment variable
  const envID = process.env.OPENAI_PROJECT_ID || process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID;
  
  if (envID) {
    return envID;
  }

  return ''; // No default
}

/**
 * Check if AI features are enabled
 */
export async function isAIEnabled(): Promise<boolean> {
  try {
    const response = await golangAPI.get('/api/erp/settings/ai.enabled');
    
    if (response.data?.success && response.data.data?.value !== undefined) {
      let enabled = response.data.data.value;
      
      // Parse JSON value
      if (typeof enabled === 'string') {
        try {
          enabled = JSON.parse(enabled);
        } catch {
          enabled = enabled === 'true';
        }
      }
      
      return !!enabled;
    }
  } catch (error) {
    console.warn('Failed to check if AI is enabled, defaulting to true');
  }

  return true; // Default to enabled
}

/**
 * Get complete OpenAI configuration
 */
export async function getOpenAIConfig() {
  const [apiKey, model, enabled, projectName, projectID] = await Promise.all([
    getOpenAIApiKey(),
    getOpenAIModel(),
    isAIEnabled(),
    getOpenAIProjectName(),
    getOpenAIProjectID()
  ]);

  return {
    apiKey,
    model,
    enabled,
    projectName,
    projectID
  };
}

/**
 * Clear cached API key (useful when key is updated)
 */
export function clearOpenAICache() {
  cachedApiKey = null;
}
