import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/dashboard.tsx", [
    route("positions", "routes/positions.tsx"),
    index("routes/borrow.tsx"),
    route("stake", "routes/stake.tsx"),
    route("borrow", "routes/home.tsx"),
    route("test", "routes/test.tsx"),
  ]),
] satisfies RouteConfig;
