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
  const baseStyles = "flex-row items-center justify-center rounded-2xl transition-all active:scale-98";
  
  const variants = {
    primary: "bg-primary shadow-md shadow-primary/20",
    secondary: "bg-primary-light/40 dark:bg-primary/10",
    outline: "border-2 border-primary/20 bg-transparent",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "px-4 py-2",
    md: "px-6 py-3.5",
    lg: "px-8 py-4.5",
    xl: "px-10 py-5",
  };

  const textVariants = {
    primary: "text-white font-bold tracking-tight",
    secondary: "text-[#4cae4f] font-bold tracking-tight",
    outline: "text-[#111811] dark:text-white font-bold tracking-tight",
    ghost: "text-gray-500 dark:text-gray-400 font-medium",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base font-bold",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <TouchableOpacity 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#4cae4f'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textVariants[variant]} ${textSizes[size]} ${textClassName}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
