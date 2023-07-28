import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, TextInput, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';

const CreateDocuments = ({ navigation }) => {
  // State variables
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector(state => state.token);
  const isAdmin = useSelector(state => state.isAdmin);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  // Refs to track if document or folder delete action is being performed
  const docdelete = useRef(false);
  const folderdelete = useRef(false);

  // State variables to store the audio content of document and folder IDs (added for voice recognition)
  const [DocumentIdaudio, setDocumentIdaudio] = useState('');
  const [folderIdaudio, setfolderIdaudio] = useState('');

  // Function to convert words to numbers
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

  // Headers for API requests with authorization token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Function to check permission and start voice recognition
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
          // The user has denied the permission, show a message explaining why the permission is required
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // If the permission is blocked, ask the user to open the app settings and allow access manually
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  // Define voice recognition commands
  const commands = {
    'supprimer document': () => {
      if (!docdelete.current) {
        docdelete.current = true;
        console.log('Creating activity2 dans command:', docdelete.current);
      }
    },
    'supprimer dossier': () => {
      if (!folderdelete.current) {
        folderdelete.current = true;
        console.log('Creating activity2 dans command:', folderdelete.current);
      }
    },
  };

  // Function to execute a voice command
  const executeCommand = (command) => {
    setIsCommandExecuting(true);
    command();
    setIsCommandExecuting(false);
  };

  // Function to start voice recognition
  const startListening = async () => {
    try {
      setIsListening(true);
      setTranscription('');
      await Voice.start('fr-FR'); // for French language (you can change the language code accordingly)
    } catch (e) {
      console.error(e);
    }
  };

  // Function to stop voice recognition
  const stopListening = async () => {
    try {
      setIsListening(false);
      await Voice.stop();
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

  // Handle speech results from voice recognition
  Voice.onSpeechResults = (e) => {
    let speech = e.value ? e.value.join(' ') : '';

    // Filter the speech
    speech = speech.trim(); // Remove leading and trailing spaces
    speech = speech.replace(/\s+/g, ' '); // Remove multiple spaces
    speech = speech.toLowerCase(); // Convert to lowercase for easy command matching

    // Keep only the first word of each similar word sequence
    const words = speech.split(' ');
    const filteredWords = words.filter((word, index, self) => {
      // Return true if the word is the first of its similar word sequence
      return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
    });
    speech = filteredWords.join(' ');

    // Convert spoken words to numbers if applicable (e.g., 'one' to 1)
    speech = convertWordToNumber(speech);

    // Execute the recognized command if it exists in the commands object
    const commandFunc = commands[speech];
    if (commandFunc) {
      executeCommand(commandFunc);
    }

    setTranscription(speech);

    // If document or folder delete action is active, set the audio content of corresponding IDs
    if (docdelete.current) {
      setDocumentIdaudio(speech);
    }
    if (folderdelete.current) {
      setfolderIdaudio(speech);
    }
  };

  // Function to initialize delete action flags and audio content of IDs
  const Initialisation = async () => {
    docdelete.current = false;
    folderdelete.current = false;
    setDocumentIdaudio('');
    setfolderIdaudio('');
  };

  // Function to stop voice recognition and reset delete action flags and audio content of IDs
  const stopListeningAndResetRefs = () => {
    stopListening();
    Initialisation();
  };

  // Fetch documents and folders when the component mounts
  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    } else {
      fetchDocuments();
      fetchFolders();
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, [token, navigation, docdelete.current, folderdelete.current]);

  // Clean up voice recognition listeners when the component unmounts
  useEffect(() => {
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Function to fetch documents from the server
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/document', { headers });
      setDocuments(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to fetch folders from the server
  const fetchFolders = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/document/folder', { headers });
      setFolders(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to handle document deletion
  const handleDeleteDocument = async (documentId) => {
    setIsLoading(true);
    try {
      // Show a confirmation dialog
      Alert.alert(
        'Confirmation',
        'Are you sure you want to delete this document?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsLoading(false);
            },
          },
          {
            text: 'Delete',
            onPress: async () => {
              try {
                await axios.delete(
                  `https://q-rious.fr/wp-json/buddyboss/v1/document/${documentId}`,
                  { headers }
                );
                fetchDocuments();
                Alert.alert('Success', 'Document deleted successfully.');
              } catch (error) {
                console.error(error);
                setError(error);
                Alert.alert('Error', 'Failed to delete document. Please try again.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to delete document. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to handle folder deletion
  const handleDeleteFolder = async (folderId) => {
    setIsLoading(true);
    try {
      // Show a confirmation dialog
      Alert.alert(
        'Confirmation',
        'Are you sure you want to delete this folder?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsLoading(false);
            },
          },
          {
            text: 'Delete',
            onPress: async () => {
              try {
                await axios.delete(
                  `https://q-rious.fr/wp-json/buddyboss/v1/document/folder/${folderId}`,
                  { headers }
                );
                fetchFolders();
                Alert.alert('Success', 'Folder deleted successfully.');
              } catch (error) {
                console.error(error);
                setError(error);
                Alert.alert('Error', 'Failed to delete folder. Please try again.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to delete folder. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to handle document deletion using voice command
  const handleDeleteDocumentaudio = async (documentId) => {
    try {
      await axios.delete(
        `https://q-rious.fr/wp-json/buddyboss/v1/document/${documentId}`,
        { headers }
      );
      fetchDocuments();
      Alert.alert('Success', 'Document deleted successfully.');
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to delete document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle folder deletion using voice command
  const handleDeleteFolderaudio = async (folderId) => {
    setIsLoading(true);
    try {
      await axios.delete(
        `https://q-rious.fr/wp-json/buddyboss/v1/document/folder/${folderId}`,
        { headers }
      );
      fetchFolders();
      Alert.alert('Success', 'Folder deleted successfully.');
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to delete folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if(!isAdmin){
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
     
<View>
  <Text>Documents:</Text>
  {documents.map((document, index) => (
    <View key={index} style={{ marginBottom: 10 }}>
      <Text>ID: {document.id}</Text> 
      <Text>Title: {document.title}</Text>
      <Text>Activity ID: {document.activity_id}</Text>
      <Text>Group Name: {document.group_name}</Text>
      <Text>Download URL: {document.download_url}</Text>
                </View>
  ))}
</View>
<View>
  <Text>Folders:</Text>
  {folders.map((folder, index) => (
    <View key={index} style={{ marginBottom: 10 }}>
      <Text>ID: {folder.id}</Text>
      <Text>Title: {folder.title}</Text>
      <Text>Document URL: {folder.download_url}</Text>
      <Text>User Nicename: {folder.user_nicename}</Text>
    </View>
  ))}
</View>


</ScrollView>
    );
  }
          

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1}}>
            <Button title="Initialize before anything" onPress={() => {
  stopListeningAndResetRefs(); // Ajoutez cet appel avant de changer de page
}} />

      <View>
       <Text style={styles.text}>command</Text>
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
     
    
{docdelete.current && (
  <View>
    <Text style={styles.transcription}>Id of document delete</Text>
    <Text style={styles.activity}>{DocumentIdaudio}</Text>
    <Button title="Delete document audio" onPress={() => handleDeleteDocumentaudio(DocumentIdaudio)} />
  </View>
)}
{folderdelete.current && (
  <View>
    <Text style={styles.transcription}>ID of folder delete</Text>
    <Text style={styles.activity}>{folderIdaudio}</Text>
    <Button title="Delete folder audio" onPress={() => handleDeleteFolderaudio(folderIdaudio)} />
    </View>
)}
</View>
      <View>
        <Text>Documents:</Text>
        {documents.map((document, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text>ID: {document.id}</Text> 
            <Text>Title: {document.title}</Text>
            <Text>Activity ID: {document.activity_id}</Text>
            <Text>Group Name: {document.group_name}</Text>
            <Text>Download URL: {document.download_url}</Text>
            <Button title="Delete Document" onPress={() => handleDeleteDocument(document.id)} />
                      </View>
        ))}
      </View>
      <View>
        <Text>Folders:</Text>
        {folders.map((folder, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text>ID: {folder.id}</Text>
            <Text>Title: {folder.title}</Text>
            <Text>Document URL: {folder.download_url}</Text>
            <Text>User Nicename: {folder.user_nicename}</Text>
            <Button title="Delete Folder" onPress={() => handleDeleteFolder(folder.id)} />
          </View>
        ))}
      </View>


    </ScrollView>
  );
};

export default CreateDocuments;
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
 