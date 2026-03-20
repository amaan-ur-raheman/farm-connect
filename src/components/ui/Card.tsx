import { View, Text, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function Card({ title, subtitle, icon, children, className, ...props }: CardProps) {
  return (
    <View 
      className={`bg-white dark:bg-[#1a2c15] rounded-2xl p-6 shadow-sm border border-agri-border dark:border-slate-800 ${className}`}
      {...props}
    >
      {(title || subtitle || icon) && (
        <View className="flex-row items-center mb-4">
          {icon && <View className="mr-3">{icon}</View>}
          <View className="flex-1">
            {title && <Text className="text-lg font-bold text-slate-900 dark:text-white">{title}</Text>}
            {subtitle && <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}
