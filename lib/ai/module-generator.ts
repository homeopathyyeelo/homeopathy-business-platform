/**
 * AI-Powered Module Generator
 * Automatically generates complete CRUD pages and API endpoints for any module
 * Uses OpenAI to understand business logic and generate production-ready code
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModuleSpec {
  name: string;
  displayName: string;
  description: string;
  fields: FieldSpec[];
  relations?: RelationSpec[];
  features?: string[];
}

interface FieldSpec {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'enum';
  required?: boolean;
  unique?: boolean;
  enumValues?: string[];
  validation?: string;
}

interface RelationSpec {
  table: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey?: string;
}

/**
 * Generate complete module using AI
 * Creates: Frontend page, API routes, Go handlers, database migrations
 */
export async function generateModule(spec: ModuleSpec): Promise<{
  frontendPage: string;
  apiRoute: string;
  goHandler: string;
  migration: string;
}> {
  const prompt = `You are an expert full-stack developer building a Homeopathy ERP system.

Generate production-ready code for this module:

Module: ${spec.displayName}
Description: ${spec.description}
Fields: ${JSON.stringify(spec.fields, null, 2)}
Relations: ${JSON.stringify(spec.relations || [], null, 2)}
Features: ${spec.features?.join(', ') || 'Standard CRUD'}

Technology Stack:
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend API: Next.js API routes (TypeScript)
- Go API: Gin framework, PostgreSQL with GORM
- Database: PostgreSQL

Generate the following files:

1. **Frontend Page** (app/${spec.name}/page.tsx):
   - Complete CRUD interface with shadcn/ui components
   - Data table with sorting, filtering, pagination
   - Form with validation using react-hook-form + zod
   - Real-time updates with React Query
   - Professional UI with proper error handling

2. **Next.js API Route** (app/api/${spec.name}/route.ts):
   - GET (list with filters, pagination)
   - POST (create)
   - PUT (update)
   - DELETE
   - Proper error handling and validation

3. **Go Handler** (services/api-golang-master/internal/handlers/${spec.name}_handler.go):
   - Complete CRUD handlers
   - PostgreSQL queries with GORM
   - Input validation
   - Error handling
   - Pagination and filters

4. **Database Migration** (SQL):
   - CREATE TABLE statement
   - Indexes for performance
   - Foreign key constraints
   - Timestamps (created_at, updated_at)

Return ONLY valid code for each file. Separate files with:
--- FILE: <filename> ---

Make the code production-ready, type-safe, and following best practices.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert full-stack developer. Generate production-ready, type-safe code with proper error handling.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: 8000,
  });

  const response = completion.choices[0]?.message?.content || '';
  
  // Parse generated files
  const files = parseGeneratedFiles(response);

  return {
    frontendPage: files['page.tsx'] || '',
    apiRoute: files['route.ts'] || '',
    goHandler: files['_handler.go'] || '',
    migration: files['.sql'] || '',
  };
}

/**
 * Parse AI-generated code into separate files
 */
function parseGeneratedFiles(response: string): Record<string, string> {
  const files: Record<string, string> = {};
  const filePattern = /---\s*FILE:\s*(.+?)\s*---\n([\s\S]+?)(?=---\s*FILE:|$)/g;
  
  let match;
  while ((match = filePattern.exec(response)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();
    files[filename] = content;
  }

  return files;
}

/**
 * Generate all modules from menu structure
 */
export async function generateAllModules(menuStructure: any[]): Promise<void> {
  console.log('🤖 Starting AI-powered module generation...');
  
  for (const menu of menuStructure) {
    if (menu.children) {
      for (const item of menu.children) {
        console.log(`\n📦 Generating module: ${item.label}`);
        
        // Infer module spec from menu item
        const spec = inferModuleSpec(item);
        
        try {
          const generated = await generateModule(spec);
          
          // Save generated files
          await saveGeneratedFiles(spec.name, generated);
          
          console.log(`✅ Successfully generated ${item.label}`);
        } catch (error) {
          console.error(`❌ Failed to generate ${item.label}:`, error);
        }
        
        // Rate limiting - wait 2 seconds between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('\n🎉 Module generation complete!');
}

/**
 * Infer module specification from menu item
 */
function inferModuleSpec(menuItem: any): ModuleSpec {
  const name = menuItem.href?.replace('/', '') || menuItem.label.toLowerCase().replace(/\s+/g, '-');
  
  // Common field patterns based on module name
  const commonFields: Record<string, FieldSpec[]> = {
    customer: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', unique: true },
      { name: 'phone', type: 'string' },
      { name: 'address', type: 'string' },
      { name: 'gstin', type: 'string' },
      { name: 'type', type: 'enum', enumValues: ['retail', 'wholesale'] },
    ],
    vendor: [
      { name: 'name', type: 'string', required: true },
      { name: 'company_name', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'phone', type: 'string', required: true },
      { name: 'address', type: 'string' },
      { name: 'gstin', type: 'string' },
      { name: 'payment_terms', type: 'number' },
    ],
  };

  const fields = commonFields[name] || [
    { name: 'name', type: 'string', required: true },
    { name: 'description', type: 'string' },
    { name: 'is_active', type: 'boolean' },
  ];

  return {
    name,
    displayName: menuItem.label,
    description: menuItem.description || `Manage ${menuItem.label} in the system`,
    fields,
    features: ['CRUD', 'Search', 'Filter', 'Export'],
  };
}

/**
 * Save generated files to disk
 */
async function saveGeneratedFiles(moduleName: string, files: any): Promise<void> {
  const baseDir = process.cwd();
  
  // Save frontend page
  if (files.frontendPage) {
    const pagePath = path.join(baseDir, 'app', moduleName, 'page.tsx');
    await fs.promises.mkdir(path.dirname(pagePath), { recursive: true });
    await fs.promises.writeFile(pagePath, files.frontendPage);
  }
  
  // Save API route
  if (files.apiRoute) {
    const apiPath = path.join(baseDir, 'app', 'api', moduleName, 'route.ts');
    await fs.promises.mkdir(path.dirname(apiPath), { recursive: true });
    await fs.promises.writeFile(apiPath, files.apiRoute);
  }
  
  // Save Go handler
  if (files.goHandler) {
    const goPath = path.join(baseDir, 'services', 'api-golang-master', 'internal', 'handlers', `${moduleName}_handler.go`);
    await fs.promises.mkdir(path.dirname(goPath), { recursive: true });
    await fs.promises.writeFile(goPath, files.goHandler);
  }
  
  // Save migration
  if (files.migration) {
    const migrationPath = path.join(baseDir, 'migrations', `${Date.now()}_create_${moduleName}.sql`);
    await fs.promises.mkdir(path.dirname(migrationPath), { recursive: true });
    await fs.promises.writeFile(migrationPath, files.migration);
  }
}

/**
 * Example: Generate a simple module
 */
export async function generateExampleModule() {
  const spec: ModuleSpec = {
    name: 'vendors',
    displayName: 'Vendors',
    description: 'Manage supplier vendors for purchase orders',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'company_name', type: 'string' },
      { name: 'email', type: 'string', unique: true },
      { name: 'phone', type: 'string', required: true },
      { name: 'address', type: 'string' },
      { name: 'gstin', type: 'string' },
      { name: 'payment_terms', type: 'number' },
      { name: 'credit_limit', type: 'number' },
      { name: 'is_active', type: 'boolean' },
    ],
    features: ['CRUD', 'Search', 'Filter', 'Export', 'Payment History'],
  };

  const result = await generateModule(spec);
  console.log('Generated files:', Object.keys(result));
  return result;
}
