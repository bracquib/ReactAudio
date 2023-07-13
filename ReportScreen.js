import React, { useState } from 'react';
import { View, Text, Image, Button, Alert, TextInput } from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';

const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const ReportScreen = () => {
  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const [reportedMembers, setReportedMembers] = useState([]);
  const [memberId, setMemberId] = useState('');

  const handleReportMember = async () => {
    try {
      await axios.post(
        `${rootUrl}/wp-json/buddyboss/v1/moderation`,
        { "item_id": memberId },
        { headers }
      );
      Alert.alert('Success', 'Member reported successfully.');
      setMemberId('');
    } catch (error) {
      Alert.alert('Error', 'Failed to report member. Please try again.');
      console.error(error);
    }
  };

  return (
    <View>
      <Text>Reported Members:</Text>
      {reportedMembers.map((member) => (
        <View key={member.id}>
          <Image source={{ uri: member.avatar_urls.thumb }} style={{ width: 100, height: 100 }} />
          <Text>Name: {member.name}</Text>
          <Text>Email: {member.user_email}</Text>
        </View>
      ))}

      <TextInput
        placeholder="Enter Member ID"
        value={memberId}
        onChangeText={setMemberId}
        style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginVertical: 10 }}
      />

      <Button title="Report Member" onPress={handleReportMember} />
    </View>
  );
};

export default ReportScreen;
