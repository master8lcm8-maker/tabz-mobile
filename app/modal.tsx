import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { StyleSheet } from 'react-native';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">TABZ Modal</ThemedText>
      <ThemedText>
        This is a simple placeholder modal screen. We’ll use this later for
        things like QR details, drink info, or wallet actions.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
