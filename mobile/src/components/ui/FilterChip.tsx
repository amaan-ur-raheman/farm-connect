import { TouchableOpacity, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

cssInterop(ChevronDown, {
  className: {
    target: 'style',
  },
});

interface FilterChipProps {
  label: string;
  value?: string;
  onPress?: () => void;
  active?: boolean;
  className?: string;
}

export function FilterChip({ label, value, onPress, active, className }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 py-2.5 rounded-full border border-agri-border dark:border-slate-800 transition-all ${active ? 'bg-primary/20 border-primary shadow-sm' : 'bg-white dark:bg-slate-900'} ${className || ''}`}
    >
      <Text className={`text-sm font-semibold tracking-tight ${active ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
        {label}{value ? `: ${value}` : ''}
      </Text>
      <ChevronDown size={14} color={active ? '#4cae4f' : '#60974e'} className="ml-2" />
    </TouchableOpacity>
  );
}
