// import { AnyProcedure, AnyRouter, ProcedureRecord } from '@trpc/server';
// import { zodToJsonSchema } from 'zod-to-json-schema';
// import { z } from 'zod';

// // RouteInfo defines the structure of each route's data.
// interface RouteInfo {
//   path: string;
//   type: 'query' | 'mutation';
//   input?: z.ZodTypeAny;
//   output?: z.ZodTypeAny;
// }

// // ExtractedRouter contains the route map for easy lookup.
// interface ExtractedRouter {
//   routeMap: Record<string, RouteInfo>;
//   definitions: Record<string, any>;
// }

// // Utility function to check if an object is a TRPC router
// function isRouter(obj: any): obj is AnyRouter {
//   return obj && obj._def && obj._def.procedures !== undefined;
// }


// // Function to extract routes from a TRPC router.
// export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
//   const routeMap: Record<string, RouteInfo> = {};  // The route map to be returned.
//   const definitions: Record<string, any> = {};

//   // Extracting definitions from the router.
//   function getSchemaDefinition(zodType: z.ZodTypeAny, name: string) : any {
//       if (definitions[name]) {
//         return { "$ref": `#/definitions/${name}` }; // Reference existing definition
//       }
//       const schema = zodToJsonSchema(zodType); // Convert Zod type to JSON schema
//       definitions[name] = schema; // Store the definition
//       return schema;
//   }
  
//   // Recursive helper function to traverse routers and extract route information.
//   function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
//     const procedures = currentRouter._def.procedures as ProcedureRecord;  // Extracting procedures.
//     const record = currentRouter._def.record as Record<string, AnyRouter | AnyProcedure>;  // Nested routers/procedures.

//     // Loop over each procedure in the current router.
//     for (const [key, procedure] of Object.entries(procedures)) {
//       const path = `${prefix}${key}`;  // Create the full route path.
//       const input = procedure._def.inputs?.[0] as z.ZodTypeAny || null;  // Input schema or null.
//       const output = procedure._def.output as z.ZodTypeAny || null;  // Output schema or null.

//       // Determine if it's a query or mutation based on the procedure type
//       const routeType = procedure._def.query ? 'query' : 'mutation'

//       // Use descriptive names for schemas
//       const inputSchemaName = `${key}InputSchema`;
//       const outputSchemaName = `${key}OutputSchema`;

//       // Add the route to the map.
//       routeMap[path] = { path, type: routeType, input, output };

//       if (input) {
//         routeMap[path].input = getSchemaDefinition(input, inputSchemaName);
//       }
//       if (output) {
//         routeMap[path].output = getSchemaDefinition(output, outputSchemaName);
//       }

//     }

//     // Recursively handle any nested routers.
//     for (const [key, nestedRouter] of Object.entries(record)) {
//       if (isRouter(nestedRouter)) {
//         extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`);  // Traverse into nested routers.
//       }
//     }
//   }

//   // Start the extraction from the root router.
//   extractRoutes(router);

//   return { routeMap, definitions };
// }



// export function generateJSON<TRouter extends AnyRouter>(router: TRouter, mapKey: string): string {
//   const extracted = extractRouter(router);
  
//   return JSON.stringify({
//     [mapKey] : [extracted.routeMap], // Keep schema version
//   }, null, 2);
// }
import { AnyProcedure, AnyRouter, ProcedureRecord } from '@trpc/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

// RouteInfo defines the structure of each route's data.
interface RouteInfo {
  path: string;
  type: 'query' | 'mutation';
  input?: z.ZodTypeAny[];
  output?: z.ZodTypeAny[];
}

// ExtractedRouter contains the route map for easy lookup.
interface ExtractedRouter {
  routeMap: Record<string, RouteInfo>;
  definitions: Record<string, any>;
}

// Utility function to check if an object is a TRPC router
function isRouter(obj: any): obj is AnyRouter {
  return obj && obj._def && obj._def.procedures !== undefined;
}

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routeMap: Record<string, RouteInfo> = {};  // The route map to be returned.
  const definitions: Record<string, any> = {};

  // Extracting definitions from the router.
  function getSchemaDefinition(zodType: z.ZodTypeAny, name: string): any {
    if (definitions[name]) {
      return { "$ref": `#/definitions/${name}` }; // Reference existing definition
    }
    const schema = zodToJsonSchema(zodType); // Convert Zod type to JSON schema
    definitions[name] = schema; // Store the definition
    return schema;
  }

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    const procedures = currentRouter._def.procedures as ProcedureRecord;  // Extracting procedures.
    const record = currentRouter._def.record as Record<string, AnyRouter | AnyProcedure>;  // Nested routers/procedures.

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures)) {
      const path = `${prefix}${key}`;  // Create the full route path.
      
      // Collecting input schemas (which could be multiple) and transforming to an array.
      const inputs = procedure._def.inputs?.map((input: z.ZodTypeAny, index: number) => {
        const inputSchemaName = `${key}InputSchema_${index}`;
        return getSchemaDefinition(input, inputSchemaName);
      }) || [];

      // Collecting output schemas (which could be multiple) and transforming to an array.
      const output = procedure._def.output as z.ZodTypeAny || null;
      const outputs = output ? [getSchemaDefinition(output, `${key}OutputSchema`)] : [];

      // Determine if it's a query or mutation based on the procedure type
      const routeType = procedure._def.query ? 'query' : 'mutation';

      // Add the route to the map.
      routeMap[path] = {
        path,
        type: routeType,
        input: inputs.length > 0 ? inputs : undefined,
        output: outputs.length > 0 ? outputs : undefined,
      };
    }

    // Recursively handle any nested routers.
    for (const [key, nestedRouter] of Object.entries(record)) {
      if (isRouter(nestedRouter)) {
        extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`);  // Traverse into nested routers.
      }
    }
  }

  // Start the extraction from the root router.
  extractRoutes(router);

  return { routeMap, definitions };
}

// Function to generate the route data as a JSON string in the 'map' format.
export function generateJSON<TRouter extends AnyRouter>(router: TRouter, mapKey: string): string {
  const extracted = extractRouter(router);

  return JSON.stringify({
    [mapKey]: [extracted.routeMap], // Keep schema version
  }, null, 2);
}

