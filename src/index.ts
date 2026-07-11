import { Hono } from "hono";
import { exercisePlanRequestHandler } from "./endpoints/exercisePlanRequest";

const app = new Hono();

app.get("/", (c) => {
  return c.text("root ok");
});

app.get("/test", (c) => {
  return c.json({
    success: true,
    message: "GET test ok"
  });
});

app.post("/api/exercise-plan/request", exercisePlanRequestHandler);

export default app;