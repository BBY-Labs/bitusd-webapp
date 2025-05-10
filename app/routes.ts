import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/dashboard.tsx", [
    index("routes/home.tsx"),
    route("borrow", "routes/borrow.tsx"),
  ]),
] satisfies RouteConfig;
