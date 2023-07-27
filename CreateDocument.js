import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, TextInput, Alert, ScrollView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
const CreateDocuments = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector(state => state.token);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  const docdelete = useRef(false);
  const [DocumentIdaudio, setDocumentIdaudio] = useState(''); // Ajouté
  const folderdelete = useRef(false);
  const [folderIdaudio, setfolderIdaudio] = useState(''); // Ajouté

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
    
    if (docdelete.current ) {
      console.log('activitycreating est vrai dans result  :', DocumentIdaudio);
      console.log('activityCreating2 est vrai dans result');
      setDocumentIdaudio(speech);
      console.log('Content  :', DocumentIdaudio);

    }
    if (folderdelete.current ) {
      console.log('activitycreating est vrai dans result  :', folderIdaudio);
      console.log('activityCreating2 est vrai dans result');
      setfolderIdaudio(speech);
      console.log('Content  :', folderIdaudio);

    }

    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };
  const Initialisation = async () => {
    docdelete.current = false;
    folderdelete.current = false;
    setDocumentIdaudio('');
    setfolderIdaudio('');

}
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};

  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    } else {
      fetchDocuments();
      fetchFolders();
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, [token, navigation,docdelete.current,folderdelete.current]);
  useEffect(() => {
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

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


  const handleDeleteDocument = async (documentId) => {
    setIsLoading(true);
    try {
      // Afficher une boîte de dialogue de confirmation
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


  const handleDeleteFolder = async (folderId) => {
    setIsLoading(true);
    try {
      // Afficher une boîte de dialogue de confirmation
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
   const  handleDeleteFolderaudio = async (folderId) => {
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
  
          

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Button title="fetch folder" onPress={fetchFolders} />
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
    
{docdelete.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du document qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{DocumentIdaudio}</Text>
    <Button title="Delete document audio" onPress={() => handleDeleteDocumentaudio(DocumentIdaudio)} />
  </View>
)}
{folderdelete.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du folder qui doit être Supprimer.</Text>
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
 