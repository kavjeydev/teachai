import { useTrainlyContext } from "./TrainlyProvider";

/**
 * Main hook for using Trainly in your React components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ask, upload, isLoading } = useTrainly();
 *
 *   const handleQuestion = async () => {
 *     const answer = await ask("What is photosynthesis?");
 *     // Handle the answer response
 *   };
 *
 *   return <button onClick={handleQuestion}>Ask AI</button>;
 * }
 * ```
 */
export function useTrainly() {
  return useTrainlyContext();
}
