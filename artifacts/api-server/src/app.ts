import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes and share pages (/s/:id, /api/*)
app.use("/api", router);
app.use("/", router);

// Serve static frontend assets built to hh-goa-frame/dist/public
const staticPath = path.resolve(process.cwd(), "artifacts/hh-goa-frame/dist/public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/s/")) {
      return next();
    }
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

export default app;
