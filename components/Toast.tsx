import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 6000,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const [showStartTime, setShowStartTime] = React.useState<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setShowStartTime(Date.now());

      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration (but only if it's still visible)
      const timer = setTimeout(() => {
        if (isVisible) {
          handleClose();
        }
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShowStartTime(null);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    // Ensure toast is visible for at least 2 seconds
    if (showStartTime && (Date.now() - showStartTime) < 2000) {
      return;
    }

    // Slide out and fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.light.successLight,
          borderColor: Colors.light.success,
          iconColor: Colors.light.success,
          textColor: Colors.light.successDark,
        };
      case 'error':
        return {
          backgroundColor: Colors.light.errorLight,
          borderColor: Colors.light.error,
          iconColor: Colors.light.error,
          textColor: Colors.light.errorDark,
        };
      case 'warning':
        return {
          backgroundColor: Colors.light.warningLight,
          borderColor: Colors.light.warning,
          iconColor: Colors.light.warning,
          textColor: Colors.light.warningDark,
        };
      case 'info':
        return {
          backgroundColor: Colors.light.infoLight,
          borderColor: Colors.light.info,
          iconColor: Colors.light.info,
          textColor: Colors.light.infoDark,
        };
      default:
        return {
          backgroundColor: Colors.light.gray100,
          borderColor: Colors.light.gray300,
          iconColor: Colors.light.gray600,
          textColor: Colors.light.gray700,
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  if (!isVisible) {
    return null;
  }

  const styles = getToastStyles();

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          toastStyles.toast,
          {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
          },
        ]}
      >
        <View style={toastStyles.content}>
          <View style={toastStyles.iconContainer}>
            <Ionicons
              name={getIcon() as any}
              size={24}
              color={styles.iconColor}
            />
          </View>
          <View style={toastStyles.messageContainer}>
            <Text
              style={[
                toastStyles.message,
                { color: styles.textColor },
              ]}
            >
              {message}
            </Text>
          </View>
          <TouchableOpacity
            style={toastStyles.closeButton}
            onPress={handleClose}
          >
            <Ionicons
              name="close"
              size={20}
              color={styles.textColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120, // Increased from 60 to avoid status bar
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999, // Increased z-index to ensure visibility
  },
  toast: {
    borderRadius: borderRadius.lg,
    borderWidth: 2, // Increased border width for visibility
    ...shadows.lg,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  closeButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
});

export default Toast;
