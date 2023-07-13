import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CreateDocuments = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folderTitle, setFolderTitle] = useState('');
  const [deleteDocumentId, setDeleteDocumentId] = useState(''); // Ajouté
  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    } else {
      fetchDocuments();
      fetchFolders();
    }
  }, [token, navigation]);

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
        setFolderTitle('');
        fetchFolders();
        Alert.alert('Success', 'Folder created successfully.');
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    } finally {
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


  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
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
      <View style={{ marginTop: 20 }}>
        <Text>Create Folder:</Text>
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
          onChangeText={text => setFolderTitle(text)}
          value={folderTitle}
          placeholder="Folder title"
        />
        <Button title="Create Folder" onPress={createFolder} />
      </View>

    </ScrollView>
  );
};

export default CreateDocuments;
