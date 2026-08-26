import { startLocalNotionCaptureServer } from "./local-notion-capture-server.mjs";

export function hitoLocalNotionCapturePlugin() {
  return {
    name: "hito:local-notion-capture",
    apply: "serve",
    configureServer(server) {
      return async () => {
        const address = server.httpServer?.address();
        const appPort = typeof address === "object" && address ? address.port : 8080;
        const localServer = await startLocalNotionCaptureServer({
          appPort,
          port: appPort + 1,
        });
        server.httpServer?.once("close", () => {
          void localServer.close();
        });
      };
    },
  };
}
