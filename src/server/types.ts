export type AppEnv = {
  Bindings: {
    // biome-ignore lint/suspicious/noExplicitAny: supports D1Database in Worker or bun:sqlite Database in test
    DB: any;
    ASSETS?: { fetch: (request: Request) => Promise<Response> };
  };
  Variables: {
    nodeId: string;
  };
};
