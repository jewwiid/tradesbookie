interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div 
        className="gradient-bg h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}
