// components/ConfirmModal.tsx

import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.backdrop}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={loading ? undefined : onCancel}
              disabled={loading}
            >
              <ThemedText style={styles.cancelText}>{cancelLabel}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                loading ? styles.confirmButtonDisabled : null,
              ]}
              onPress={loading ? undefined : onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.confirmText}>
                  {confirmLabel}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#05060E',
    borderWidth: 1.5,
    borderColor: '#00AFFF',
    shadowColor: '#00AFFF',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 10,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 13,
    color: 'rgba(230,240,255,0.9)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: '#00AFFF',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(0,175,255,0.35)',
  },
  cancelText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
