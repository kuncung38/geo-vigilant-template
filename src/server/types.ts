export type AppEnv = {
  Bindings: {
    // biome-ignore lint/suspicious/noExplicitAny: supports D1Database in Worker or bun:sqlite Database in test
    DB: any;
  };
  Variables: {
    nodeId: string;
  };
};
