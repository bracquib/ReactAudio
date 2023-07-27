import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Help = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Help</Text>

      <Text style={styles.sectionTitle}>CreateActivityScreen:</Text>
      <Text>Créer  activité, supprimer  activité, aimer  activité</Text>

      <Text style={styles.sectionTitle}>CreateDocument:</Text>
      <Text>Supprimer  document, supprimer  dossier</Text>

      <Text style={styles.sectionTitle}>Group:</Text>
      <Text>Supprimer  groupe</Text>

      <Text style={styles.sectionTitle}>Media:</Text>
      <Text>Créer  album, supprimer  album, supprimer  photo</Text>

      <Text style={styles.sectionTitle}>MembersScreen:</Text>
      <Text>Supprimer  avatar, supprimer  couverture, supprimer  membre</Text>

      <Text style={styles.sectionTitle}>Report:</Text>
      <Text>Reporter  membre</Text>

          <Text style={styles.sectionTitle}>Non-admin:</Text>
          <Text style={styles.sectionTitle}>CreateActivityScreen:</Text>
          <Text>créer activité,aimer activité</Text>

          <Text style={styles.sectionTitle}>CreateDocument:</Text>
          <Text>pas d'accès</Text>

          <Text style={styles.sectionTitle}>Group:</Text>
          <Text>pas d'accès</Text>

          <Text style={styles.sectionTitle}>Media:</Text>
          <Text>pas d'accès</Text>

          <Text style={styles.sectionTitle}>MembersScreen:</Text>
      <Text>pas d'accès</Text>

<Text style={styles.sectionTitle}>Report:</Text>
      <Text>pas d'accès</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default Help;
