import { AnyProcedure, AnyRouter, ProcedureRecord } from '@trpc/server';
import { z } from 'zod';

// RouteInfo defines the structure of each route's data.
interface RouteInfo {
  path: string;
  input?: z.ZodTypeAny;
  output?: z.ZodTypeAny;
}

// ExtractedRouter contains the route map for easy lookup.
interface ExtractedRouter {
  routeMap: Record<string, RouteInfo>;
}

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routeMap: Record<string, RouteInfo> = {};  // The route map to be returned.

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    const procedures = currentRouter._def.procedures as ProcedureRecord;  // Extracting procedures.
    const record = currentRouter._def.record as Record<string, AnyRouter | AnyProcedure>;  // Nested routers/procedures.

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures)) {
      const path = `${prefix}${key}`;  // Create the full route path.
      const input = procedure._def.inputs?.[0] as z.ZodTypeAny || null;  // Input schema or null.
      const output = procedure._def.output as z.ZodTypeAny || null;  // Output schema or null.

      // Add the route to the map.
      routeMap[path] = { path, input, output };
    }

    // Recursively handle any nested routers.
    for (const [key, nestedRouter] of Object.entries(record)) {
      if ('router' in nestedRouter) {
        extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`);  // Traverse into nested routers.
      }
    }
  }

  // Start the extraction from the root router.
  extractRoutes(router);

  return { routeMap };
}

// Function to generate the route data as a JSON string in the 'map' format.
export function generateJSON<TRouter extends AnyRouter>(router: TRouter): string {
  const extracted = extractRouter(router);  // Extract routes.

  return JSON.stringify(extracted.routeMap, (key, value) => {
    // Handle ZodType instances, formatting them with `describe`.
    if (value instanceof z.ZodType) {
      return {
        type: 'zod',
        schema: value.describe(key),  // Use Zod's describe method for better clarity.
      };
    }
    return value;  // Return non-Zod values as-is.
  }, 2);  // Pretty-print the JSON with 2 spaces of indentation.
}
