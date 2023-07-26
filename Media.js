import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, Button, TextInput, Image, Alert,ScrollView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const MediaScreen  =({ navigation }) => {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [mediaDetails, setMediaDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumPrivacy, setNewAlbumPrivacy] = useState('public');

  const token = useSelector(state => state.token);


  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  const albumCreatingRef = useRef(false);
  const deleteAlbumaudio = useRef(false);
  const[albumidaudio,setalbumidaudio] = useState('');
  const deletephotoaudio = useRef(false);
  const[photoidaudio,setphotoidaudio] = useState('');



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
    'créer album': () => {
      if (!albumCreatingRef.current) {
        albumCreatingRef.current = true;
        console.log('Creating folder dans command:', albumCreatingRef.current);
    
      }

    },
    'supprimer album': () => {
      if (!deleteAlbumaudio.current) {
        deleteAlbumaudio.current = true;
        console.log('Creating folder dans command:', deleteAlbumaudio.current);
    
      }

    },
    'supprimer photos': () => {
      if (!deletephotoaudio.current) {
        deletephotoaudio.current = true;
        console.log('Creating folder dans command:', deletephotoaudio.current);
    
      }
    },


  };


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

    if (albumCreatingRef.current) {
      console.log('activitycreating est vrai dans result  :', newAlbumTitle);
      console.log('activityCreating2 est vrai dans result');
      setNewAlbumTitle(speech);
      console.log('Content  :', newAlbumTitle);

    }

    if(deleteAlbumaudio.current){
      console.log('activitycreating est vrai dans result  :', albumidaudio);
      console.log('activityCreating2 est vrai dans result');
      setalbumidaudio(speech);
      console.log('Content  :', albumidaudio);

    }
    if(deletephotoaudio.current){
      console.log('activitycreating est vrai dans result  :', photoidaudio);
      console.log('activityCreating2 est vrai dans result');
      setphotoidaudio(speech);
      console.log('Content  :', photoidaudio);

    }
   

    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };
  const Initialisation = async () => {
    albumCreatingRef.current = false;
    deleteAlbumaudio.current = false;
    deletephotoaudio.current = false;
   
    setcurrentContentaudio('');
    setNewAlbumTitle('');
    setalbumidaudio('');
    setphotoidaudio('');

}

useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchAlbums();
    fetchPhotos();
    fetchMediaDetails(); 
    Voice.destroy().then(Voice.removeAllListeners);

   }
}, [token, navigation,albumCreatingRef.current,deleteAlbumaudio.current,deletephotoaudio.current,]);

useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);

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

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/media/`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to fetch photos. Please try again.');
    }
  };

  const fetchMediaDetails = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/media/details`);
      setMediaDetails(response.data);
    } catch (error) {
      console.error('Error fetching media details:', error);
      setError('Failed to fetch media details. Please try again.');
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
    fetchAlbums();
  } catch (error) {
    Alert.alert('Error', 'Failed to create album. Please try again.');
    console.error(error);
  }
};

 const handleDeleteAlbum = async (albumId) => {
  try {
    const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/media/albums/${albumId}`, { headers });
    if (response.data.deleted) {
      Alert.alert('Success', 'Album deleted successfully.');
      fetchAlbums();
    } else {
      throw new Error('Failed to delete album.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to delete album. Please try again.');
    console.error(error);
  }
};

 const  handleDeletePhoto = async (photoId) => {
  try {
    const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/media/${photoId}`, { headers });
    if (response.data.deleted) {
     Alert.alert('Success', 'Photo deleted successfully.');
      fetchPhotos();
    } else {
      throw new Error('Failed to delete photo.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to delete photo. Please try again.');
    console.error(error);
  }
};


 const handleUpdateAlbumTitle = async (albumId) => {
  try {
    const data = {
      id: albumId,
      title: newAlbumTitle
    };

    const response = await axios.patch(`${rootUrl}/wp-json/buddyboss/v1/media/albums/${albumId}`, data, { headers});
    if (response.data.updated) {
      Alert.alert('Success', 'Album title updated successfully.');
      setNewAlbumTitle('');
      fetchAlbums();
    } else {
      throw new Error('Failed to update album title.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to update album title. Please try again.');
    console.error(error);
  }
};

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="fetch album" onPress={fetchAlbums} />
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
{deleteAlbumaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'album qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{albumidaudio}</Text>
    <Button title="Delete album audio" onPress={() => handleDeleteAlbum(albumidaudio)} />
  </View>
)}
{deletephotoaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de la photo qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{photoidaudio}</Text>
    <Button title="Delete photo audio" onPress={() => handleDeletePhoto(photoidaudio)} />
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
