import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type Props = { navigation: NativeStackNavigationProp<ProfileStackParamList, 'Terms'> };

const SECTIONS = [
  {
    title: '1. Eligibility',
    body: 'CampusBazaar is exclusively for verified students of recognised colleges and universities. By registering, you confirm that you are a current student with a valid college email address (.ac.in or .edu).',
  },
  {
    title: '2. User Responsibilities',
    body: 'You are solely responsible for listings you post, offers you make, and transactions you conduct. CampusBazaar acts as a platform only and is not a party to any transaction.',
  },
  {
    title: '3. Prohibited Items',
    body: 'Listing prohibited items (see Prohibited Items list) will result in immediate account suspension. This includes but is not limited to: drugs, exam papers, weapons, and stolen goods.',
  },
  {
    title: '4. Payments',
    body: 'CampusBazaar does not process payments. Any UPI, cash, or bank transfer happens directly between buyer and seller. We are not responsible for payment disputes.',
  },
  {
    title: '5. Safety',
    body: 'Always meet in public, well-lit campus locations. Use the SOS feature in an emergency. CampusBazaar is not liable for any physical harm arising from user meetups.',
  },
  {
    title: '6. Privacy',
    body: 'We store your name, college email, and profile details to operate the service. We never sell your data to third parties. ID verification images are deleted after review.',
  },
  {
    title: '7. Reporting & Moderation',
    body: 'Users may report listings or other users. Repeated reports or policy violations may result in temporary or permanent account suspension without prior notice.',
  },
  {
    title: '8. Disclaimer',
    body: 'CampusBazaar provides no warranty on items listed. Buyers should inspect items before completing a transaction. All sales are final unless agreed otherwise between parties.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the revised terms.',
  },
];

export default function TermsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="document-text" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroDate}>Last updated: March 2024</Text>
        </View>

        {SECTIONS.map(s => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="mail-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.footerText}>Questions? Contact us at legal@campusbazaar.in</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.xl, paddingBottom: 40 },
  hero: {
    alignItems:    'center',
    paddingVertical: spacing.xxl,
    gap:           spacing.sm,
    marginBottom:  spacing.xl,
  },
  heroTitle: {
    fontSize:   typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  heroDate: {
    fontSize: typography.sizes.sm,
    color:    colors.textTertiary,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius:    borderRadius.md,
    padding:         spacing.xl,
    marginBottom:    spacing.md,
  },
  sectionTitle: {
    fontSize:     typography.sizes.md,
    fontWeight:   typography.weights.bold,
    color:        colors.primary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize:  typography.sizes.sm,
    color:     colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    justifyContent: 'center',
    marginTop:     spacing.xl,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color:    colors.textTertiary,
  },
});
