import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'outline' | 'secondary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'primary', icon }: BadgeProps) {
  const variants = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    outline: 'bg-transparent text-slate-500 border-agri-border dark:border-slate-700',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-transparent',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-transparent',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-transparent',
  };

  return (
    <View 
      className={`px-3 py-1.5 rounded-full border flex-row items-center ${variants[variant]}`}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Text className="text-[10px] font-black uppercase tracking-widest">{label}</Text>
    </View>
  );
}
