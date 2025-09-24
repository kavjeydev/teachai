/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as api_keys from "../api_keys.js";
import type * as app_management from "../app_management.js";
import type * as chat_analytics from "../chat_analytics.js";
import type * as chats from "../chats.js";
import type * as convexClient from "../convexClient.js";
import type * as fileQueue from "../fileQueue.js";
import type * as initialize_metadata from "../initialize_metadata.js";
import type * as simple_api from "../simple_api.js";
import type * as subscriptions from "../subscriptions.js";
import type * as user_auth_system from "../user_auth_system.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  api_keys: typeof api_keys;
  app_management: typeof app_management;
  chat_analytics: typeof chat_analytics;
  chats: typeof chats;
  convexClient: typeof convexClient;
  fileQueue: typeof fileQueue;
  initialize_metadata: typeof initialize_metadata;
  simple_api: typeof simple_api;
  subscriptions: typeof subscriptions;
  user_auth_system: typeof user_auth_system;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
