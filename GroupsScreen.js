import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';

const rootUrl = 'https://q-rious.fr'; // Replace this with your root URL

const GroupesScreen = ({ navigation }) => {
  // State variables for managing data
  const [groupes, setGroupes] = useState([]);
  const [membres, setMembres] = useState({});
  const [groupSettings, setGroupSettings] = useState({});
  const [membersId, setMembersId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State variables for voice recognition
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector(state => state.token);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  const deletegroup = useRef(false);
  const [groupidaudio, setgroupidaudio] = useState('');

  // Utility function to convert words to numbers
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

  // Headers for API requests
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Function to check permission for microphone and start listening for voice
  const checkPermissionAndStart = async () => {
    const checkPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    switch (checkPermission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available (on this device / in this context)');
        // Show a message to the user that the feature is not available
        break;
      case RESULTS.DENIED:
        console.log('The permission has not been requested / is denied but requestable');
        const requestPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestPermission === RESULTS.GRANTED) {
          startListening();
        } else {
          // The user denied permission, show a message explaining why permission is required
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // If permission is blocked, ask the user to open app settings and manually grant access
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  // Define a set of voice commands and their corresponding functions
  const commands = {
    'supprimer groupe': () => {
      if (!deletegroup.current) {
        deletegroup.current = true;
        console.log('Creating activity2 dans command:', deletegroup.current);
      }
    },
    // Add more commands here as needed
  };

  // Function to execute a given command
  const executeCommand = (command) => {
    setIsCommandExecuting(true);
    command();
    setIsCommandExecuting(false);
  };

  // Function to start listening for voice input
  const startListening = async () => {
    try {
      setIsListening(true);
      setTranscription('');
      await Voice.start('fr-FR'); // for French language, change to your desired language
    } catch (e) {
      console.error(e);
    }
  };

  // Function to stop listening for voice input
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Function to calculate the Levenshtein distance between two strings
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
// Event handler for speech recognition results
Voice.onSpeechResults = (e) => {
  let speech = e.value ? e.value.join(' ') : '';

  // Filtering the speech
  speech = speech.trim(); // Remove leading and trailing spaces
  speech = speech.replace(/\s+/g, ' '); // Remove multiple spaces
  speech = speech.toLowerCase(); // Convert to lowercase for easier command matching

  // Keep only the first word of each similar word sequence
  const words = speech.split(' ');
  const filteredWords = words.filter((word, index, self) => {
    // Return true if the word is the first of its similar word sequence
    return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
  });
  speech = filteredWords.join(' ');
  speech = convertWordToNumber(speech);

  // Handle specific commands
  if (deletegroup.current) {
    console.log('activitycreating est vrai dans result  :', groupidaudio);
    console.log('activityCreating2 est vrai dans result');
    setgroupidaudio(speech);
    console.log('Content  :', groupidaudio);
  }

  setTranscription(speech);

  // Check if the voice command matches any of the predefined commands
  const commandFunc = commands[speech];
  if (commandFunc) {
    executeCommand(commandFunc);
  }
};

// Function to initialize state variables when starting voice recognition
const Initialisation = async () => {
  deletegroup.current = false;
  setgroupidaudio('');
};

// Function to stop listening and reset references
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};

// Effect hook to check if the user is logged in and fetch group data
useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchGroupes();
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation, deletegroup.current]);

// Effect hook to clean up listeners when the component unmounts
useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);

// Function to delete a group
const deleteGroup = async (groupId) => {
  try {
    const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}`, {
      data: {
        id: groupId,
        delete_group_forum: true
      },
      headers,
    });

    // Check the response to see if the deletion was successful
    if (response.data.deleted) {
      // Remove the group from the list of groups
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

// Function to fetch groups data from the API
const fetchGroupes = async () => {
  try {
    const response = await fetch(`${rootUrl}/wp-json/buddyboss/v1/groups/`);
    const data = await response.json();

    // Fetch additional details and settings for each group in parallel
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

// Function to fetch group details from the API
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

// Function to fetch group settings from the API
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

// Function to fetch group members from the API
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

// Function to add a member to a group
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


  const styles = StyleSheet.create({
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
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      position: 'absolute',
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: '#FFF',
      fontSize: 18,
    },
    voiceButton: {
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 5,
      marginBottom: 20,
    },
    voiceButtonText: {
      color: '#FFF',
      fontSize: 18,
    },
    text: {
      textAlign: 'center',
      color: '#333333',
      marginBottom: 5,
    },
    transcription: {
      textAlign: 'center',
      color: '#333333',
      marginBottom: 5,
      fontSize: 18,
    },
    activity: {
      textAlign: 'center',
      color: '#333333',
      marginBottom: 5,
      fontSize: 18,
    },
    itemContainer: {
      borderWidth: 1,
      borderColor: 'gray',
      padding: 10,
      marginBottom: 20,
    },
  });
  const isAdmin = useSelector(state => state.isAdmin);

  if(!isAdmin){
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
           <View>
             <Text>Groupes:</Text>
             {groupes.map((groupe) => (
               <View key={groupe.id}>
                 <Text style={styles.boldText}>Name: {groupe.name}</Text>
                 <Text>ID: {groupe.id}</Text>
                 <Text>Link: {groupe.link}</Text>
                 <Text>Members Count: {groupe.members_count}</Text>
     
     
     
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
               </View>
             ))}
           </View>
         </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
 <Button title="Initialize before anything" onPress={() => {
  stopListeningAndResetRefs(); // Ajoutez cet appel avant de changer de page
}} />
      <View>
       <Text style={styles.text}>Command</Text>
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
         <Text style={styles.voiceButtonText}>{isListening ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
      <Text >{transcription}</Text>
  
          {deletegroup.current && (
  <View>
    <Text style={styles.transcription}>ID of group delete</Text>
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
  