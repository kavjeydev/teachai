// Main exports for @trainly/react SDK
export { TrainlyProvider } from "./TrainlyProvider";
export { useTrainly } from "./useTrainly";

// Pre-built components
export { TrainlyChat } from "./components/TrainlyChat";
export { TrainlyUpload } from "./components/TrainlyUpload";
export { TrainlyStatus } from "./components/TrainlyStatus";

// Types
export type {
  TrainlyProviderProps,
  TrainlyConfig,
  ChatMessage,
  Citation,
  UploadResult,
  TrainlyError,
} from "./types";
