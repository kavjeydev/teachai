import { TrainlyTest } from "@/components/TrainlyTest";
import { SimpleTrainlyTest } from "@/components/SimpleTrainlyTest";

export default function TestTrainlyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 space-y-8">
      {/* Simple mock test to show package concept */}
      <SimpleTrainlyTest />

      {/* Real API test (currently has backend issues) */}
      <div className="border-t pt-8">
        <TrainlyTest />
      </div>
    </div>
  );
}
