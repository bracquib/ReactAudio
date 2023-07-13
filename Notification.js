import React, { useState, useEffect } from 'react';
import { View, Text, Image,ScrollView,Button,Alert } from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';

const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const Notification = () => {
    const [notification, setNotification] = useState([]);

  const token = useSelector(state => state.token);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    try {
      const response = await axios.get(`${rootUrl}/wp-json/buddyboss/v1/notifications`);
      setNotification(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };
  return (
    <ScrollView>
      <Text>Notification:</Text>
      {notification.map((notification) => (
        <View key={notification.id}>
          <Text>ID:{notification.id}</Text>
          <Text>User_id:{notification.user_id}</Text>
          <Text>Item_id:{notification.item_id}</Text>
          <Text>description:{notification.description.rendered}</Text>
        </View>
      ))}
     
        
    
    
    </ScrollView>
  );
};

export default Notification;