import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert,ScrollView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const GroupesScreen =  ({ navigation }) => {
 const [groupes, setGroupes] = useState([]);
  const [membres, setMembres] = useState({});
  const [groupSettings, setGroupSettings] = useState({});
  const [membersId, setMembersId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  

  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector(state => state.token);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

    const deletegroup = useRef(false);
    const [groupidaudio,setgroupidaudio]=useState('');
    function convertWordToNumber(word) {
      const numberWords = {
        zero: 0, one: 1, two: 2, three: 3, four: 4,
        five: 5, six: 6, seven: 7, eight: 8, nine: 9
      };
    
      const words = word.trim().toLowerCase().split(' ');
    
      // Check for both numeric and word representation of numbers
      let convertedNumbers = words.map(word => {
        if (!isNaN(word)) {
          return parseInt(word);
        } else {
          return numberWords[word] || word; // Use the word as is if not found in the numberWords dictionary
        }
      });
    
      // If there is a single number, return it, otherwise, return the whole array of words
      if (convertedNumbers.length === 1) {
        return convertedNumbers[0];
      } else {
        const numericValues = convertedNumbers.filter(val => typeof val === 'number');
        return numericValues.length === 1 ? numericValues[0] : convertedNumbers.join(' ');
      }
    }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  const checkPermissionAndStart = async () => {
    const checkPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    switch (checkPermission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available (on this device / in this context)');
        // Informer l'utilisateur que la fonctionnalité n'est pas disponible
        break;
      case RESULTS.DENIED:
        console.log('The permission has not been requested / is denied but requestable');
        const requestPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestPermission === RESULTS.GRANTED) {
          startListening();
        } else {
          // L'utilisateur a refusé l'autorisation, afficher un message expliquant pourquoi l'autorisation est nécessaire
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // Si l'autorisation est bloquée, demander à l'utilisateur d'ouvrir les paramètres de l'application et d'autoriser l'accès manuellement
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  const commands = {
    'supprimer groupe': () => {
      if (!deletegroup.current) {
        deletegroup.current = true;
        console.log('Creating activity2 dans command:', deletegroup.current);
    
      }

    },
    
}

const executeCommand = (command) => {
  setIsCommandExecuting(true);
  command();
  setIsCommandExecuting(false);
};
const startListening = async () => {
  try {
    setIsListening(true);
    setTranscription('');
    await Voice.start('fr-FR'); // pour français
  } catch (e) {
    console.error(e);
  }
};

const stopListening = async () => {
  try {
    await Voice.stop();
    setIsListening(false);

  } catch (e) {
    console.error(e);
  }
};

function levenshteinDistance(a, b) {
  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }

  return matrix[b.length][a.length];
}

  Voice.onSpeechResults = (e) => {
    let speech = e.value ? e.value.join(' ') : '';

    // Filtrage du discours
    speech = speech.trim(); // Supprimer les espaces avant et après
    speech = speech.replace(/\s+/g, ' '); // Supprimer les espaces multiples
    speech = speech.toLowerCase(); // Convertir en minuscules pour faciliter la correspondance des commandes

    // Garder seulement le premier mot de chaque séquence de mots similaires
    const words = speech.split(' ');
    const filteredWords = words.filter((word, index, self) => {
      // Retourner true si le mot est le premier de sa séquence de mots similaires
      return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
    });
    speech = filteredWords.join(' ');
    speech = convertWordToNumber(speech);


    if (deletegroup.current) {
      console.log('activitycreating est vrai dans result  :', groupidaudio);
      console.log('activityCreating2 est vrai dans result');
      setgroupidaudio(speech);
      console.log('Content  :', groupidaudio);

    }


    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };
  const Initialisation = async () => {
    deletegroup.current = false;
    setgroupidaudio('');


}
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};
useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchGroupes();
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation,deletegroup.current]);
useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);


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
 <Button title="Go to Another Page" onPress={() => {
  stopListeningAndResetRefs(); // Ajoutez cet appel avant de changer de page
}} />
      <View>
       <Text style={styles.text}>Dictée vocale</Text>
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={() => {
          if (isListening) {
            stopListening();
          } else {
            checkPermissionAndStart();
          }
        }}
      >
         <Text style={styles.voiceButtonText}>{isListening ? 'Arrêter' : 'Démarrer'}</Text>
      </TouchableOpacity>
      <Text >{transcription}</Text>
      <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
            <Text style={styles.confirmButtonText}>initialiser</Text>
          </TouchableOpacity>
          {deletegroup.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du groupe qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{groupidaudio}</Text>
    <Button title="Delete group audio" onPress={() => deleteGroup(groupidaudio)} />
  </View>
)}
</View>
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
  