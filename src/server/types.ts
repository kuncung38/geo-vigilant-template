export type AppEnv = {
  Bindings: {
    // biome-ignore lint/suspicious/noExplicitAny: supports D1Database in Worker or bun:sqlite Database in test
    DB: any;
    // Static asset binding; absent in the bun:sqlite integration tests.
    ASSETS?: { fetch: (request: Request) => Promise<Response> };
  };
  Variables: {
    nodeId: string;
  };
};
