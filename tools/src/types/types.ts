import { ZodTypeAny } from "zod";

type ExtractedRoute = {
    path: string;
    input: ZodTypeAny | null;
    output: ZodTypeAny | null;
  };
  
type ExtractedRouter = {
routes: ExtractedRoute[];
};