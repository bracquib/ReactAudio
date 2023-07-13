import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert, ScrollView, Image } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const MentionsAndComponentsScreen = ({ navigation }) => {
  const [mentions, setMentions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [componentName, setComponentName] = useState('');
  const [action, setAction] = useState('');
  const [username, setUsername] = useState('');
  const [components, setComponents] = useState([]);
  const [term, setTerm] = useState(''); // ajoutez ceci pour stocker la valeur de recherche
  const token = useSelector(state => state.token);


  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    }
  }, [token, navigation]);

  const fetchMentions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/mention', 
        { 
          params: { term: term },
          headers 
        }
      );
      setMentions(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };
  
  

  const fetchComponents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://q-rious.fr/wp-json/buddyboss/v1/components`, { headers });
      setComponents(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSearchMentions = () => {
    fetchMentions();
  };

  const updateComponent = async () => {
    setIsLoading(true);
    try {
      const response = await axios.patch('https://q-rious.fr/wp-json/buddyboss/v1/components', 
        { 
          name: componentName,
          action: action
        },
        { headers }
      );
      fetchComponents(); // re-fetch the components after update
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  const handleUpdateComponent = () => {
    updateComponent();
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
      <TextInput 
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
          placeholder="Enter term"
          onChangeText={text => setTerm(text)}
          value={term}
        />
      <Button title="Search Mentions" onPress={handleSearchMentions} />

      <Text>Your mentions:</Text>
{mentions.map((mention, index) => (
  <View key={index}>
    <Text>ID: {mention.id}</Text>
    <Text>Display ID: {mention.display_id}</Text>
    <Text>Name: {mention.name}</Text>
    <Image source={{ uri: mention.image }} style={{ width: 50, height: 50 }} />
  </View>
))}


        <Text>Components:</Text>
        {components.map((component, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text>Name:{component.name}</Text>
            <Text>Title: {component.title}</Text>
            <Text>Description: {component.description}</Text>
            <Text>Status: {component.status}</Text>
          </View>
        ))}
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
          placeholder="Enter component name"
          onChangeText={text => setComponentName(text)}
          value={componentName}
        />
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
          placeholder="Enter action:activate/deactivate"
          onChangeText={text => setAction(text)}
          value={action}
        />
        <Button title="Update Component" onPress={handleUpdateComponent} />
      </View>
    </ScrollView>
  );
};

export default MentionsAndComponentsScreen;
