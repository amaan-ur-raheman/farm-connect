import { TextInput, View, Text, TextInputProps } from 'react-native';
import { Mail, Lock, Search, MapPin, ChevronDown } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: 'mail' | 'lock' | 'search' | 'map-pin' | 'chevron-down';
}

export function Input({
  label,
  error,
  icon,
  className,
  ...props
}: InputProps) {
  const ICON_SIZE = 20;
  const ICON_COLOR = '#60974e';

  const RenderIcon = () => {
    switch (icon) {
      case 'mail': return <Mail size={ICON_SIZE} color={ICON_COLOR} />;
      case 'lock': return <Lock size={ICON_SIZE} color={ICON_COLOR} />;
      case 'search': return <Search size={ICON_SIZE} color={ICON_COLOR} />;
      case 'map-pin': return <MapPin size={ICON_SIZE} color={ICON_COLOR} />;
      case 'chevron-down': return <ChevronDown size={ICON_SIZE} color={ICON_COLOR} />;
      default: return null;
    }
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">{label}</Text>}
      <View className={`relative flex-row items-center rounded-xl bg-agri-input border border-agri-border px-4 py-3.5 dark:bg-slate-900 dark:border-slate-800 ${error ? 'border-red-500' : ''} ${className}`}>
        <TextInput
          className="flex-1 text-base text-slate-900 dark:text-white font-medium"
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {icon && (
          <View className="ml-2 pl-3 border-l border-slate-100 dark:border-slate-800">
            <RenderIcon />
          </View>
        )}
      </View>
      {error && <Text className="text-xs text-red-500 mt-1 ml-1">{error}</Text>}
    </View>
  );
}
