import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert,ScrollView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const MembersScreen =  ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({});
  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };


  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const deleteavataraudio = useRef(false);
  const [memberidaudio,setmemberidaudio] = useState('');
  const deletecoveraudio = useRef(false);
  const deletememberaudio = useRef(false);

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

  const commands = {
    'supprimer avatar': () => {
      if (!deleteavataraudio.current) {
        deleteavataraudio.current = true;
        console.log('Creating activity2 dans command:', deleteavataraudio.current);
    
      }

    },
    'supprimer couverture': () => {
      if (!deletecoveraudio.current) {
        deletecoveraudio.current = true;
        console.log('Creating activity2 dans command:', deletecoveraudio.current);
    
      }

    },
    'supprimer membre': () => {
      if (!deletememberaudio.current) {
        deletememberaudio.current = true;
        console.log('Creating activity2 dans command:', deletememberaudio.current);
    
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
    setIsListening(false);
    await Voice.stop();

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
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};

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

    if (deleteavataraudio.current || deletecoveraudio.current || deletememberaudio.current) {
      console.log('activitycreating est vrai dans result  :', memberidaudio);
      console.log('activityCreating2 est vrai dans result');
      setmemberidaudio(speech);
      console.log('Content  :', memberidaudio);

    }
   
    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };
  const Initialisation = async () => {
    deleteavataraudio.current = false;
    deletecoveraudio.current = false;
    deletememberaudio.current = false;
    setmemberidaudio('');

}

useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchMembers();
    fetchMemberPermissions();
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation,deleteavataraudio.current,deletecoveraudio.current,deletememberaudio.current]);
useEffect(() => {
  return () => {
    stopListening();
  };
}, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };
  const fetchMemberPermissions = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/members/me/permissions`);
      setMemberPermissions(response.data);
    } catch (error) {
      console.error('Error fetching member permissions:', error);
    }
  };

  const handleDeleteAvatar = async (userId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/avatar`,{headers});
      if (response.status === 200) {
        Alert.alert('Success', 'Avatar deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete avatar.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete avatar. Please try again.');
      console.error(error);
    }
  };
  
   const handleDeleteCover = async (userId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/cover`,{headers});
      if (response.status === 200) {
        Alert.alert('Success', 'Cover deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete cover.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete cover. Please try again.');
      console.error(error);
    }
  };
  
   const handleDeleteMember = async (memberId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${memberId}`,{headers});
      if (response.data.deleted) {
        Alert.alert('Success', 'Member deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete member.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete member. Please try again.');
      console.error(error);
    }
  };

  const isAdmin = useSelector((state) => state.isAdmin); // Get the isAdmin flag from Redux state
  if(!isAdmin){
    return (
      <ScrollView>
      
      <Text>Members:</Text>
      {members.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>ID:{member.id}</Text>
          <Text>Name: {member.name}</Text>
          <Text>admin: {member.is_wp_admin ? 'true' : 'false'}</Text>
          <Image source={{ uri: member.cover_url }} style={{ width: 200, height: 100 }} />
          
        </View>
      ))}
      <Text>Member Permissions:</Text>
      <Text>Can create activity: {memberPermissions.can_create_activity ? 'true' : 'false'}</Text>
      <Text>Can Create group: {memberPermissions.can_create_post ? 'true' : 'false'}</Text>
      <Text>can_join_group: {memberPermissions.can_join_group ? 'true' : 'false'}</Text>
      <Text>can_create_media: {memberPermissions.can_create_media ? 'true' : 'false'}</Text>
      <Text>can_create_forum_media: {memberPermissions.can_create_forum_media ? 'true' : 'false'}</Text>
      <Text>can_create_message_media: {memberPermissions.can_create_message_media ? 'true' : 'false'}</Text>
      <Text>can_create_document: {memberPermissions.can_create_document ? 'true' : 'false'}</Text>
      <Text>can_create_forum_document: {memberPermissions.can_create_forum_document ? 'true' : 'false'}</Text>
      <Text>can_create_message_document: {memberPermissions.can_create_message_document ? 'true' : 'false'}</Text>
      <Text>can_create_video: {memberPermissions.can_create_video ? 'true' : 'false'}</Text>
      <Text>can_create_forum_video: {memberPermissions.can_create_forum_video ? 'true' : 'false'}</Text>
      <Text>can_create_message_video: {memberPermissions.can_create_message_video ? 'true' : 'false'}</Text>
        
    
    
    </ScrollView>
    )
  }
  return (
    <ScrollView>
      <View>
      <Button title="click here to initialize" onPress={() => {
  stopListeningAndResetRefs(); // Ajoutez cet appel avant de changer de page
}} />
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

          {deleteavataraudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'avatar qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete avatar audio" onPress={() => handleDeleteAvatar(memberidaudio)} />
  </View>
)}
{deletecoveraudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du cover qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteCover(memberidaudio)} />
  </View>
)}
{deletememberaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'user qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteMember(memberidaudio)} />
  </View>
)}
</View>
      <Text>Members:</Text>
      {members.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>ID:{member.id}</Text>
          <Text>Name: {member.name}</Text>
          <Text>admin: {member.is_wp_admin ? 'true' : 'false'}</Text>
          <Image source={{ uri: member.cover_url }} style={{ width: 200, height: 100 }} />
          <Button title="Delete Avatar" onPress={() => handleDeleteAvatar(member.id)} />
          <Button title="Delete Cover" onPress={() => handleDeleteCover(member.id)} />
          <Button title="Delete Member" onPress={() => handleDeleteMember(member.id)} />
        </View>
      ))}
      <Text>Member Permissions:</Text>
      <Text>Can create activity: {memberPermissions.can_create_activity ? 'true' : 'false'}</Text>
      <Text>Can Create group: {memberPermissions.can_create_post ? 'true' : 'false'}</Text>
      <Text>can_join_group: {memberPermissions.can_join_group ? 'true' : 'false'}</Text>
      <Text>can_create_media: {memberPermissions.can_create_media ? 'true' : 'false'}</Text>
      <Text>can_create_forum_media: {memberPermissions.can_create_forum_media ? 'true' : 'false'}</Text>
      <Text>can_create_message_media: {memberPermissions.can_create_message_media ? 'true' : 'false'}</Text>
      <Text>can_create_document: {memberPermissions.can_create_document ? 'true' : 'false'}</Text>
      <Text>can_create_forum_document: {memberPermissions.can_create_forum_document ? 'true' : 'false'}</Text>
      <Text>can_create_message_document: {memberPermissions.can_create_message_document ? 'true' : 'false'}</Text>
      <Text>can_create_video: {memberPermissions.can_create_video ? 'true' : 'false'}</Text>
      <Text>can_create_forum_video: {memberPermissions.can_create_forum_video ? 'true' : 'false'}</Text>
      <Text>can_create_message_video: {memberPermissions.can_create_message_video ? 'true' : 'false'}</Text>
        
    
    
    </ScrollView>
  );
};

export default MembersScreen;
const styles = StyleSheet.create({
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
});

 