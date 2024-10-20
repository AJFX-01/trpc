import { AnyProcedure, AnyRouter, ProcedureRecord } from '@trpc/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
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
  definitions: Record<string, any>;
}

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routeMap: Record<string, RouteInfo> = {};  // The route map to be returned.
  const definitions: Record<string, any> = {};

  // Extracting definitions from the router.
  function getSchemaDefinition(zodType: z.ZodTypeAny, name: string) : any {
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
      const input = procedure._def.inputs?.[0] as z.ZodTypeAny || null;  // Input schema or null.
      const output = procedure._def.output as z.ZodTypeAny || null;  // Output schema or null.

      // Use descriptive names for schemas
      const inputSchemaName = `${key}InputSchema`;
      const outputSchemaName = `${key}OutputSchema`;

      // Add the route to the map.
      routeMap[path] = { path, input, output };

      if (input) {
        routeMap[path].input = getSchemaDefinition(input, inputSchemaName);
      }
      if (output) {
        routeMap[path].output = getSchemaDefinition(output, outputSchemaName);
      }

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

  return { routeMap, definitions };
}


// function zodToJson(zodType: z.ZodTypeAny): any {
//   const schema: any = {
//     type: zodType._def.typeName, // Get the type of Zod schema (e.g., 'ZodString', 'ZodObject', etc.)
//   };

//   if (zodType instanceof z.ZodObject) {
//     schema.shape = {};
//     for (const key in zodType.shape) {
//       schema.shape[key] = zodToJson(zodType.shape[key]);
//     }
//   } else if (zodType instanceof z.ZodArray) {
//     schema.element = zodToJson(zodType.element);
//   } else if (zodType instanceof z.ZodUnion) {
//     schema.options = zodType.options.map(zodToJson);
//   } else if (zodType instanceof z.ZodIntersection) {
//     schema.left = zodToJson(zodType._def.left);
//     schema.right = zodToJson(zodType._def.right);
//   } else if (zodType instanceof z.ZodNullable) {
//     schema.inner = zodToJson(zodType.innerType);
//   } else if (zodType instanceof z.ZodLiteral) {
//     schema.value = zodType.value; // Handle literal types
//   } else if (zodType instanceof z.ZodEnum) {
//     schema.values = zodType.Values; // Handle enum types
//   } else if (zodType instanceof z.ZodTuple) {
//     schema.items = zodType.items.map(zodToJson); // Handle tuple types
//   } else if (zodType instanceof z.ZodDiscriminatedUnion) {
//     schema.options = zodType._def.options.map(zodToJson); // Handle discriminated unions
//     schema.discriminator = zodType._def.discriminator; // Discriminator field
//   } else if (zodType instanceof z.ZodEffects) {
//     schema.inner = zodToJson(zodType._def.schema); // Handle effects (transformations, refinements, etc.)
//   } else if (zodType instanceof z.ZodRecord) {
//     schema.key = zodToJson(zodType.keyType); // Handle records (key-value pairs)
//     schema.value = zodToJson(zodType.valueType);
//   } else if (zodType instanceof z.ZodMap) {
//     schema.key = zodToJson(zodType.keyType); // Handle Maps
//     schema.value = zodToJson(zodType.valueType);
//   } else if (zodType instanceof z.ZodSet) {
//     schema.element = zodToJson(zodType.valueType); // Handle Sets
//   } else {
//     // Handle other Zod types as necessary
//     schema.description = zodType.description; // Add description if available
//   }

//   return schema;
// }


// Function to generate the route data as a JSON string in the 'map' format.
// export function generateJSON<TRouter extends AnyRouter>(router: TRouter): string {
//   const extracted = extractRouter(router);  // Extract routes.

//   return JSON.stringify(extracted.routeMap, (key, value) => {
//     // Handle ZodType instances, formatting them with `describe`.
//     if (value instanceof z.ZodType) {
//       return {
//         type: 'zod',
//         schema: zodToJsonSchema(value.describe("my new test subject"), "mySchema") // Use Zod's describe method for better clarity.
//       };
//     }
//     return value;  // Return non-Zod values as-is.
//   }, 2);  // Pretty-print the JSON with 2 spaces of indentation.
// }

export function generateJSON<TRouter extends AnyRouter>(router: TRouter): string {
  const extracted = extractRouter(router);

  return JSON.stringify({
    routeMap: extracted.routeMap,
    definitions: extracted.definitions,
    $schema: "http://json-schema.org/draft-07/schema#", // Keep schema version
  }, null, 2);
}
