import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';

const rootUrl = 'https://q-rious.fr'; // Replace with your root URL

const CreateActivityScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentsInputs, setCommentsInputs] = useState({});
  const [newPostContent, setNewPostContent] = useState('');
  const [updateInputs, setUpdateInputs] = useState({});
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector((state) => state.token);
  const isAdmin = useSelector((state) => state.isAdmin);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const activityCreatingRef = useRef(false);
  const [activityContent, setActivityContent] = useState('');
  const activityDeleteRef = useRef(false);
  const [activityidaudio, setActivityidaudio] = useState('');
  const activityfavouriteRef = useRef(false);
  const activityCommentRef = useRef(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Function to convert words to numbers (e.g., one, two, three -> 1, 2, 3)
  function convertWordToNumber(word) {
    // Dictionary of number words and their numeric values
    const numberWords = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9
    };

    // Split the word into individual words
    const words = word.trim().toLowerCase().split(' ');

    // Check for both numeric and word representation of numbers
    let convertedNumbers = words.map(word => {
      if (!isNaN(word)) {
        return parseInt(word); // Convert numeric words to numbers
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

  // Function to check permission for audio recording and start listening
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
          // User has denied the permission, show a message explaining why the permission is necessary
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // If the permission is blocked, ask the user to open the app settings and manually grant the access
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  // Commands to be recognized by the voice recognition system
  const commands = {
    'créer activité': () => {
      if (!activityCreatingRef.current) {
        activityCreatingRef.current = true;
        console.log('Creating activity2 in command:', activityCreatingRef.current);
      }
    },
    'supprimer activité': () => {
      if (!activityDeleteRef.current) {
        activityDeleteRef.current = true;
        console.log('Creating activity2 in command:', activityDeleteRef.current);
      }
    },
    'aimer activité': () => {
      if (!activityfavouriteRef.current) {
        activityfavouriteRef.current = true;
        console.log('Creating activity2 in command:', activityfavouriteRef.current);
      }
    },
  };

  // Execute the recognized command
  const executeCommand = (command) => {
    setIsCommandExecuting(true);
    command();
    setIsCommandExecuting(false);
  };

  // Start listening for voice commands
  const startListening = async () => {
    try {
      setIsListening(true);
      setTranscription('');
      await Voice.start('fr-FR'); // for French language
    } catch (e) {
      console.error(e);
    }
  };

  // Stop listening for voice commands
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
 // Event handler for speech recognition results
 Voice.onSpeechResults = (e) => {
  let speech = e.value ? e.value.join(' ') : '';

  // Filtering the speech
  speech = speech.trim(); // Remove leading and trailing spaces
  speech = speech.replace(/\s+/g, ' '); // Remove multiple spaces
  speech = speech.toLowerCase(); // Convert to lowercase for easy command matching

  // Keeping only the first word of each sequence of similar words
  const words = speech.split(' ');
  const filteredWords = words.filter((word, index, self) => {
    // Return true if the word is the first of its similar word sequence
    return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
  });
  speech = filteredWords.join(' ');
  speech = convertWordToNumber(speech);

  if (activityCreatingRef.current) {
    console.log('activitycreating is true in result:', activityContent);
    console.log('activityCreating2 is true in result');
    setActivityContent(speech);
    console.log('Content:', activityContent);
  }
  if (activityDeleteRef.current || activityfavouriteRef) {
    console.log('activitycreating is true in result:', activityidaudio);
    console.log('activityCreating2 is true in result');
    setActivityidaudio(speech);
    console.log('Content:', activityidaudio);
  }

  setTranscription(speech);

  const commandFunc = commands[speech];
  if (commandFunc) {
    executeCommand(commandFunc);
  }
};

// Function to initialize activity flags and inputs
const Initialisation = async () => {
  activityCreatingRef.current = false;
  activityDeleteRef.current = false;
  activityfavouriteRef.current = false;
  setActivityidaudio('');
  setActivityContent('');
};

// Function to stop listening and reset activity flags and inputs
const stopListeningAndResetRefs = () => {
  stopListening();
  Initialisation();
};

useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } else {
    fetchActivities();
    Voice.destroy().then(Voice.removeAllListeners);
  }
}, [token, navigation, activityCreatingRef.current, activityDeleteRef.current, activityfavouriteRef.current]);

useEffect(() => {
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, []);

// Function to fetch activities from the server
const fetchActivities = async () => {
  setIsLoading(true);
  try {
    const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/activity`, { headers });
    const enrichedData = await enrichActivityData(response.data);
    setData(enrichedData);
    setIsLoading(false);
  } catch (error) {
    console.error(error);
    setError(error);
    setIsLoading(false);
  }
};

// Function to enrich activity data with comments and documents
const enrichActivityData = async (activities) => {
  return Promise.all(activities.map(async activity => {
    const commentsResponse = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/activity/${activity.id}/comment`, { headers });
    const comments = commentsResponse.data.comments;

    // Fetch documents with the corresponding activity_id
    const documentsResponse = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/document?activity_id=${activity.id}`, { headers });
    const documents = documentsResponse.data.filter(document => document.activity_id === activity.id);

    return { ...activity, comments, documents };
  }));
};

// Function to handle adding a comment to an activity
const handleComment = async (activityId) => {
  setIsLoading(true);
  try {
    const currentComment = commentsInputs[activityId];

    if (!currentComment || !currentComment.trim()) {
      throw new Error(`Comment for activity ${activityId} is empty`);
    }

    const response = await axios.post(
      `${rootUrl}/wp-json/buddyboss/v1/activity/${activityId}/comment`,
      { content: currentComment },
      { headers }
    );

    if (response.status === 201) {
      fetchActivities();
      setCommentsInputs(prevState => ({
        ...prevState,
        [activityId]: '',
      }));
      Alert.alert('Success', 'Comment created successfully.');
    } else {
      throw new Error('Failed to create comment');
    }
  } catch (error) {
    console.error(error);
    setError(error);
    Alert.alert('Error', 'Failed to create comment. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Function to handle creating a new post (activity)
const handleCreatePost = async () => {
  try {
    if (!newPostContent || !newPostContent.trim()) {
      throw new Error(`New post content is empty`);
    }

    await axios.post(
      `${rootUrl}/wp-json/buddyboss/v1/activity`,
      {
        content: newPostContent,
        component: 'activity',
        type: 'activity_update',
      },
      { headers }
    );
    Alert.alert('Success', 'Activity created successfully.');
    setNewPostContent('');
    fetchActivities();
  } catch (error) {
    Alert.alert('Error', 'Failed to create activity. Please try again.');
    console.error(error);
  }
};

// Function to handle creating an activity using voice input
const handleCreatePostaudio = async () => {
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

// Function to handle liking an activity
const handleFavorite = async (activityId) => {
  setIsLoading(true);
  try {
    await axios.patch(`${rootUrl}/wp-json/buddyboss/v1/activity/${activityId}/favorite`, {}, { headers });
    fetchActivities();
  } catch (error) {
    console.error(error);
    setError(error);
  } finally {
    setIsLoading(false);
  }
};

// Function to handle deleting an activity
const handleDeleteActivity = async (activityId) => {
  setIsLoading(true);
  try {
    await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/activity/${activityId}`, { headers });
    Alert.alert('Success', 'Activity deleted successfully.');
    fetchActivities();
  } catch (error) {
    console.error(error);
    setError(error);
    Alert.alert('Error', 'Failed to delete activity. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


if(!isAdmin){
  return (
    <ScrollView style={{ flex: 1}}>
    <View>
    <TextInput
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => setNewPostContent(text)}
      value={newPostContent}
      placeholder="New post content"
    />
    <Button title="Create activity" onPress={handleCreatePost} />
    <Button title="Initialize before anything" onPress={() => {
stopListeningAndResetRefs(); 
}} />

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
      <Text style={styles.voiceButtonText}>{isListening ? 'stop' : 'start'}</Text>
    </TouchableOpacity>
    <Text >{transcription}</Text>

        {activityCreatingRef.current && (
<View>
  <Text style={styles.transcription}>activity content:</Text>
  <Text style={styles.activity}>{activityContent}</Text>
  <TouchableOpacity style={styles.confirmButton} onPress={handleCreatePostaudio}>
    <Text style={styles.confirmButtonText}>Confirm</Text>
  </TouchableOpacity>
</View>
)}

{activityfavouriteRef.current && (
<View>
  <Text style={styles.transcription}>ID of activity to like</Text>
  <Text style={styles.activity}>{activityidaudio}</Text>
  <Button title="like Activity audio" onPress={() => handleFavorite(activityidaudio)} />
</View>
)}

</View>



             <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}> 
        <Text>User: {item.name}</Text>
          <Text>ID activity: {item.id}</Text>
          <Text>{item.content.rendered}</Text>
          <Text>Documents:</Text>
  <FlatList
    data={item.documents}
    keyExtractor={(document) => document.id.toString()}
    renderItem={({ item: document }) => (
      <View style={{ marginLeft: 20 }}>
        <Text>Title: {document.title}</Text>
          <Text>Activity ID: {document.activity_id}</Text>
          <Text>Group Name: {document.group_name}</Text>
          <Text>Download URL: {document.download_url}</Text>
      </View>
    )}
  />
          <Text>Favorite count: {item.favorite_count}</Text>
          <Button title="Favorite" onPress={() => handleFavorite(item.id)} />
          
          <Text>Comments:</Text>
          <FlatList
            data={item.comments}
            keyExtractor={(comment) => comment.id.toString()}
            renderItem={({ item: comment }) => (
              <View style={{ marginLeft: 20 }}>
                <Text>User: {comment.name}</Text>
                <Text>Content: {comment.content.rendered}</Text>
              </View>
            )}
          />
               
        </View>
        
      )}
    />
  </ScrollView>
);
};
    

  return (
    <ScrollView style={{ flex: 1 }}>
      <View>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        onChangeText={text => setNewPostContent(text)}
        value={newPostContent}
        placeholder="New post content"
      />
      <Button title="Create activity" onPress={handleCreatePost} />
      <Button title="Initialize before anything" onPress={() => {
  stopListeningAndResetRefs();
}} />

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
          {activityCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Activity content:</Text>
    <Text style={styles.activity}>{activityContent}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreatePostaudio}>
      <Text style={styles.confirmButtonText}>Confirm</Text>
    </TouchableOpacity>
  </View>
)}
{activityDeleteRef.current && (
  <View>
    <Text style={styles.transcription}>ID of activity that is delete</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteActivity(activityidaudio)} />
  </View>
)}
{activityfavouriteRef.current && (
  <View>
    <Text style={styles.transcription}>ID of activity that is like.</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
    <Button title="like Activity audio" onPress={() => handleFavorite(activityidaudio)} />
  </View>
)}

</View>



               <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}> 
            <Text>User: {item.name}</Text>
            <Text>ID activity: {item.id}</Text>
            <Text>{item.content.rendered}</Text>
            <Text>Documents:</Text>
    <FlatList
      data={item.documents}
      keyExtractor={(document) => document.id.toString()}
      renderItem={({ item: document }) => (
        <View style={{ marginLeft: 20 }}>
          <Text>Title: {document.title}</Text>
            <Text>Activity ID: {document.activity_id}</Text>
            <Text>Group Name: {document.group_name}</Text>
            <Text>Download URL: {document.download_url}</Text>
        </View>
      )}
    />
            <Text>Favorite count: {item.favorite_count}</Text>
            <Button title="Favorite" onPress={() => handleFavorite(item.id)} />
            <TextInput placeholder="here you comment"
              style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
              onChangeText={text => setCommentsInputs(prevState => ({
                ...prevState,
                [item.id]: text,
              }))}
              value={commentsInputs[item.id] || ''}
            />
            <Button title="Comment" onPress={() => handleComment(item.id)} />
            <Text>Comments:</Text>
            <FlatList
              data={item.comments}
              keyExtractor={(comment) => comment.id.toString()}
              renderItem={({ item: comment }) => (
                <View style={{ marginLeft: 20 }}>
                  <Text>User: {comment.name}</Text>
                  <Text>Content: {comment.content.rendered}</Text>
                </View>
              )}
            />
                  <Button title="Delete Activity" onPress={() => handleDeleteActivity(item.id)} />
                 
          </View>
          
        )}
      />
    </ScrollView>
  );
};

export default CreateActivityScreen;
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
  itemContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 20,
  },
});

