import React, { useState, useEffect,useRef} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
import { useSelector } from 'react-redux';
import axios from 'axios';
const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const Audio = () => {
  const token = useSelector((state) => state.token);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#fff');
  const [isColorChanged, setIsColorChanged] = useState(false);
  const [buttonX, setButtonX] = useState(0);
  const [buttonY, setButtonY] = useState(0);
  const [activityContent, setActivityContent] = useState('');
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const activityCreatingRef = useRef(false);
  const folderCreatingRef = useRef(false);
  const albumCreatingRef = useRef(false);

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
  const [folderTitle, setFolderTitle] = useState('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  const commands = {
    'créer activité': () => {
      if (!activityCreatingRef.current) {
        activityCreatingRef.current = true;
        console.log('Creating activity2 dans command:', activityCreatingRef.current);
    
      }
    },
    'créer folder': () => {
      if (!folderCreatingRef.current) {
        folderCreatingRef.current = true;
        console.log('Creating folder dans command:', folderCreatingRef.current);
    
      }
    },
    'créer album': () => {
      if (!albumCreatingRef.current) {
        albumCreatingRef.current = true;
        console.log('Creating folder dans command:', albumCreatingRef.current);
    
      }
    },
    'bonjour': () => {
      if (!isColorChanged) {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        setBackgroundColor(color);
        setIsColorChanged(true);
      }
    },
    'test': () => {
      moveButton();
    },
  };

  useEffect(() => {
    console.log('Creating activity2 has changed to:', activityCreatingRef.current);
    console.log('Creating folder has changed to:', folderCreatingRef.current);
    console.log('Creating album has changed to:', albumCreatingRef.current);

  }, [activityCreatingRef.current,folderCreatingRef.current,albumCreatingRef.current]);
  
  const executeCommand = (command) => {
    setIsCommandExecuting(true);
    command();
    setIsCommandExecuting(false);
  };

  const moveButton = () => {
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const maxX = windowWidth - 100; // Max X position for the button
    const maxY = windowHeight - 100; // Max Y position for the button

    const newX = Math.floor(Math.random() * maxX);
    const newY = Math.floor(Math.random() * maxY);

    setButtonX(newX);
    setButtonY(newY);
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

    if (activityCreatingRef.current) {
      console.log('activitycreating est vrai dans result  :', activityContent);
      console.log('activityCreating2 est vrai dans result');
      setActivityContent(speech);
      console.log('Content  :', activityContent);

    }
    if (folderCreatingRef.current) {
      console.log('activitycreating est vrai dans result  :', folderTitle);
      console.log('activityCreating2 est vrai dans result');
      setFolderTitle(speech);
      console.log('Content  :', folderTitle);

    }
    if (albumCreatingRef.current) {
      console.log('activitycreating est vrai dans result  :', newAlbumTitle);
      console.log('activityCreating2 est vrai dans result');
      setNewAlbumTitle(speech);
      console.log('Content  :', newAlbumTitle);

    }
    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };

  const Initialisation = async () => {
      activityCreatingRef.current = false;
      folderCreatingRef.current = false;
      albumCreatingRef.current = false;
      setActivityContent('');
      setFolderTitle('');
      setNewAlbumTitle('');
  }
  const handleCreatePost = async () => {
    try {
      if (!activityContent || !activityContent.trim()) {
        throw new Error('Activity content is empty');
      }

      await axios.post(
        `${rootUrl}/wp-json/buddyboss/v1/activity`,
        {
          content: activityContent,
          component: 'activity',
          type: 'activity_update',
        },
        { headers }
      );
      Alert.alert('Success', 'Activity created successfully.');
      setActivityContent('');
      activityCreatingRef.current = false;
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create activity. Please try again.');
    }
  };
  const createFolder = async () => {
    setIsLoading(true);
    try {
      if (!folderTitle || !folderTitle.trim()) {
        throw new Error('Folder title is empty');
      }

      const response = await axios.post(
        'https://q-rious.fr/wp-json/buddyboss/v1/document/folder',
        { title: folderTitle },
        { headers }
      );

      if (response.status === 201) {
        Alert.alert('Success', 'Folder created successfully.');
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    }
  };
  const handleCreateAlbum = async () => {
    try {
      const data = {
        title: newAlbumTitle,
      };

      const response = await axios.post(`${rootUrl}/wp-json/buddyboss/v1/media/albums`, data, { headers });
      const createdAlbum = response.data.album;
      Alert.alert('Success', 'Album created successfully.');
      setNewAlbumTitle('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create album. Please try again.');
      console.error(error);
    }
  };
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

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>Dictée vocale</Text>
      <TouchableOpacity
        style={[styles.button, { top: buttonY, left: buttonX }]}
        onPress={moveButton}
      >
        <Text style={styles.buttonText}>Move me</Text>
      </TouchableOpacity>
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
          {activityCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le contenu de l'activité.</Text>
    <Text style={styles.activity}>{activityContent}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreatePost}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
      <Text style={styles.confirmButtonText}>Initialiser</Text>
    </TouchableOpacity>
  </View>
)}
   {folderCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le titre du folder.</Text>
    <Text style={styles.activity}>{folderTitle}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={createFolder}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
      <Text style={styles.confirmButtonText}>Initialiser</Text>
    </TouchableOpacity>
  </View>
)}
{albumCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le titre du album.</Text>
    <Text style={styles.activity}>{newAlbumTitle}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreateAlbum}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
      <Text style={styles.confirmButtonText}>Initialiser</Text>
    </TouchableOpacity>
    </View>
)}

    </View>
  );
};


export default Audio;
