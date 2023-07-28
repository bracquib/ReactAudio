import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert,ScrollView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
const rootUrl = 'https://q-rious.fr'; 
const ReportScreen =  ({ navigation }) => {
  const token = useSelector(state => state.token);

  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  const reportmemberref = useRef(false);
  const [memberidaudio,setmemberidaudio]=useState('');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const [reportedMembers, setReportedMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
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
  const checkPermissionAndStart = async () => {
    const checkPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    switch (checkPermission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available (on this device / in this context)');
        break;
      case RESULTS.DENIED:
        console.log('The permission has not been requested / is denied but requestable');
        const requestPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestPermission === RESULTS.GRANTED) {
          startListening();
        } else {
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  const commands = {
    'reporter membre': () => {
      if (!reportmemberref.current) {
        reportmemberref.current = true;
        console.log('Creating activity2 dans command:', reportmemberref.current);
    
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
    await Voice.start('fr-FR'); 
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
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
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

    
    speech = speech.trim(); 
    speech = speech.replace(/\s+/g, ' '); 
        speech = speech.toLowerCase(); 

    const words = speech.split(' ');
    const filteredWords = words.filter((word, index, self) => {
      return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
    });
    speech = filteredWords.join(' ');
    speech = convertWordToNumber(speech);

    if (reportmemberref.current) {
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
    reportmemberref.current = false;

    setmemberidaudio('');

}
useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);
useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } 
  else{
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation,reportmemberref.current]);



  const handleReportMember = async () => {
    try {
      await axios.post(
        `${rootUrl}/wp-json/buddyboss/v1/moderation`,
        { "item_id": memberidaudio },
        { headers }
      );
      Alert.alert('Success', 'Member reported successfully.');
      setMemberId('');
    } catch (error) {
      Alert.alert('Error', 'Failed to report member. Please try again.');
      console.error(error);
    }
  };
  const handleReportMemberaudio = async () => {
    try {
      await axios.post(
        `${rootUrl}/wp-json/buddyboss/v1/moderation`,
        { "item_id": memberidaudio },
        { headers }
      );
      Alert.alert('Success', 'Member reported successfully.');
      setMemberId('');
    } catch (error) {
      Alert.alert('Error', 'Failed to report member. Please try again.');
      console.error(error);
    }
  };


  const isAdmin = useSelector((state) => state.isAdmin); // Get the isAdmin flag from Redux state

  if(!isAdmin){
    return (
      <View>

      <Text>Reported Members:</Text>
      {reportedMembers.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>Name: {member.name}</Text>
          <Text>Email: {member.user_email}</Text>
        </View>
      ))}

      <TextInput
        placeholder="Enter Member ID"
        value={memberidaudio}
        onChangeText={setMemberId}
        style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
      />

      <Button title="Report Member" onPress={handleReportMember} />
    </View>
    )
  }
  return (
    <View>
      <View>
        <Text style={styles.text}>Command</Text>
        <Button title="Initialize before anything" onPress={() => {
  stopListeningAndResetRefs(); 
}} />
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


          {reportmemberref.current && (
  <View>
    <Text style={styles.transcription}>ID of member reported</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="report member audio" onPress={() => handleReportMember} />
  </View>
)}
</View>

      <Text>Reported Members:</Text>
      {reportedMembers.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>Name: {member.name}</Text>
          <Text>Email: {member.user_email}</Text>
        </View>
      ))}

      <TextInput
        placeholder="Enter Member ID"
        value={memberidaudio}
        onChangeText={setMemberId}
        style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
      />

      <Button title="Report Member" onPress={handleReportMember} />
    </View>
  );
};

export default ReportScreen;
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
 