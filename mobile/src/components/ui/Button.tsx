import { Text, TouchableOpacity, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  textClassName?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const sizeStyles = size === 'sm' 
    ? 'px-4 py-2' 
    : size === 'md' 
      ? 'px-6 py-3.5' 
      : size === 'lg' 
        ? 'px-8 py-4.5' 
        : 'px-10 py-5';

  const textSizeStyles = size === 'sm'
    ? 'text-sm'
    : size === 'md'
      ? 'text-base font-bold'
      : size === 'lg'
        ? 'text-lg'
        : 'text-xl';

  const variantStyles = variant === 'primary'
    ? 'bg-primary shadow-md shadow-primary/20'
    : variant === 'secondary'
      ? 'bg-primary-light/40 dark:bg-primary/10'
      : variant === 'outline'
        ? 'border-2 border-primary/20 bg-transparent'
        : 'bg-transparent';

  const textVariantStyles = variant === 'primary'
    ? 'text-white font-bold tracking-tight'
    : variant === 'secondary'
      ? 'text-[#4cae4f] font-bold tracking-tight'
      : variant === 'outline'
        ? 'text-[#111811] dark:text-white font-bold tracking-tight'
        : 'text-gray-500 dark:text-gray-400 font-medium';

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center rounded-2xl transition-all active:scale-98 ${variantStyles} ${sizeStyles} ${className || ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#4cae4f'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textVariantStyles} ${textSizeStyles} ${textClassName || ''}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
