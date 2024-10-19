import { AnyProcedure, AnyRouter, ProcedureRecord, RouterRe } from '@trpc/server';
import { z } from 'zod';

interface RouteInfo {
  path: string;
  input?: z.ZodTypeAny;
  output?: z.ZodTypeAny;
}

interface ExtractedRouter {
  routes: RouteInfo[];  // Array of routes
  routeMap: Record<string, RouteInfo>;  // Record (map) of routes for direct lookup
}


export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routes: RouteInfo[] = [];
  const routeMap: Record<string, RouteInfo> = {};

  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    const procedures = currentRouter._def.procedures as ProcedureRecord;
    const record = currentRouter._def.record as Record<string, AnyRouter | AnyProcedure>;
    for (const [key, procedure] of Object.entries(procedures)) {

      const path = `${prefix}${key}`;
      const input = procedure._def.inputs?.[0] as z.ZodTypeAny || null;
      const output = procedure._def.output as z.ZodTypeAny || null;

      const routeInfo: RouteInfo = { path, input, output };
      routes.push(routeInfo);
      routeMap[path] = routeInfo;
    }

    for (const [key, nestedRouter] of Object.entries(record)) {
      if ('router' in nestedRouter) {
        extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`);
      }
    }
  }

  extractRoutes(router);

  return { routes, routeMap };
}


export function generateJSON<TRouter extends AnyRouter>(router: TRouter, format: 'array' | 'map' = 'array'): string {
  const extracted = extractRouter(router);

  const outputData = format === 'map' ? extracted.routeMap : extracted.routes;

  return JSON.stringify(outputData, (key, value) => {
    if (value instanceof z.ZodType) {
      return {
        type: 'zod',
        schema: value.describe(key),
      };
    }
    return value;
  }, 2);
}

