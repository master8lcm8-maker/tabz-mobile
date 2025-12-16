// components/NeonModal.tsx
import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

type NeonModalProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;

  // Primary action (optional)
  primaryLabel?: string;
  onPrimaryPress?: () => void;

  // Secondary / cancel action
  secondaryLabel?: string;
  onSecondaryPress?: () => void;

  loading?: boolean;
  disablePrimary?: boolean;
  disableSecondary?: boolean;

  // Called on backdrop tap or when user dismisses
  onRequestClose?: () => void;
};

export const NeonModal: React.FC<NeonModalProps> = ({
  visible,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel = 'Close',
  onSecondaryPress,
  loading = false,
  disablePrimary = false,
  disableSecondary = false,
  onRequestClose,
}) => {
  // Use secondary handler or fallback to onRequestClose
  const handleClose = React.useCallback(() => {
    if (onSecondaryPress) {
      onSecondaryPress();
    } else if (onRequestClose) {
      onRequestClose();
    }
  }, [onSecondaryPress, onRequestClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose || handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrap}>
        <View style={styles.card}>
          {title ? (
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
          ) : null}

          {subtitle ? (
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          ) : null}

          {children ? <View style={styles.body}>{children}</View> : null}

          <View style={styles.actionsRow}>
            {/* Secondary / cancel button */}
            {secondaryLabel ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  disableSecondary ? styles.buttonDisabled : null,
                ]}
                onPress={handleClose}
                disabled={disableSecondary || loading}
              >
                <ThemedText style={styles.secondaryLabel}>
                  {secondaryLabel}
                </ThemedText>
              </TouchableOpacity>
            ) : null}

            {/* Primary button (optional) */}
            {primaryLabel && onPrimaryPress ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (disablePrimary || loading) && styles.buttonDisabled,
                ]}
                onPress={onPrimaryPress}
                disabled={disablePrimary || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#05060E" />
                ) : (
                  <ThemedText style={styles.primaryLabel}>
                    {primaryLabel}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  centerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#05060E',
    borderWidth: 1.5,
    // Gold neon frame
    borderColor: '#FFC94A',
    shadowColor: '#FFC94A',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#FFE8A3',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  body: {
    marginTop: 12,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFC94A', // main gold neon
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05060E',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
