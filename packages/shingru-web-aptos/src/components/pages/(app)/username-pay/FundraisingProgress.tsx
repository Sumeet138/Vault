import { formatUiNumber } from "@/utils/formatting";

interface FundraisingProgressProps {
  goalAmount?: number | null;
  currentAmount: number;
  amountType: string;
}

export default function FundraisingProgress({
  goalAmount,
  currentAmount,
  amountType,
}: FundraisingProgressProps) {
  const hasGoal = goalAmount && goalAmount > 0;
  const progressPercentage = hasGoal
    ? Math.min((currentAmount / goalAmount) * 100, 100)
    : 0;
  const isGoalReached = hasGoal && currentAmount >= goalAmount;

  return (
    <div className="space-y-3">
      {/* Main amount display */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {hasGoal ? "Raised" : "Total raised"}
        </span>
        <span className="text-xl font-bold text-gray-900">
          ${formatUiNumber(currentAmount, "", { defaultDecimals: 2 })}
        </span>
      </div>

      {/* Progress bar for goal-based fundraisers */}
      {hasGoal && (
        <div className="space-y-2">
          {/* Custom progress bar */}
          <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
                isGoalReached
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : "bg-gradient-to-r from-blue-400 to-blue-600"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={isGoalReached ? "text-green-600 font-semibold" : "text-gray-500"}>
              {isGoalReached
                ? "🎉 Goal reached!"
                : `${progressPercentage.toFixed(1)}%`}
            </span>
            <span className="text-gray-500 font-medium">
              Goal: ${formatUiNumber(goalAmount, "", { defaultDecimals: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* For open fundraisers without goals */}
      {!hasGoal && (
        <div className="text-xs text-gray-500 text-center py-1">
          Every contribution counts 💙
        </div>
      )}
    </div>
  );
}
