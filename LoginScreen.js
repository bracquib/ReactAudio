import React, { useState } from 'react';
import { Alert, Button, TextInput, View ,Text} from 'react-native';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const login = () => {
    axios
      .post('https://q-rious.fr/wp-json/jwt-auth/v1/token', {
        username: username,
        password: password
      })
      .then((response) => {
        // Save the authentication token in the app's state using Redux
        dispatch({ type: 'SET_TOKEN', token: response.data.token });

        // Fetch member details to check if the member is an admin
        axios
          .get('https://q-rious.fr/wp-json/buddyboss/v1/members/me', {
            headers: {
              Authorization: `Bearer ${response.data.token}`
            }
          })
          .then((memberResponse) => {
            const memberData = memberResponse.data;
            const isAdmin = memberData.is_wp_admin ;

            // Save the isAdmin flag in the app's state using Redux
            dispatch({ type: 'SET_IS_ADMIN', isAdmin });

            // Navigate to the appropriate screen based on admin status
            navigation.navigate('Home');
          })
          .catch((error) => {
            Alert.alert('Error', 'Failed to fetch member details. Please try again.');
            console.error(error);
          });
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to log in. Please check your credentials.');
        console.error(error);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100, backgroundColor: 'white' }}>
      <Text style={{ color: 'black', fontSize: 24, marginBottom: 200 }}>WeSingleParent</Text>
      <TextInput 
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10, backgroundColor: 'white', width: '100%' }} 
        placeholder="Username" 
        onChangeText={text => setUsername(text)} 
      />
      <TextInput 
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10, backgroundColor: 'white', width: '100%' }} 
        placeholder="Password" 
        onChangeText={text => setPassword(text)} 
        secureTextEntry 
      />
      <Button title="Log in" onPress={login} />
    </View>
  );
  
}
