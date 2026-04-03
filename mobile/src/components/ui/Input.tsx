import React, { useState, forwardRef } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps, StyleSheet } from 'react-native';
import { XCircle } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
  containerClassName?: string;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  icon,
  onClear,
  className,
  containerClassName,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = Boolean(props.value);
  const showClear = hasValue && props.editable !== false && onClear;

  // Use style instead of complex conditional classNames to avoid NativeWind parsing errors
  const containerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    Boolean(error) && styles.inputContainerError,
  ];

  return (
    <View className={`mb-4 ${containerClassName || ''}`}>
      {label && (
        <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View style={containerStyle as any}>
        <TextInput
          ref={ref}
          className={`flex-1 text-base text-slate-900 dark:text-white font-medium py-3 ${className || ''}`}
          placeholderTextColor="#9ca3af"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          selectionColor="#4cae4f"
          {...props}
        />

        {showClear && (
          <TouchableOpacity onPress={onClear} className="ml-2 p-1">
            <XCircle size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {icon && (
          <View className={`ml-2 ${showClear ? 'pl-2 border-l border-gray-100 dark:border-gray-800' : ''}`}>
            {icon}
          </View>
        )}
      </View>
      {error && (
        <Text className="text-xs text-red-500 mt-1 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaf0ea',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: '#4cae4f',
    shadowColor: '#4cae4f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#ef4444',
  },
});

Input.displayName = 'Input';
