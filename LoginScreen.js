// LoginScreen.js
import React, { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();


  const login = () => {
    axios.post('https://q-rious.fr/wp-json/jwt-auth/v1/token', {
      username: username,
      password: password
    }).then(response => {
      dispatch({ type: 'SET_TOKEN', token: response.data.token });
      navigation.navigate('Home');
    }).catch(error => {
      Alert.alert('Error', 'Failed to log in. Please check your credentials.');
      console.error(error);
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
      <TextInput 
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }} 
        placeholder="Username" 
        onChangeText={text => setUsername(text)} 
      />
      <TextInput 
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }} 
        placeholder="Password" 
        onChangeText={text => setPassword(text)} 
        secureTextEntry 
      />
      <Button title="Log in" onPress={login} />
    </View>
  );
}
