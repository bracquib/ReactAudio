// Importing required libraries and modules from React Native and other dependencies
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';

// Set the root URL for API requests
const rootUrl = 'https://q-rious.fr'; // Replace this with your root URL

// MediaScreen component definition
const MediaScreen = ({ navigation }) => {
  // State variables using useState hook to manage various data in the component
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [mediaDetails, setMediaDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumPrivacy, setNewAlbumPrivacy] = useState('public');

  // Get the token and isAdmin flag from Redux state using useSelector
  const token = useSelector((state) => state.token);
  const isAdmin = useSelector((state) => state.isAdmin);

  // State variables to manage voice recognition and execution of voice commands
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  // Refs to keep track of various processes during voice recognition
  const albumCreatingRef = useRef(false);
  const deleteAlbumaudio = useRef(false);
  const [albumidaudio, setalbumidaudio] = useState('');
  const deletephotoaudio = useRef(false);
  const [photoidaudio, setphotoidaudio] = useState('');

  // Headers for API requests with authorization token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Function to check and request RECORD_AUDIO permission before starting voice recognition
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
          // User denied the permission, show a message explaining why the permission is necessary
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // If the permission is blocked, prompt the user to open app settings and manually grant access
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  // Function to convert words to numbers (e.g., convert "one" to 1)
  function convertWordToNumber(word) {
    const numberWords = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9
    };

    const words = word.trim().toLowerCase().split(' ');

    // Check for both numeric and word representations of numbers
    let convertedNumbers = words.map(word => {
      if (!isNaN(word)) {
        return parseInt(word);
      } else {
        return numberWords[word] || word; // Use the word as is if not found in the numberWords dictionary
      }
    });

    // If there is a single number, return it; otherwise, return the whole array of words
    if (convertedNumbers.length === 1) {
      return convertedNumbers[0];
    } else {
      const numericValues = convertedNumbers.filter(val => typeof val === 'number');
      return numericValues.length === 1 ? numericValues[0] : convertedNumbers.join(' ');
    }
  }

  // Dictionary of voice commands and their corresponding functions
  const commands = {
    'créer album': () => {
      if (!albumCreatingRef.current) {
        albumCreatingRef.current = true;
        console.log('Creating folder in command:', albumCreatingRef.current);
      }
    },
    'supprimer album': () => {
      if (!deleteAlbumaudio.current) {
        deleteAlbumaudio.current = true;
        console.log('Creating folder in command:', deleteAlbumaudio.current);
      }
    },
    'supprimer photos': () => {
      if (!deletephotoaudio.current) {
        deletephotoaudio.current = true;
        console.log('Creating folder in command:', deletephotoaudio.current);
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
      await Voice.start('fr-FR'); // for French language, change the language code as needed
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
// Event listener for voice recognition results
Voice.onSpeechResults = (e) => {
  let speech = e.value ? e.value.join(' ') : '';

  // Filtering the speech
  speech = speech.trim(); // Remove leading and trailing spaces
  speech = speech.replace(/\s+/g, ' '); // Remove multiple spaces
  speech = speech.toLowerCase(); // Convert to lowercase for easy command matching

  // Keeping only the first word of each sequence of similar words
  const words = speech.split(' ');
  const filteredWords = words.filter((word, index, self) => {
    // Return true if the word is the first of its sequence of similar words
    return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
  });
  speech = filteredWords.join(' ');
  speech = convertWordToNumber(speech);

  // Handling specific commands using the dictionary of commands
  if (albumCreatingRef.current) {
    console.log('albumCreating is true in result:', newAlbumTitle);
    console.log('albumCreatingRef.current is true in result');
    setNewAlbumTitle(speech);
    console.log('Content:', newAlbumTitle);
  }

  if (deleteAlbumaudio.current) {
    console.log('deleteAlbumaudio is true in result:', albumidaudio);
    console.log('deleteAlbumaudio.current is true in result');
    setalbumidaudio(speech);
    console.log('Content:', albumidaudio);
  }

  if (deletephotoaudio.current) {
    console.log('deletephotoaudio is true in result:', photoidaudio);
    console.log('deletephotoaudio.current is true in result');
    setphotoidaudio(speech);
    console.log('Content:', photoidaudio);
  }

  setTranscription(speech);

  // Execute the command function if it exists in the dictionary of commands
  const commandFunc = commands[speech];
  if (commandFunc) {
    executeCommand(commandFunc);
  }
};

// Function to reset various state variables and refs for voice recognition
const Initialisation = async () => {
  albumCreatingRef.current = false;
  deleteAlbumaudio.current = false;
  deletephotoaudio.current = false;

  setcurrentContentaudio('');
  setNewAlbumTitle('');
  setalbumidaudio('');
  setphotoidaudio('');
};

// Fetch albums, photos, and media details from the API
useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchAlbums();
    fetchPhotos();
    fetchMediaDetails();
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation, albumCreatingRef.current, deleteAlbumaudio.current, deletephotoaudio.current]);

// Clean up the Voice instance when the component is unmounted
useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);

// Fetch the list of albums from the API
const fetchAlbums = async () => {
  setIsLoading(true);

  try {
    const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/media/albums/`);
    setAlbums(response.data);
    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching albums:', error);
    setError('Failed to fetch albums. Please try again.');
  }
};

// Fetch the list of photos from the API
const fetchPhotos = async () => {
  try {
    const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/media/`);
    setPhotos(response.data);
  } catch (error) {
    console.error('Error fetching photos:', error);
    setError('Failed to fetch photos. Please try again.');
  }
};

// Fetch media details from the API
const fetchMediaDetails = async () => {
  try {
    const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/media/details`);
    setMediaDetails(response.data);
  } catch (error) {
    console.error('Error fetching media details:', error);
    setError('Failed to fetch media details. Please try again.');
  }
};

// Function to handle the creation of a new album
const handleCreateAlbum = async () => {
  try {
    const data = {
      title: newAlbumTitle,
    };

    const response = await axios.post(`${rootUrl}/wp-json/buddyboss/v1/media/albums`, data, { headers });
    const createdAlbum = response.data.album;
    Alert.alert('Success', 'Album created successfully.');
    setNewAlbumTitle('');
    fetchAlbums();
  } catch (error) {
    Alert.alert('Error', 'Failed to create the album. Please try again.');
    console.error(error);
  }
};

// Function to handle the deletion of an album
const handleDeleteAlbum = async (albumId) => {
  try {
    const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/media/albums/${albumId}`, { headers });
    if (response.data.deleted) {
      Alert.alert('Success', 'Album deleted successfully.');
      fetchAlbums();
    } else {
      throw new Error('Failed to delete the album.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to delete the album. Please try again.');
    console.error(error);
  }
};

// Function to handle the deletion of a photo
const handleDeletePhoto = async (photoId) => {
  try {
    const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/media/${photoId}`, { headers });
    if (response.data.deleted) {
      Alert.alert('Success', 'Photo deleted successfully.');
      fetchPhotos();
    } else {
      throw new Error('Failed to delete the photo.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to delete the photo. Please try again.');
    console.error(error);
  }
};

// Function to stop voice recognition and reset refs
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};

// Function to handle updating the title of an album
const handleUpdateAlbumTitle = async (albumId) => {
  try {
    const data = {
      id: albumId,
      title: newAlbumTitle
    };

    const response = await axios.patch(`${rootUrl}/wp-json/buddyboss/v1/media/albums/${albumId}`, data, { headers });
    if (response.data.updated) {
      Alert.alert('Success', 'Album title updated successfully.');
      setNewAlbumTitle('');
      fetchAlbums();
    } else {
      throw new Error('Failed to update the album title.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to update the album title. Please try again.');
    console.error(error);
  }
};


if(!isAdmin){
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1}}>  
       <Text>Albums:</Text>
        {albums.map((album) => (
          <View key={album.id}>
            <Text>ID: {album.id}</Text>
            <Text>Title: {album.title}</Text>
          </View>
        ))}
  
        <Text>Photos:</Text>
        {photos.map((photo) => (
          <View key={photo.id}>
            <Text>ID: {photo.id}</Text>
            <Text>Title: {photo.title}</Text>
            <Image source={{ uri: photo.attachment_data.thumb }} style={{ width: 200, height: 200 }} />
          </View>
        ))}
  
           </ScrollView>
  )
}


  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1}}>
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

          {albumCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Title of Album:</Text>
    <Text style={styles.activity}>{newAlbumTitle}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreateAlbum}>
      <Text style={styles.confirmButtonText}>Confirm</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
      <Text style={styles.confirmButtonText}>Initialize</Text>
    </TouchableOpacity>
    </View>
)}
{deleteAlbumaudio.current && (
  <View>
    <Text style={styles.transcription}>ID of album delete</Text>
    <Text style={styles.activity}>{albumidaudio}</Text>
    <Button title="Delete album audio" onPress={() => handleDeleteAlbum(albumidaudio)} />
  </View>
)}
{deletephotoaudio.current && (
  <View>
    <Text style={styles.transcription}>ID of picture delete</Text>
    <Text style={styles.activity}>{photoidaudio}</Text>
    <Button title="Delete picture audio" onPress={() => handleDeletePhoto(photoidaudio)} />
  </View>
)}

      <Text>Create Album:</Text>
      <TextInput
        placeholder="Enter Album Title"
        value={newAlbumTitle}
        onChangeText={setNewAlbumTitle}
        style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
      />



      <Button title="Create Album" onPress={handleCreateAlbum} />

     <Text>Albums:</Text>
      {albums.map((album) => (
        <View key={album.id}>
          <Text>ID: {album.id}</Text>
          <Text>Title: {album.title}</Text>
          <Button title="Delete Album" onPress={() => handleDeleteAlbum(album.id)} />

          <TextInput
            placeholder="Enter New Album Title"
            value={newAlbumTitle}
            onChangeText={setNewAlbumTitle}
            style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
          />
          <Button title="Update Album Title" onPress={() => handleUpdateAlbumTitle(album.id)} />
        </View>
      ))}

      <Text>Photos:</Text>
      {photos.map((photo) => (
        <View key={photo.id}>
          <Text>ID: {photo.id}</Text>
          <Text>Title: {photo.title}</Text>
          <Button title="Delete Photo" onPress={() => handleDeletePhoto(photo.id)} />
          <Image source={{ uri: photo.attachment_data.thumb }} style={{ width: 200, height: 200 }} />
        </View>
      ))}
  </View>
         </ScrollView>
  );
};

export default MediaScreen;
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
