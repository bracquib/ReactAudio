// CreateActivityScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Button, TextInput, ActivityIndicator, Alert,SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CreateActivityScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentsInputs, setCommentsInputs] = useState({});
  const [newPostContent, setNewPostContent] = useState(''); // Ajouté

  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    } else {
      fetchActivities();
    }
  }, [token, navigation]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://q-rious.fr/wp-json/buddyboss/v1/activity", { headers });
      const enrichedData = await enrichActivityData(response.data);
      setData(enrichedData);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  const enrichActivityData = async (activities) => {
    return Promise.all(activities.map(async activity => {
      const commentsResponse = await axios.get(`https://q-rious.fr/wp-json/buddyboss/v1/activity/${activity.id}/comment`, { headers });
      const comments = commentsResponse.data.comments;
  
      // Ajout d'une requête pour récupérer les documents avec l'activity_id correspondant
      const documentsResponse = await axios.get(`https://q-rious.fr/wp-json/buddyboss/v1/document?activity_id=${activity.id}`, { headers });
      const documents = documentsResponse.data.filter(document => document.activity_id === activity.id);
  
      return {...activity, comments, documents};
    }));
  };
  
  

  const handleFavorite = async (activityId) => {
    setIsLoading(true);
    try {
      await axios.patch(`https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}/favorite`, {}, { headers });
      fetchActivities();
    } catch (error) {
      console.error(error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async (activityId) => {
    setIsLoading(true);
    try {
      const currentComment = commentsInputs[activityId];
  
      if (!currentComment || !currentComment.trim()) {
        throw new Error(`Comment for activity ${activityId} is empty`);
      }
  
      const response = await axios.post(
        `https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}/comment`,
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
  

  const handleDeleteActivity = async (activityId) => {
    setIsLoading(true);
    try {
      await axios.delete(`https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}`, { headers });
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
  
  const [updateInputs, setUpdateInputs] = useState({}); // ajouté pour stocker les modifications d'activité

const handleUpdateActivity = async (activityId) => {
  setIsLoading(true);
  try {
    const currentContent = updateInputs[activityId];

    if (!currentContent || !currentContent.trim()) {
      throw new Error(`Updated content for activity ${activityId} is empty`);
    }

    await axios.patch(
      `https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}`,
      { content: currentContent },
      { headers }
    );
    Alert.alert('Success', 'Activity updated successfully.');
    fetchActivities();
  } catch (error) {
    console.error(error);
    setError(error);
    Alert.alert('Error', 'Failed to update activity. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  

const handleCreatePost = async (content) => {
  try {
    if (!content || !content.trim()) {
      throw new Error('New post content is empty');
    }

    await axios.post(
      `https://q-rious.fr/wp-json/buddyboss/v1/activity`,
      {
        content: content,
        component: 'activity',
        type: 'activity_update'
      },
      { headers }
    );
    Alert.alert('Success', 'Activity created successfully.');
    fetchActivities();
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Failed to create activity. Please try again.');
  }
};


  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>Une erreur est survenue : {error.message}</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        onChangeText={text => setNewPostContent(text)}
        value={newPostContent}
        placeholder="New post content"
      />
      <Button title="Create activity" onPress={() =>handleCreatePost(newPostContent)} />
               <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 20 }}>
            <Text>User: {item.name}</Text>
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
                  <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        onChangeText={text => setUpdateInputs(prevState => ({
          ...prevState,
          [item.id]: text,
        }))}
        value={updateInputs[item.id] || item.content.rendered}
      />
      <Button title="Update Activity" onPress={() => handleUpdateActivity(item.id)} />
          </View>
          
        )}
      />
    </SafeAreaView>
  );
};

export default CreateActivityScreen;
