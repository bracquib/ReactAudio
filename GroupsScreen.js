import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView ,TextInput,Alert} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const GroupesScreen = () => {
  const [groupes, setGroupes] = useState([]);
  const [membres, setMembres] = useState({});
  const [groupSettings, setGroupSettings] = useState({});
  const [membersId, setMembersId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupes();
    
  }, []);
  
  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };




  const fetchGroupes = async () => {
    try {
      const response = await fetch(`${rootUrl}/wp-json/buddyboss/v1/groups/`);
      const data = await response.json();
      const groupesWithDetails = await Promise.all(
        data.map(async (groupe) => {
          const details = await fetchDetails(groupe.id);
          const settings = await fetchGroupSettings(groupe.id);
          return { ...groupe, details, settings };
        })
      );
      setGroupes(groupesWithDetails);
    } catch (error) {
      console.error('Error fetching groupes:', error);
      setGroupes([]);
    }
  };

  const fetchDetails = async (groupId) => {
    try {
      const response = await fetch(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}/detail`);
      const data = await response.json();
      return data.tabs;
    } catch (error) {
      console.error('Error fetching group details:', error);
      return [];
    }
  };

  const fetchGroupSettings = async (groupId) => {
    try {
      const response = await fetch(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}/settings?id=${groupId}&nav=group-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching group settings:', error);
      return {};
    }
  };
  

  const fetchMembres = async (groupId) => {
    try {
      const response = await fetch(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}/members`);
      const data = await response.json();
      setMembres((prevMembres) => ({
        ...prevMembres,
        [groupId]: data,
      }));
    } catch (error) {
      console.error('Error fetching group members:', error);
      setMembres((prevMembres) => ({
        ...prevMembres,
        [groupId]: [],
      }));
    }
  };

  const addMembers = async (groupe_id, members_id) => {
    setIsLoading(true);
    try {
      const data = {
        groupe_id: groupe_id,
        user_id: members_id,
      };
      const response = await axios.post(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupe_id}/members`, data, { headers });
      setIsLoading(false);
      setMembres((prevMembres) => ({
        ...prevMembres,
        [groupe_id]: [...(prevMembres[groupe_id] || []), response.data],
      }));
      Alert.alert('Member Added', 'The member has been successfully added to the group.');
    } catch (error) {
      setError(error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to add member. Please try again.');
    }
  };
  
  const deleteGroup = async (groupId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}`, {
        data: {
          id: groupId,
          delete_group_forum: true
        },
        headers,
      });
      // Vérifiez la réponse pour voir si la suppression a réussi
      if (response.data.deleted) {
        // Supprimez le groupe de la liste des groupes
        setGroupes((prevGroupes) => prevGroupes.filter((groupe) => groupe.id !== groupId));
        Alert.alert('Group Deleted', 'The group has been successfully deleted.');
      } else {
        Alert.alert('Error', 'Failed to delete the group. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Error', 'Failed to delete the group. Please try again.');
    }
  };
  

  const styles = {
    boldText: {
      fontWeight: 'bold',
    },
    avatarImage: {
      width: 50,
      height: 50,
    },
    coverImage: {
      width: 200,
      height: 100,
    },
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Text>Groupes:</Text>
        {groupes.map((groupe) => (
          <View key={groupe.id}>
            <Text style={styles.boldText}>Name: {groupe.name}</Text>
            <Text>ID: {groupe.id}</Text>
            <Text>Link: {groupe.link}</Text>
            <Text>Members Count: {groupe.members_count}</Text>
            <TextInput
  placeholder="Enter Member ID"
  value={membersId}
  onChangeText={setMembersId}
  style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
/>

<Button
  title="Add Member"
  onPress={() => {
    addMembers(groupe.id, membersId);
  }}
/>



            {/* Afficher l'image de l'avatar */}
            <Image source={{ uri: groupe.avatar_urls.thumb }} style={styles.avatarImage} />

            {/* Afficher l'image de la couverture */}
            <Image source={{ uri: groupe.cover_url }} style={styles.coverImage} />

            {/* Afficher les détails des onglets */}
            <Text>Details:</Text>
            {groupe.details.map((tab) => (
              <View key={tab.id} style={{ marginLeft: 20 }}>
                <Text style={styles.boldText}>Title: {tab.title}</Text>
                <Text>Count: {tab.count}</Text>
                <Text>Link: {tab.link}</Text>
                {/* Affichez d'autres détails de l'onglet ici */}
              </View>
            ))}

            {/* Afficher les paramètres du groupe */}
            <Text>Group Settings:</Text>
            {groupSettings[groupe.id] && groupSettings[groupe.id].map((setting) => (
              <View key={setting.name} style={{ marginLeft: 20 }}>
                <Text style={styles.boldText}>Label: {setting.label}</Text>
                <Text>Name: {setting.name}</Text>
                <Text>Description: {setting.description}</Text>
                <Text>Type: {setting.type}</Text>
                <Text>Value: {setting.value}</Text>
                {/* Affichez d'autres détails du paramètre ici */}
              </View>
            ))}

            {/* Afficher les membres du groupe */}
            <Text>Members:</Text>
          {membres[groupe.id] ? (
            membres[groupe.id].map((membre) => (
              <View key={membre.id} style={{ marginLeft: 20 }}>
                <Text style={styles.boldText}>ID: {membre.id}</Text>
                <Text>Name: {membre.name}</Text>
                <Text>Login: {membre.user_login}</Text>
                {/* Affichez d'autres détails du membre ici */}
              </View>
            ))
          ) : (
            <Text>Loading members...</Text>
          )}
          <Button title="Fetch Members" onPress={() => fetchMembres(groupe.id)} />
          <Button title="Delete Group" onPress={() => deleteGroup(groupe.id)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default GroupesScreen;
