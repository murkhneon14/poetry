/// <reference types="vite/client" />
/// <reference types="@convex-dev/auth/client" />

declare module "convex/browser" {
  export * from "convex/browser";
}

declare module "convex/react" {
  export * from "convex/react";
}

interface Window {
  __CONVEX_AUTH__: any;
}
