import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from "@/context/DeviceContext";
import { useTheme } from '@/context/ThemeContext';

type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

interface DeviceInfo {
  name: string;
  status: ConnectedStatus;
  battery: number;
  storage: { used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
}

const demoDevice: DeviceInfo = {
  name: 'IBDC Proto X',
  status: 'connected',
  battery: 78,
  storage: { used: 3.4, total: 8 },
  firmwareVersion: 'v1.0',
  lastSynced: '2 min ago',
};

function BatteryBar({ level, theme }: { level: number; theme: any }) {
  const color = level > 50 ? '#16a34a' : level > 20 ? '#ffd166' : '#ff6b6b';
  return (
    <View style={styles.batteryWrapper}>
      <View style={[styles.batteryOuter, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.batteryFill, { width: `${level}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function StorageBar({ level, theme }: { level: number; theme: any }) {
  const color = level > 90 ? '#ff6b6b' : level > 70 ? '#ffd166' : '#16a34a';
  return (
    <View style={styles.batteryWrapper}>
      <View style={[styles.batteryOuter, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.batteryFill, { width: `${level}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}


function getStatusText(status: ConnectedStatus) {
  switch (status) {
    case "connected": return "Connected";
    case "pairing": return "Pairing";
    case "disconnected": return "Disconnected";
    default: return "Unknown";
  }
}

export default function MainScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { device } = useDevice();
  const currentDevice = device ?? demoDevice;
  const storagePercent = (currentDevice.storage.used / currentDevice.storage.total) * 100;

  return (
    <View style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat cards row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statHeader}>
              <Ionicons name="bluetooth" size={18} color={theme.colors.primary} />
              <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{getStatusText(currentDevice.status)}</Text>
            </View>
            <Pressable
              style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md }]}
              onPress={() => router.push("/PairDevice")}
            >
              <Text style={[styles.buttonText, { color: theme.colors.primaryForeground }]}>Pair Device</Text>
            </Pressable>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statHeader}>
              <Ionicons name="battery-half-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>Battery</Text>
            </View>
            <Text style={[styles.statBigNumber, { color: theme.colors.textSecondary }]}>{currentDevice.battery}%</Text>
            <BatteryBar level={currentDevice.battery} theme={theme} />
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statHeader}>
              <Ionicons name="server-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>Storage</Text>
            </View>
            <Text style={[styles.statBigNumber, { color: theme.colors.textSecondary }]}>{storagePercent}%</Text>
            <StorageBar level={storagePercent} theme={theme} />
          </View>
        </View>

        {/* Device image card */}
        <View style={[styles.imageCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.batteryText, { color: theme.colors.text }]}>IBDC</Text>
          <Image
            source={require('../assets/images/device-placeholder.png')}
            style={styles.productImage}
            resizeMode="contain"
          />
          <Text style={[styles.batteryText, { color: theme.colors.textSecondary }]}>
            Firmware {currentDevice.firmwareVersion} • Synced {currentDevice.lastSynced}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButtonSmall, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md }]}
              onPress={() => router.push("/RideSessions")}
            >
              <Ionicons name="bicycle-outline" size={18} color={theme.colors.primaryForeground} />
              <Text style={[styles.actionButtonSmallText, { color: theme.colors.primaryForeground }]}>Ride Sessions</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButtonSmall, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md }]}
              onPress={() => router.push("/Settings")}
            >
              <Ionicons name="settings-outline" size={18} color={theme.colors.primaryForeground} />
              <Text style={[styles.actionButtonSmallText, { color: theme.colors.primaryForeground }]}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statTitle: { fontSize: 12, fontWeight: '600' },
  statBigNumber: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  batteryWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batteryOuter: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 4 },
  batteryText: { fontSize: 11, fontWeight: '700' },
  button: { padding: 12, marginBottom: 4 },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
  imageCard: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  productImage: { width: '100%', height: 260, marginBottom: 16 },
  actionsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionButtonSmall: {
    flex: 1,
    minHeight: 82,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  actionButtonSmallText: {
    fontWeight: "700",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 16,
  },
});