// Site.js
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

const Site = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack(); // Go back to the previous screen in the stack (Login screen)
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Add the WebView with incognito mode */}
      <WebView source={{ uri: 'https://q-rious.fr/' }} style={{ flex: 1 }} incognito />

      {/* Add a View container to position the button below the WebView */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {/* Add a button to go back to the Login screen */}
        <TouchableOpacity onPress={handleGoBack} style={{ padding: 10, backgroundColor: 'blue', borderRadius: 5 }}>
          <Text style={{ color: 'white' }}>Go Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Site;
