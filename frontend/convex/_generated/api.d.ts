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
import type * as chats from "../chats.js";
import type * as convexClient from "../convexClient.js";
import type * as simple_api from "../simple_api.js";
import type * as subscriptions from "../subscriptions.js";

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
  chats: typeof chats;
  convexClient: typeof convexClient;
  simple_api: typeof simple_api;
  subscriptions: typeof subscriptions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
