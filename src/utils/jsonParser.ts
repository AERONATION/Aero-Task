import { ChecklistItem } from '@/types/task';

/**
 * Generates a unique ID for checklist items
 */
function generateId(): string {
  return 'chk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Normalizes HTTP methods to uppercase standard verbs
 */
function normalizeMethod(method?: string): string {
  if (!method) return 'GET';
  const upper = method.trim().toUpperCase();
  return upper || 'GET';
}

/**
 * Recursively extracts items from a Postman collection
 */
function extractPostmanItems(items: any[], result: ChecklistItem[] = []): ChecklistItem[] {
  if (!Array.isArray(items)) return result;

  for (const item of items) {
    if (item.item && Array.isArray(item.item)) {
      // It's a folder in postman, recurse
      extractPostmanItems(item.item, result);
    } else if (item.request) {
      const method = normalizeMethod(
        typeof item.request === 'string' ? 'GET' : item.request.method || 'GET'
      );
      
      let endpoint = '';
      if (typeof item.request === 'string') {
        endpoint = item.request;
      } else if (typeof item.request.url === 'string') {
        endpoint = item.request.url;
      } else if (item.request.url && item.request.url.raw) {
        endpoint = item.request.url.raw;
      } else if (item.request.url && Array.isArray(item.request.url.path)) {
        endpoint = '/' + item.request.url.path.join('/');
      }

      const title = item.name || `${method} ${endpoint}` || 'API Endpoint';
      const description = typeof item.request?.description === 'string'
        ? item.request.description
        : item.request?.description?.content || '';

      result.push({
        id: generateId(),
        title: title || 'API Endpoint',
        method,
        endpoint: endpoint || '',
        description: description || '',
        completed: false,
        completedBy: null,
        completedByName: null,
        completedAt: null,
      });
    } else if (item.name) {
      result.push({
        id: generateId(),
        title: item.name || 'Checklist Item',
        method: 'GET',
        endpoint: '',
        description: '',
        completed: false,
        completedBy: null,
        completedByName: null,
        completedAt: null,
      });
    }
  }

  return result;
}

/**
 * Extracts items from OpenAPI / Swagger definitions
 */
function extractOpenApiPaths(paths: Record<string, any>): ChecklistItem[] {
  const result: ChecklistItem[] = [];
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

  for (const [pathKey, pathObj] of Object.entries(paths)) {
    if (!pathObj || typeof pathObj !== 'object') continue;

    for (const [methodKey, opObj] of Object.entries(pathObj)) {
      const methodLower = methodKey.toLowerCase();
      if (httpMethods.includes(methodLower) && opObj && typeof opObj === 'object') {
        const method = methodLower.toUpperCase();
        const summary = (opObj as any).summary || (opObj as any).operationId || `${method} ${pathKey}`;
        const description = (opObj as any).description || '';

        result.push({
          id: generateId(),
          title: summary,
          method,
          endpoint: pathKey || '',
          description,
          completed: false,
          completedBy: null,
          completedByName: null,
          completedAt: null,
        });
      }
    }
  }

  return result;
}

/**
 * Main parser function that takes raw JSON string or parsed object and returns clean ChecklistItem[]
 */
export function parseApiJson(input: string | object): ChecklistItem[] {
  let parsed: any;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (err: any) {
      throw new Error(`Invalid JSON format: ${err.message}`);
    }
  } else {
    parsed = input;
  }

  if (!parsed) {
    return [];
  }

  let rawChecklist: ChecklistItem[] = [];

  // Case 1: Postman Collection
  if (parsed.item && Array.isArray(parsed.item)) {
    rawChecklist = extractPostmanItems(parsed.item);
  }
  // Case 2: OpenAPI / Swagger
  else if (parsed.paths && typeof parsed.paths === 'object') {
    rawChecklist = extractOpenApiPaths(parsed.paths);
  }
  // Case 3: Wrapped array or raw array
  else {
    let itemsArray = Array.isArray(parsed) ? parsed : null;
    if (!itemsArray) {
      for (const key of ['apis', 'endpoints', 'tasks', 'checklist', 'todos', 'routes', 'items', 'data']) {
        if (Array.isArray(parsed[key])) {
          itemsArray = parsed[key];
          break;
        }
      }
    }

    if (itemsArray && Array.isArray(itemsArray)) {
      for (const item of itemsArray) {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          const methodMatch = trimmed.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(.+)$/i);
          if (methodMatch) {
            rawChecklist.push({
              id: generateId(),
              title: trimmed,
              method: methodMatch[1].toUpperCase(),
              endpoint: methodMatch[2].split(/\s+-\s+|\s+/)[0] || '',
              description: '',
              completed: false,
              completedBy: null,
              completedByName: null,
              completedAt: null,
            });
          } else {
            rawChecklist.push({
              id: generateId(),
              title: trimmed,
              method: 'GET',
              endpoint: '',
              description: '',
              completed: false,
              completedBy: null,
              completedByName: null,
              completedAt: null,
            });
          }
        } else if (typeof item === 'object' && item !== null) {
          const method = normalizeMethod(item.method || item.httpMethod || item.type);
          const endpoint = item.endpoint || item.url || item.path || item.uri || item.route || '';
          const title =
            item.title ||
            item.name ||
            item.summary ||
            (method && endpoint ? `${method} ${endpoint}` : endpoint || 'API Endpoint');
          const description = item.description || item.details || item.desc || '';
          const completed = Boolean(item.completed || item.done || item.status === 'completed');

          rawChecklist.push({
            id: item.id || generateId(),
            title: String(title),
            method,
            endpoint: String(endpoint),
            description: String(description),
            completed,
            completedBy: item.completedBy || null,
            completedByName: item.completedByName || null,
            completedAt: item.completedAt || null,
          });
        }
      }
    } else {
      throw new Error('Unsupported JSON structure. Please upload an array of API endpoints, a Postman collection, or OpenAPI JSON.');
    }
  }

  // Ensure every item is strictly sanitized with non-undefined fields
  return rawChecklist.map((item) => ({
    id: item.id || generateId(),
    title: item.title || 'Endpoint',
    method: item.method || 'GET',
    endpoint: item.endpoint || '',
    description: item.description || '',
    completed: Boolean(item.completed),
    completedBy: item.completedBy || null,
    completedByName: item.completedByName || null,
    completedAt: item.completedAt || null,
  }));
}

/**
 * Returns sample JSON template for API testing checklist
 */
export function generateSampleApiJson(): string {
  const sample = [
    {
      method: "POST",
      endpoint: "/api/v1/auth/login",
      title: "User Authentication / Login",
      description: "Verify JWT token generation with valid email & password credentials."
    },
    {
      method: "GET",
      endpoint: "/api/v1/auth/me",
      title: "Fetch Current User Profile",
      description: "Ensure Bearer authorization header returns profile and roles."
    },
    {
      method: "GET",
      endpoint: "/api/v1/tasks",
      title: "List Workspace Tasks",
      description: "Test pagination, team filtering, and assigned user filters."
    },
    {
      method: "POST",
      endpoint: "/api/v1/tasks/create",
      title: "Create New Task",
      description: "Validate required payload fields (title, deadline, assignees)."
    },
    {
      method: "PUT",
      endpoint: "/api/v1/tasks/:id/status",
      title: "Update Task Progression Status",
      description: "Verify state transition from 'todo' to 'in_progress' and 'completed'."
    },
    {
      method: "DELETE",
      endpoint: "/api/v1/tasks/:id",
      title: "Delete Task Endpoint",
      description: "Ensure authorization check prevents unauthorized deletions."
    }
  ];

  return JSON.stringify(sample, null, 2);
}

/**
 * Triggers browser download for sample API checklist JSON
 */
export function downloadSampleApiJson(): void {
  const content = generateSampleApiJson();
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'api-endpoints-sample.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
