import { AnyRouter } from '@trpc/server';
import { ZodTypeAny } from 'zod';

type ExtractedRoute = {
  path: string;
  input: ZodTypeAny | null;
  output: ZodTypeAny | null;
};

type ExtractedRouter = {
  routes: ExtractedRoute[];
};

export function extractRouter<TRouter extends AnyRouter>(router: TRouter): ExtractedRouter {
  const routes: ExtractedRoute[] = [];

  function extractRoutes(currentRouter: AnyRouter, prefix: string = '') {
    for (const [key, procedure] of Object.entries(currentRouter._def.procedures)) {
      const path = `${prefix}${key}`;
      const input = (procedure._def.inputs?.[0] as ZodTypeAny) || null;
      const output = procedure._def.output as ZodTypeAny;

      routes.push({ path, input, output });
    }

    for (const [key, nestedRouter] of Object.entries(currentRouter._def.record)) {
      if ('router' in nestedRouter) {
        extractRoutes(nestedRouter, `${prefix}${key}.`);
      }
    }
  }

  extractRoutes(router);

  return { routes };
}

export function generateJSON<TRouter extends AnyRouter>(router: TRouter): string {
  const extracted = extractRouter(router);
  return JSON.stringify(extracted, (key, value) => {
    if (value instanceof ZodTypeAny) {
      return {
        type: 'zod',
        schema: value.describe(),
      };
    }
    return value;
  }, 2);
}