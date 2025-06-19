/// <reference types="@convex-dev/auth/client" />

// Declare module for Convex API types
declare module "convex/browser" {
  export * from "convex/browser";
}

declare module "convex/react" {
  export * from "convex/react";
}

// Add type declarations for the Convex client
interface Window {
  __CONVEX_AUTH__: any; // You can replace 'any' with a more specific type if available
}
