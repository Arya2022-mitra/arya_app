import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import ProfileList from './ProfileList';
import SegmentList from './SegmentList';
import { colors } from '../../../constants/theme';

interface DrawerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DrawerSidebar({ isOpen, onClose }: DrawerSidebarProps) {
  const { t } = useTranslation();

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{t('nav.menu')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <ProfileList />
            <View style={styles.divider} />
            <SegmentList />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: colors["neo-dark"],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors['accent-3'],
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors['accent-3'],
    marginVertical: 8,
  },
});
