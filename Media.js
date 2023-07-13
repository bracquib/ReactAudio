import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, Button, Alert,ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const MediaScreen = () => {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [mediaDetails, setMediaDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumPrivacy, setNewAlbumPrivacy] = useState('public');

  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchAlbums();
    fetchPhotos();
    fetchMediaDetails();
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

  const handleDeletePhoto = async (photoId) => {
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
