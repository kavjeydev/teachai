// Main exports for @trainly/react SDK
export { TrainlyProvider } from "./TrainlyProvider";
export { useTrainly } from "./useTrainly";

// Pre-built components
export { TrainlyChat } from "./components/TrainlyChat";
export { TrainlyUpload } from "./components/TrainlyUpload";
export { TrainlyStatus } from "./components/TrainlyStatus";
export { TrainlyFileManager } from "./components/TrainlyFileManager";

// Types
export type {
  TrainlyProviderProps,
  TrainlyConfig,
  ChatMessage,
  Citation,
  UploadResult,
  TextContent,
  BulkUploadResult,
  BulkUploadFileResult,
  FileInfo,
  FileListResult,
  FileDeleteResult,
  TrainlyError,
  TrainlyFileManagerProps,
} from "./types";
