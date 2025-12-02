/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_keys from "../api_keys.js";
import type * as app_management from "../app_management.js";
import type * as backend_credits from "../backend_credits.js";
import type * as chat_analytics from "../chat_analytics.js";
import type * as chats from "../chats.js";
import type * as convexClient from "../convexClient.js";
import type * as customRelationships from "../customRelationships.js";
import type * as feedback from "../feedback.js";
import type * as fileQueue from "../fileQueue.js";
import type * as fileStorage from "../fileStorage.js";
import type * as initialize_metadata from "../initialize_metadata.js";
import type * as organizations from "../organizations.js";
import type * as shadow_accounts from "../shadow_accounts.js";
import type * as simple_api from "../simple_api.js";
import type * as subscriptions from "../subscriptions.js";
import type * as user_auth_system from "../user_auth_system.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  api_keys: typeof api_keys;
  app_management: typeof app_management;
  backend_credits: typeof backend_credits;
  chat_analytics: typeof chat_analytics;
  chats: typeof chats;
  convexClient: typeof convexClient;
  customRelationships: typeof customRelationships;
  feedback: typeof feedback;
  fileQueue: typeof fileQueue;
  fileStorage: typeof fileStorage;
  initialize_metadata: typeof initialize_metadata;
  organizations: typeof organizations;
  shadow_accounts: typeof shadow_accounts;
  simple_api: typeof simple_api;
  subscriptions: typeof subscriptions;
  user_auth_system: typeof user_auth_system;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
