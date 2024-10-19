import { AnyRouter } from '@trpc/server';
import { ZodTypeAny } from 'zod';

interface RouteInfo {
  path: string;
  input?: ZodTypeAny;
  output?: ZodTypeAny;
}

interface ExtractedRouter {
  routes: RouteInfo[];  // Array of routes
  routeMap: Record<string, RouteInfo>;  // Record (map) of routes for direct lookup
}


export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routes: RouteInfo[] = [];
  const routeMap: Record<string, RouteInfo> = {};

  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    for (const [key, procedure] of Object.entries(currentRouter._def.procedures)) {
      const path = `${prefix}${key}`;
      const input = procedure._def.inputs?.[0] as ZodTypeAny || null;
      const output = procedure._def.output as ZodTypeAny || null;

      const routeInfo: RouteInfo = { path, input, output };
      routes.push(routeInfo);
      routeMap[path] = routeInfo;
    }

    for (const [key, nestedRouter] of Object.entries(currentRouter._def.record)) {
      if ('router' in nestedRouter) {
        extractRoutes(nestedRouter, `${prefix}${key}.`);
      }
    }
  }

  extractRoutes(router);

  return { routes, routeMap };
}
