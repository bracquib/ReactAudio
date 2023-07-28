import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';

const rootUrl = 'https://q-rious.fr'; // Replace this with your root URL

const MembersScreen = ({ navigation }) => {
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
  const [memberidaudio, setMemberIdaudio] = useState('');
  const deletecoveraudio = useRef(false);
  const deletememberaudio = useRef(false);

  // Function to check and request audio recording permission
  const checkPermissionAndStart = async () => {
    const checkPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    switch (checkPermission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available (on this device / in this context)');
        // Inform the user that the feature is not available
        break;
      case RESULTS.DENIED:
        console.log('The permission has not been requested / is denied but requestable');
        const requestPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestPermission === RESULTS.GRANTED) {
          startListening();
        } else {
          // The user denied the permission, show a message explaining why the permission is necessary
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // If the permission is blocked, ask the user to open the application settings and manually grant access
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  // Function to convert word representation of numbers to numeric values
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
        console.log('Creating activity2 in command:', deleteavataraudio.current);
      }
    },
    'supprimer couverture': () => {
      if (!deletecoveraudio.current) {
        deletecoveraudio.current = true;
        console.log('Creating activity2 in command:', deletecoveraudio.current);
      }
    },
    'supprimer membre': () => {
      if (!deletememberaudio.current) {
        deletememberaudio.current = true;
        console.log('Creating activity2 in command:', deletememberaudio.current);
      }
    },
  }

  // Function to execute a command
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
      await Voice.start('fr-FR'); // for French language
    } catch (e) {
      console.error(e);
    }
  };

  // Function to stop listening for voice input
  const stopListening = async () => {
    try {
      setIsListening(false);
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  // Function to calculate Levenshtein distance between two strings
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

  // Function to stop listening and reset command flags
  const stopListeningAndResetRefs = () => {
    stopListening();
    Initialisation();
  };

  // Callback for speech recognition results
  Voice.onSpeechResults = (e) => {
    let speech = e.value ? e.value.join(' ') : '';

    // Filtering the speech
    speech = speech.trim(); // Remove spaces before and after
    speech = speech.replace(/\s+/g, ' '); // Remove multiple spaces
    speech = speech.toLowerCase(); // Convert to lowercase for easy command matching

    // Keep only the first word of each sequence of similar words
    const words = speech.split(' ');
    const filteredWords = words.filter((word, index, self) => {
      // Return true if the word is the first of its sequence of similar words
      return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
    });
    speech = filteredWords.join(' ');
    speech = convertWordToNumber(speech);

    if (deleteavataraudio.current || deletecoveraudio.current || deletememberaudio.current) {
      console.log('activitycreating is true in result:', memberidaudio);
      console.log('activityCreating2 is true in result');
      setMemberIdaudio(speech);
      console.log('Content:', memberidaudio);
    }

    setTranscription(speech);

    const commandFunc = commands[speech];
    if (commandFunc) {
      executeCommand(commandFunc);
    }
  };

  // Function to reset the command flags and member ID
  const Initialisation = async () => {
    deleteavataraudio.current = false;
    deletecoveraudio.current = false;
    deletememberaudio.current = false;
    setMemberIdaudio('');
  }

  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    } else {
      fetchMembers();
      fetchMemberPermissions();
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, [token, navigation, deleteavataraudio.current, deletecoveraudio.current, deletememberaudio.current]);

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
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/avatar`, { headers });
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
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/cover`, { headers });
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
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${memberId}`, { headers });
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
  if (!isAdmin) {
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
        {/* Show member permissions */}
      </ScrollView>
    )
  }

  return (
    <ScrollView>
      <View>
        {/* Button to stop listening */}
        <Button title="Initialize before anything" onPress={() => {
          stopListeningAndResetRefs();
        }} />
        {/* Voice Dictation */}
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
        <Text>{transcription}</Text>

        {/* Show delete avatar audio */}
        {deleteavataraudio.current && (
          <View>
            <Text style={styles.transcription}>Please speak the ID of the avatar to be deleted.</Text>
            <Text style={styles.activity}>{memberidaudio}</Text>
            <Button title="Delete Avatar" onPress={() => handleDeleteAvatar(memberidaudio)} />
          </View>
        )}

        {/* Show delete cover audio */}
        {deletecoveraudio.current && (
          <View>
            <Text style={styles.transcription}>Please speak the ID of the cover to be deleted.</Text>
            <Text style={styles.activity}>{memberidaudio}</Text>
            <Button title="Delete Cover" onPress={() => handleDeleteCover(memberidaudio)} />
          </View>
        )}

        {/* Show delete member audio */}
        {deletememberaudio.current && (
          <View>
            <Text style={styles.transcription}>Please speak the ID of the user to be deleted.</Text>
            <Text style={styles.activity}>{memberidaudio}</Text>
            <Button title="Delete Member" onPress={() => handleDeleteMember(memberidaudio)} />
          </View>
        )}
      </View>

      {/* Show members and their details */}
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

      {/* Show member permissions */}
      <Text>Member Permissions:</Text>
      <Text>Can create activity: {memberPermissions.can_create_activity ? 'true' : 'false'}</Text>
      <Text>Can Create group: {memberPermissions.can_create_post ? 'true' : 'false'}</Text>
      <Text>can_join_group: {memberPermissions.can_join_group ? 'true' : 'false'}</Text>
      {/* ... (other member permissions) ... */}
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

 