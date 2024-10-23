// import { AnyProcedure, AnyRouter, ProcedureRecord } from '@trpc/server';
// import { zodToJsonSchema } from 'zod-to-json-schema';
// import { z } from 'zod';

// // RouteInfo defines the structure of each route's data.
// interface RouteInfo {
//   path: string;
//   type: 'query' | 'mutation';
//   input?: z.ZodTypeAny | z.ZodTypeAny[];
//   output?: z.ZodTypeAny | z.ZodTypeAny[];
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

// // Function to combine Zod schemas, handling only ZodObjects for merging.
// function mergeSchemas(schemas: z.ZodTypeAny[]): z.ZodTypeAny | null {
//   if (!Array.isArray(schemas) || schemas.length === 0) {
//     return null;  // Handle cases where schemas are not an array or the array is empty.
//   }

//   if (schemas.length === 1) return schemas[0];  // If there's only one, return it directly.

//   // Ensure that all schemas are ZodObjects before merging
//   if (schemas.every(schema => schema instanceof z.ZodObject)) {
//     return schemas.reduce(
//       (combinedSchema, schema) => (combinedSchema as z.ZodObject<any>).merge(schema as z.ZodObject<any>)
//     );
//   } else {
//     // Handle cases where schemas are not ZodObject (e.g., ZodString, ZodNumber).
//     throw new Error('Cannot merge non-object schemas. Ensure all schemas are ZodObject.');
//   }
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

//       // Handle the possibility of multiple input/output schemas
//       const inputSchemas = procedure._def.inputs as z.ZodTypeAny[] || [];  // Input schema or null.
//       const outputSchemas = procedure._def.outputs as z.ZodTypeAny[] || [];  // Output schema or null.

//       // Determine if it's a query or mutation based on the procedure type
//       const routeType = procedure._def.query ? 'query' : 'mutation'

//       const input = mergeSchemas(inputSchemas);  // Combine input schemas.
//       const output = mergeSchemas(outputSchemas);  // Combine output schemas.

//       // Use descriptive names for schemas
//       const inputSchemaName = `${key}InputSchema`;
//       const outputSchemaName = `${key}OutputSchema`;
      
//       // Add the route to the map.
//       routeMap[path] = { 
//         path,
//         type: routeType,
//         input: Array.isArray(inputSchemas) ? getSchemaDefinition(input, inputSchemaName) : undefined,
//         output: output ? getSchemaDefinition(output, outputSchemaName) : undefined
//       };
      
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
  input?: z.ZodTypeAny | z.ZodTypeAny[];
  output?: z.ZodTypeAny | z.ZodTypeAny[];
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

// Function to merge multiple Zod schemas into a single schema when appropriate
function mergeSchemas(schemas: z.ZodTypeAny[]): z.ZodTypeAny | null {
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return null;
  }
  
  if (schemas.length === 1) {
    console.log(schemas[0])
    return schemas[0];
  }
  
  if (schemas.every((schema) => schema instanceof z.ZodObject)) {
    return schemas.reduce((merged, schema) => merged.merge(schema as z.ZodObject<any>));
  }
  
  return null; // If schemas can't be merged, return null or handle it as an array of schemas.
}

// Extracting schema definitions from Zod schemas
function getSchemaDefinition(zodType: z.ZodTypeAny, name: string, definitions: Record<string, any>): any {
  if (definitions[name]) {
    return { $ref: `#/definitions/${name}` }; // Reference the existing schema
  }
  
  const schema = zodToJsonSchema(zodType); // Convert Zod type to JSON schema
  definitions[name] = schema; // Store the schema
  return schema;
}

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routeMap: Record<string, RouteInfo> = {};  // The route map to be returned.
  const definitions: Record<string, any> = {};

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    const procedures = currentRouter._def.procedures as ProcedureRecord;
    const record = currentRouter._def.record as Record<string, AnyRouter | AnyProcedure>;

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures)) {
      const path = `${prefix}${key}`;  // Create the full route path.

      // Extract input and output schemas (which might be arrays).
      const inputSchemas = procedure._def.inputs as z.ZodTypeAny[] || [];
      const outputSchemas = procedure._def.outputs as z.ZodTypeAny[] || [];
      
      // Attempt to merge input/output schemas if applicable.
      const inputSchema = mergeSchemas(inputSchemas) || inputSchemas;
      const outputSchema = mergeSchemas(outputSchemas) || outputSchemas;

      console.log("Input Schema:", inputSchema);
      console.log("Output Schema:", outputSchema);    
      
      // Determine if it's a query or mutation
      const routeType = procedure._def.query ? 'query' : 'mutation';

      // Define unique names for the schemas
      const inputSchemaName = `${key}InputSchema`;
      const outputSchemaName = `${key}OutputSchema`;

      // Add the route to the map.
      routeMap[path] = {
        path,
        type: routeType,
        input: Array.isArray(inputSchema)
          ? inputSchema.map((schema, index) => getSchemaDefinition(schema, `${inputSchemaName}_${index}`, definitions))
          : inputSchema
          ? getSchemaDefinition(inputSchema, inputSchemaName, definitions)
          : undefined,
        output: Array.isArray(outputSchema)
          ? outputSchema.map((schema, index) => getSchemaDefinition(schema, `${outputSchemaName}_${index}`, definitions))
          : outputSchema
          ? getSchemaDefinition(outputSchema, outputSchemaName, definitions)
          : undefined,
      };
    }

    // Recursively handle any nested routers.
    for (const [key, nestedRouter] of Object.entries(record)) {
      if (isRouter(nestedRouter)) {
        extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`);
      }
    }
  }

  // Start extraction from the root router.
  extractRoutes(router);

  return { routeMap, definitions };
}

// Generate JSON representation of the router and its schemas.
export function generateJSON<TRouter extends AnyRouter>(router: TRouter, mapKey: string): string {
  const extracted = extractRouter(router);
  
  return JSON.stringify(
    {
      [mapKey]: extracted.routeMap,
      definitions: extracted.definitions,
    },
    null,
    2
  );
}
