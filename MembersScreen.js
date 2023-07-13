import React, { useState, useEffect } from 'react';
import { View, Text, Image,ScrollView,Button,Alert } from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';

const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const MembersScreen = () => {
  const [members, setMembers] = useState([]);
  const [memberPermissions, setMemberPermissions] = useState({});
  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  useEffect(() => {
    fetchMembers();
    fetchMemberPermissions();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };
  const fetchMemberPermissions = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/members/me/permissions`);
      setMemberPermissions(response.data);
    } catch (error) {
      console.error('Error fetching member permissions:', error);
    }
  };

  const handleDeleteAvatar = async (userId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/avatar`,{headers});
      if (response.status === 200) {
        Alert.alert('Success', 'Avatar deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete avatar.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete avatar. Please try again.');
      console.error(error);
    }
  };

  const handleDeleteCover = async (userId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${userId}/cover`,{headers});
      if (response.status === 200) {
        Alert.alert('Success', 'Cover deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete cover.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete cover. Please try again.');
      console.error(error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/members/${memberId}`,{headers});
      if (response.data.deleted) {
        Alert.alert('Success', 'Member deleted successfully.');
        fetchMembers();
      } else {
        throw new Error('Failed to delete member.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete member. Please try again.');
      console.error(error);
    }
  };

  return (
    <ScrollView>
      <Text>Members:</Text>
      {members.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>ID:{member.id}</Text>
          <Text>Name: {member.name}</Text>
          <Image source={{ uri: member.cover_url }} style={{ width: 200, height: 100 }} />
          <Button title="Delete Avatar" onPress={() => handleDeleteAvatar(member.id)} />
          <Button title="Delete Cover" onPress={() => handleDeleteCover(member.id)} />
          <Button title="Delete Member" onPress={() => handleDeleteMember(member.id)} />
        </View>
      ))}
      <Text>Member Permissions:</Text>
      <Text>Can create activity: {memberPermissions.can_create_activity ? 'true' : 'false'}</Text>
      <Text>Can Create group: {memberPermissions.can_create_post ? 'true' : 'false'}</Text>
      <Text>can_join_group: {memberPermissions.can_join_group ? 'true' : 'false'}</Text>
      <Text>can_create_media: {memberPermissions.can_create_media ? 'true' : 'false'}</Text>
      <Text>can_create_forum_media: {memberPermissions.can_create_forum_media ? 'true' : 'false'}</Text>
      <Text>can_create_message_media: {memberPermissions.can_create_message_media ? 'true' : 'false'}</Text>
      <Text>can_create_document: {memberPermissions.can_create_document ? 'true' : 'false'}</Text>
      <Text>can_create_forum_document: {memberPermissions.can_create_forum_document ? 'true' : 'false'}</Text>
      <Text>can_create_message_document: {memberPermissions.can_create_message_document ? 'true' : 'false'}</Text>
      <Text>can_create_video: {memberPermissions.can_create_video ? 'true' : 'false'}</Text>
      <Text>can_create_forum_video: {memberPermissions.can_create_forum_video ? 'true' : 'false'}</Text>
      <Text>can_create_message_video: {memberPermissions.can_create_message_video ? 'true' : 'false'}</Text>
        
    
    
    </ScrollView>
  );
};

export default MembersScreen;
