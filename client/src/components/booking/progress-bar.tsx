interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number;
}

export default function ProgressBar({ currentStep, totalSteps, completedSteps }: ProgressBarProps) {
  // Use completedSteps if provided, otherwise fallback to currentStep - 1 (since currentStep is 1-indexed)
  const actualCompletedSteps = completedSteps !== undefined ? completedSteps : Math.max(0, currentStep - 1);
  const progressPercentage = (actualCompletedSteps / totalSteps) * 100;

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div 
        className="gradient-bg h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}
