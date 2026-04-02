import { View, Text } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-end mb-2">
        <Text className="text-slate-900 dark:text-white text-base font-bold">Step {currentStep} of {totalSteps}</Text>
        {label && <Text className="text-agri-green text-sm font-medium">{label}</Text>}
      </View>
      <View className="h-2 w-full rounded-full bg-agri-border dark:bg-slate-800 overflow-hidden">
        <View 
          className="h-full rounded-full bg-primary transition-all duration-500" 
          style={{ width: `${progress}%` }} 
        />
      </View>
    </View>
  );
}
