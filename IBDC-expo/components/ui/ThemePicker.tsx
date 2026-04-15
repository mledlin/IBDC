import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme, ThemeKey, themes } from '@/context/ThemeContext';

const THEME_META: Record<ThemeKey, { label: string; description: string; accent: string }> = {
  original: { label: 'Original', description: 'Basic & familiar', accent: '#4F8EF7' },
  sleek: { label: 'Sleek', description: 'Clean & minimal', accent: '#1A1A1A' },
 // wildcard: { label: 'Wild', description: 'Loud & electric', accent: '#FF2EF7' },
};

function ThemeCard({ themeKey, active, onPress }: {
  themeKey: ThemeKey;
  active: boolean;
  onPress: () => void;
}) {
  const { theme: currentTheme } = useTheme();
  const t = themes[themeKey];
  const meta = THEME_META[themeKey];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderRadius: currentTheme.radii.md,
          borderColor: active ? meta.accent : currentTheme.colors.border,
          borderWidth: active ? 2 : 1,
        },
      ]}
    >
      <View style={[styles.preview, {
        backgroundColor: t.colors.background,
        borderRadius: currentTheme.radii.sm,
        borderWidth: 1,
        borderColor: t.colors.border,
      }]}>
        <View style={[styles.previewBar, { backgroundColor: t.colors.surface }]}>
          <View style={[styles.previewDot, { backgroundColor: t.colors.primary }]} />
          <View style={[styles.previewLine, { backgroundColor: t.colors.textSecondary, width: 32 }]} />
        </View>
        <View style={styles.previewRows}>
          {[0.9, 0.6, 0.75].map((w, i) => (
            <View key={i} style={[styles.previewLine, {
              backgroundColor: i === 0 ? t.colors.text : t.colors.textSecondary,
              width: `${w * 100}%`,
              marginBottom: 4,
            }]} />
          ))}
          <View style={[styles.previewBtn, { backgroundColor: t.colors.primary, borderRadius: t.radii.sm }]} />
        </View>
      </View>

      <View style={styles.labelRow}>
        <View>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>{meta.label}</Text>
          <Text style={[styles.description, { color: currentTheme.colors.textSecondary }]}>{meta.description}</Text>
        </View>
        {active && (
          <View style={[styles.activePill, { backgroundColor: meta.accent }]}>
            <Text style={[styles.activePillText, { color: themeKey === 'sleek' ? '#fff' : themes[themeKey].colors.primaryForeground }]}>
              Active
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ThemePicker() {
  const { themeKey, setTheme, theme } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.triggerButton, {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
        }]}
      >
        <Text style={[styles.triggerLabel, { color: theme.colors.primaryForeground }]}>App Theme</Text>
        <Text style={[styles.triggerValue, { color: theme.colors.primaryForeground }]}>
          {THEME_META[themeKey].label} ›
        </Text>
      </Pressable>

      {/* Modal */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, {
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.radii.lg,
          borderTopRightRadius: theme.radii.lg,
        }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Appearance</Text>

          <View style={styles.list}>
            {(Object.keys(themes) as ThemeKey[]).map((key) => (
              <ThemeCard
                key={key}
                themeKey={key}
                active={themeKey === key}
                onPress={() => { setTheme(key); setVisible(false); }}
              />
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger
  triggerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  triggerLabel: { fontSize: 16, fontWeight: '500' },
  triggerValue: { fontSize: 15 },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  list: { gap: 10 },

  card: { padding: 14, gap: 12 },
  preview: { height: 90, overflow: 'hidden', padding: 8, gap: 6 },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 5, borderRadius: 4 },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewRows: { flex: 1, justifyContent: 'center', paddingHorizontal: 2 },
  previewLine: { height: 5, borderRadius: 3, marginBottom: 5 },
  previewBtn: { height: 12, width: 48, marginTop: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 12, marginTop: 1 },
  activePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  activePillText: { fontSize: 11, fontWeight: '700' },
});