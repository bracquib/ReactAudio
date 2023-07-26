import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, Button, TextInput, ActivityIndicator, Alert,SafeAreaView ,StyleSheet,TouchableOpacity} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import Voice from '@react-native-community/voice';
import { ScrollView } from 'react-native-gesture-handler';
const rootUrl = 'https://q-rious.fr'; // Remplacez par votre URL racine

const Help =  ({ navigation }) => {

  const handleCreatePostaudio = async () => {
    try {
      if (!activityContent || !activityContent.trim()) {
        throw new Error('Activity content is empty');
      }
  
      await axios.post(
        `${rootUrl}/wp-json/buddyboss/v1/activity`,
        {
          content: activityContent,
          component: 'activity',
          type: 'activity_update',
        },
        { headers }
      );
      Alert.alert('Success', 'Activity created successfully.');
      setActivityContent('');
      activityCreatingRef.current = false;
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create activity. Please try again.');
    }
  };
   const  handleCommentaudio = async (activityId) => {
    setIsLoading(true);
    try {
  
      const response = await axios.post(
        `https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}/comment`,
        { content: commentaudio },
        { headers }
      );
  
    } catch (error) {
      console.error(error);
      setError(error);
      Alert.alert('Error', 'Failed to create comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
   const  handleUpdateActivityaudio = async (activityId) => {
    setIsLoading(true);
    try {
  
      await axios.patch(
        `https://q-rious.fr/wp-json/buddyboss/v1/activity/${activityId}`,
        { content: currentContentaudio },
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
  
  function convertWordToNumber(word) {
    const numberWords = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9
    };
  
    const words = word.trim().toLowerCase().split(' ');
  
    // Check for both numeric and word representation of numbers
    let convertedNumbers = words.map(word => {
      if (!isNaN(word)) {
        return parseInt(word);
      } else {
        return numberWords[word] || word; // Use the word as is if not found in the numberWords dictionary
      }
    });
  
    // If there is a single number, return it, otherwise, return the whole array of words
    if (convertedNumbers.length === 1) {
      return convertedNumbers[0];
    } else {
      const numericValues = convertedNumbers.filter(val => typeof val === 'number');
      return numericValues.length === 1 ? numericValues[0] : convertedNumbers.join(' ');
    }
  }
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const token = useSelector(state => state.token);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');


  const activityCreatingRef = useRef(false);
  const [activityContent, setActivityContent] = useState('');
  const activityDeleteRef = useRef(false);
  const [activityidaudio,setactivityidaudio] = useState('');
  const activityfavouriteRef = useRef(false);
  const activityCommentRef = useRef(false);
  const [commentaudio,setCommentaudio] = useState('');
  const actvityCommentcontent = useRef(false);
  const activityupdateRef = useRef(false);
  const [currentContentaudio,setcurrentContentaudio] = useState('');
  const actvityupdatecontent = useRef(false);

 const reportmemberref = useRef(false);
  const [reportedMembers, setReportedMembers] = useState([]);
  const [memberId, setMemberId] = useState('');

  const deletegroup = useRef(false);
    const [groupidaudio,setgroupidaudio]=useState('');

      
  const albumCreatingRef = useRef(false);
  const deleteAlbumaudio = useRef(false);
  const[albumidaudio,setalbumidaudio] = useState('');
  const deletephotoaudio = useRef(false);
  const[photoidaudio,setphotoidaudio] = useState('');


  const albumupdateRef = useRef(false);
  const albumupdatecontent = useRef(false);
  const deleteavataraudio = useRef(false);
  const [memberidaudio,setmemberidaudio] = useState('');
  const deletecoveraudio = useRef(false);
  const deletememberaudio = useRef(false);


  const [folderTitle, setFolderTitle] = useState('');
  const folderCreatingRef = useRef(false);
  const docdelete = useRef(false);
  const [DocumentIdaudio, setDocumentIdaudio] = useState(''); // Ajouté
  const folderdelete = useRef(false);
  const [folderIdaudio, setfolderIdaudio] = useState(''); // Ajouté


  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  const checkPermissionAndStart = async () => {
    const checkPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    switch (checkPermission) {
      case RESULTS.UNAVAILABLE:
        console.log('This feature is not available (on this device / in this context)');
        // Informer l'utilisateur que la fonctionnalité n'est pas disponible
        break;
      case RESULTS.DENIED:
        console.log('The permission has not been requested / is denied but requestable');
        const requestPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestPermission === RESULTS.GRANTED) {
          startListening();
        } else {
          // L'utilisateur a refusé l'autorisation, afficher un message expliquant pourquoi l'autorisation est nécessaire
        }
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        startListening();
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        // Si l'autorisation est bloquée, demander à l'utilisateur d'ouvrir les paramètres de l'application et d'autoriser l'accès manuellement
        openSettings().catch(() => console.warn('Cannot open settings'));
        break;
    }
  };

  const commands = {
    'créer activité': () => {
      if (!activityCreatingRef.current) {
        activityCreatingRef.current = true;
        console.log('Creating activity2 dans command:', activityCreatingRef.current);
    
      }

    },
    'mettre activité': () => {
      if (!activityupdateRef.current) {
        activityupdateRef.current = true;
        console.log('Creating activity2 dans command:', activityupdateRef.current);
    
      }
  },
    'supprimer activité': () => {
      if (!activityDeleteRef.current) {
        activityDeleteRef.current = true;
        console.log('Creating activity2 dans command:', activityDeleteRef.current);
    
      }
  },
  
    'aimer activité': () => {
      if (!activityfavouriteRef.current) {
        activityfavouriteRef.current = true;
        console.log('Creating activity2 dans command:', activityfavouriteRef.current);
    
      }
  },
   'supprimer groupe': () => {
      if (!deletegroup.current) {
        deletegroup.current = true;
        console.log('Creating activity2 dans command:', deletegroup.current);
    
      }

    },
    'supprimer avatar': () => {
      if (!deleteavataraudio.current) {
        deleteavataraudio.current = true;
        console.log('Creating activity2 dans command:', deleteavataraudio.current);
    
      }

    },
    'supprimer couverture': () => {
      if (!deletecoveraudio.current) {
        deletecoveraudio.current = true;
        console.log('Creating activity2 dans command:', deletecoveraudio.current);
    
      }

    },
    'supprimer membre': () => {
      if (!deletememberaudio.current) {
        deletememberaudio.current = true;
        console.log('Creating activity2 dans command:', deletememberaudio.current);
    
      }

    },
     'reporter un membre': () => {
      if (!reportmemberref.current) {
        reportmemberref.current = true;
        console.log('Creating activity2 dans command:', reportmemberref.current);
    
      }

    },
    'créer dossier': () => {
        if (!folderCreatingRef.current) {
          folderCreatingRef.current = true;
          console.log('Creating activity2 dans command:', folderCreatingRef.current);
      
        }
  
      },
      'supprimer documents': () => {
        if (!docdelete.current) {
          docdelete.current = true;
          console.log('Creating activity2 dans command:', docdelete.current);
      
        }
  
      },
      'supprimer dossier': () => {
        if (!folderdelete.current) {
          folderdelete.current = true;
          console.log('Creating activity2 dans command:', folderdelete.current);
      
        }
  
      },
      'créer album': () => {
        if (!albumCreatingRef.current) {
          albumCreatingRef.current = true;
          console.log('Creating folder dans command:', albumCreatingRef.current);
      
        }
  
      },
      'supprimer album': () => {
        if (!deleteAlbumaudio.current) {
          deleteAlbumaudio.current = true;
          console.log('Creating folder dans command:', deleteAlbumaudio.current);
      
        }
  
      },
      'supprimer photo': () => {
        if (!deletephotoaudio.current) {
          deletephotoaudio.current = true;
          console.log('Creating folder dans command:', deletephotoaudio.current);
      
        }
      },
      'mettre album': () => {
        if (!albumupdateRef.current) {
          albumupdateRef.current = true;
          console.log('Creating activity2 dans command:', albumupdateRef.current);
      
        }
    },
}

const executeCommand = (command) => {
  setIsCommandExecuting(true);
  command();
  setIsCommandExecuting(false);
};
const startListening = async () => {
  try {
    setIsListening(true);
    setTranscription('');
    await Voice.start('fr-FR'); // pour français
  } catch (e) {
    console.error(e);
  }
};

const stopListening = async () => {
  try {
    setIsListening(false);
    await Voice.stop();
  } catch (e) {
    console.error(e);
  }
};

function levenshteinDistance(a, b) {
  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }

  return matrix[b.length][a.length];
}

  Voice.onSpeechResults = (e) => {
    let speech = e.value ? e.value.join(' ') : '';

    // Filtrage du discours
    speech = speech.trim(); // Supprimer les espaces avant et après
    speech = speech.replace(/\s+/g, ' '); // Supprimer les espaces multiples
    speech = speech.toLowerCase(); // Convertir en minuscules pour faciliter la correspondance des commandes

    // Garder seulement le premier mot de chaque séquence de mots similaires
    const words = speech.split(' ');
    const filteredWords = words.filter((word, index, self) => {
      // Retourner true si le mot est le premier de sa séquence de mots similaires
      return index === self.findIndex(otherWord => levenshteinDistance(word, otherWord) / Math.max(word.length, otherWord.length) <= 0.5);
    });
    speech = filteredWords.join(' ');
    speech = convertWordToNumber(speech);

    if (activityCreatingRef.current) {
      console.log('activitycreating est vrai dans result  :', activityContent);
      console.log('activityCreating2 est vrai dans result');
      setActivityContent(speech);
      console.log('Content  :', activityContent);

    }
     if (activityDeleteRef.current || activityfavouriteRef) {
      console.log('activitycreating est vrai dans result  :', activityidaudio);
      console.log('activityCreating2 est vrai dans result');
      setactivityidaudio(speech);
      console.log('Content  :', activityidaudio);

    }
     if (actvityCommentcontent.current) {
      console.log('activitycreating est vrai dans result  :', commentaudio);
      console.log('activityCreating2 est vrai dans result');
      setCommentaudio(speech);
      console.log('Content  :', commentaudio);
    }
     if (activityCommentRef.current) {
      actvityCommentcontent.current = true;
      console.log('activitycreating est vrai dans result  :', activityidaudio);
      console.log('activityCreating2 est vrai dans result');
      setactivityidaudio(speech);
      console.log('Content  :', activityidaudio);

    }
    if (actvityupdatecontent.current) {
      console.log('activitycreating est vrai dans result  :', currentContentaudio);
      console.log('activityCreating2 est vrai dans result');
      setcurrentContentaudio(speech);
      console.log('Content  :', currentContentaudio);

    }
    if (activityupdateRef.current) {
      actvityupdatecontent.current = true;
      console.log('activitycreating est vrai dans result  :', activityidaudio);
      console.log('activityCreating2 est vrai dans result');
      setactivityidaudio(speech);
      console.log('Content  :', activityidaudio);

    }
   if(deletegroup.current) {
      console.log('activitycreating est vrai dans result  :', groupidaudio);
      console.log('activityCreating2 est vrai dans result');
      setgroupidaudio(speech);
      console.log('Content  :', groupidaudio);

    }

     if (deleteavataraudio.current || deletecoveraudio.current || deletememberaudio.current) {
      console.log('activitycreating est vrai dans result  :', memberidaudio);
      console.log('activityCreating2 est vrai dans result');
      setmemberidaudio(speech);
      console.log('Content  :', memberidaudio);

    }
     if (reportmemberref.current) {
      console.log('activitycreating est vrai dans result  :', memberidaudio);
      console.log('activityCreating2 est vrai dans result');
      setmemberidaudio(speech);
      console.log('Content  :', memberidaudio);

    }
    if (folderCreatingRef.current) {
        console.log('activitycreating est vrai dans result  :', folderTitle);
        console.log('activityCreating2 est vrai dans result');
        setFolderTitle(speech);
        console.log('Content  :', folderTitle);
  
      }
      if (docdelete.current ) {
        console.log('activitycreating est vrai dans result  :', DocumentIdaudio);
        console.log('activityCreating2 est vrai dans result');
        setDocumentIdaudio(speech);
        console.log('Content  :', DocumentIdaudio);
  
      }
      if (folderdelete.current ) {
        console.log('activitycreating est vrai dans result  :', folderIdaudio);
        console.log('activityCreating2 est vrai dans result');
        setfolderIdaudio(speech);
        console.log('Content  :', folderIdaudio);
  
      }

      if (albumCreatingRef.current) {
        console.log('activitycreating est vrai dans result  :', newAlbumTitle);
        console.log('activityCreating2 est vrai dans result');
        setNewAlbumTitle(speech);
        console.log('Content  :', newAlbumTitle);
  
      }
  
      if(deleteAlbumaudio.current){
        console.log('activitycreating est vrai dans result  :', albumidaudio);
        console.log('activityCreating2 est vrai dans result');
        setalbumidaudio(speech);
        console.log('Content  :', albumidaudio);
  
      }
      if(deletephotoaudio.current){
        console.log('activitycreating est vrai dans result  :', photoidaudio);
        console.log('activityCreating2 est vrai dans result');
        setphotoidaudio(speech);
        console.log('Content  :', photoidaudio);
  
      }
      if (albumupdatecontent.current) {
        console.log('activitycreating est vrai dans result  :', currentContentaudio);
        console.log('activityCreating2 est vrai dans result');
        setcurrentContentaudio(speech);
        console.log('Content  :', currentContentaudio);
      }
      if (albumupdateRef.current) {
        albumupdateRef.current = true;
        console.log('activitycreating est vrai dans result  :', albumidaudio);
        console.log('activityCreating2 est vrai dans result');
        setalbumidaudio(speech);
        console.log('Content  :', albumidaudio);
  
      }
    setTranscription(speech);


      const commandFunc = commands[speech];
      if (commandFunc) {
        executeCommand(commandFunc);
      }

  };
  const Initialisation = async () => {
    activityCreatingRef.current = false;
    activityDeleteRef.current = false;
    activityfavouriteRef.current=false;
    activityCommentRef.current=false;
    activityupdateRef.current=false;
    actvityCommentcontent.current=false;
    actvityupdatecontent.current=false;
    setCommentaudio('');
    setcurrentContentaudio('');
    setactivityidaudio('');
    setActivityContent('');
 deletegroup.current = false;
    setgroupidaudio('');
    deleteavataraudio.current = false;
    deletecoveraudio.current = false;
    deletememberaudio.current = false;
    reportmemberref.current = false;
    setmemberidaudio('');
    folderCreatingRef.current = false;
    docdelete.current = false;
    folderdelete.current = false;
    setFolderTitle('');
    setDocumentIdaudio('');
    setfolderIdaudio('');
    albumCreatingRef.current = false;
    deleteAlbumaudio.current = false;
    deletephotoaudio.current = false;
    activityupdateRef.current=false;
    actvityupdatecontent.current=false;
    setcurrentContentaudio('');
    setNewAlbumTitle('');
    setalbumidaudio('');
    setphotoidaudio('');
    setIsListening(false);
}

useEffect(() => {
  if (!token) {
    navigation.navigate('Login');
  } 
}, [token, navigation,albumCreatingRef.current,deleteAlbumaudio.current,deletephotoaudio.current,albumupdateRef.current,albumupdatecontent.current,folderCreatingRef.current,docdelete.current,folderdelete.current,reportmemberref.current,deleteavataraudio.current,deletecoveraudio.current,deletememberaudio.current,deletegroup.current,activityCreatingRef.current,activityDeleteRef.current,activityfavouriteRef.current,activityCommentRef,activityupdateRef,actvityCommentcontent,actvityupdatecontent]);

const handleDeleteDocumentaudio = async (documentId) => {
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
};
 const  handleDeleteFolderaudio = async (folderId) => {
  setIsLoading(true);

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
          };

           const  createFolder = async () => {
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
          const deleteGroup = async (groupId) => {
            try {
              const response = await axios.delete(`${rootUrl}/wp-json/buddyboss/v1/groups/${groupId}`, {
                data: {
                  id: groupId,
                  delete_group_forum: true
                },
                headers,
              });
              // Vérifiez la réponse pour voir si la suppression a réussi
              if (response.data.deleted) {
                // Supprimez le groupe de la liste des groupes
                setGroupes((prevGroupes) => prevGroupes.filter((groupe) => groupe.id !== groupId));
                Alert.alert('Group Deleted', 'The group has been successfully deleted.');
              } else {
                Alert.alert('Error', 'Failed to delete the group. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete the group. Please try again.');
            }
          };


 const  handleUpdateAlbumTitleaudio = async (albumId) => {
  try {
    const data = {
      id: albumId,
      title: currentContentaudio
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

 const  handleDeletePhoto = async (photoId) => {
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

const handleReportMemberaudio = async () => {
  try {
    await axios.post(
      `${rootUrl}/wp-json/buddyboss/v1/moderation`,
      { "item_id": memberidaudio },
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
    <ScrollView>
        <View>
<Text>Help</Text>

<Text>Pour CreateActivityScreen: créer activité,supprimer activité,aimer activité</Text>
<Text>Pour CreateDocument:supprimer documents,supprimer dossier</Text>
<Text>Pour group:supprimer groupe</Text>
<Text>Pour Media:créer album,supprimer album,supprimer photo</Text>
<Text>Pour MembersScreen:supprimer avatar,supprimer couverture,supprimer membre</Text>
<Text>Pur report:reporter un membre</Text>

</View>

      <View>
              <Text style={styles.text}>Dictée vocale</Text>
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={() => {
          if (isListening) {
            stopListening();
          } else {
            checkPermissionAndStart();
          }
        }}
      >
         <Text style={styles.voiceButtonText}>{isListening ? 'Arrêter' : 'Démarrer'}</Text>
      </TouchableOpacity>
      <Text >{transcription}</Text>
      <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
            <Text style={styles.confirmButtonText}>initialiser</Text>
          </TouchableOpacity>
          {activityCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le contenu de l'activité.</Text>
    <Text style={styles.activity}>{activityContent}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreatePostaudio}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
  </View>
)}
{activityDeleteRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'activité qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteActivity(activityidaudio)} />
  </View>
)}
{activityfavouriteRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'activité qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
    <Button title="like Activity audio" onPress={() => handleFavorite(activityidaudio)} />
  </View>
)}
{activityCommentRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'activité qu'on doit commenter.</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
  {actvityCommentcontent.current && (
    <View>
      <Text style={styles.transcription}>Veuillez prononcer le contenu du commentaire.</Text>
      <Text style={styles.activity}>{commentaudio}</Text>
      <Button title="Comment Activity audio" onPress={() => handleCommentaudio(activityidaudio)} />
    </View>
  )
  
  }
  </View>
)}
{activityupdateRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'activité qu'on doit modifier.</Text>
    <Text style={styles.activity}>{activityidaudio}</Text>
  {actvityupdatecontent.current && (
    <View>
      <Text style={styles.transcription}>Veuillez prononcer le nouveau contenu de l'activité.</Text>
      <Text style={styles.activity}>{currentContentaudio}</Text>
      <Button title="Update Activity audio" onPress={() => handleUpdateActivityaudio(activityidaudio)} />
    </View>
  )
  }
  </View>
)}
 {deletegroup.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du groupe qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{groupidaudio}</Text>
    <Button title="Delete group audio" onPress={() => deleteGroup(groupidaudio)} />
  </View>
)}

 {deleteavataraudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'avatar qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete avatar audio" onPress={() => handleDeleteAvatar(memberidaudio)} />
  </View>
)}
{deletecoveraudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du cover qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteCover(memberidaudio)} />
  </View>
)}
{deletememberaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'user qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteMember(memberidaudio)} />
  </View>
)}

{reportmemberref.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du member qui doit être report.</Text>
    <Text style={styles.activity}>{memberidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleReportMemberaudio} />
  </View>
)}
{folderCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le titre du folder.</Text>
    <Text style={styles.activity}>{activityContent}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={createFolder}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
  </View>
)}
{docdelete.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du document qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{DocumentIdaudio}</Text>
    <Button title="Delete document audio" onPress={() => handleDeleteDocumentaudio(DocumentIdaudio)} />
  </View>
)}
{folderdelete.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id du folder qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{folderIdaudio}</Text>
    <Button title="Delete folder audio" onPress={() => handleDeleteFolderaudio(folderIdaudio)} />
    </View>
)}
{albumCreatingRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer le titre du album.</Text>
    <Text style={styles.activity}>{newAlbumTitle}</Text>
    <TouchableOpacity style={styles.confirmButton} onPress={handleCreateAlbum}>
      <Text style={styles.confirmButtonText}>Confirmer</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.confirmButton} onPress={Initialisation}>
      <Text style={styles.confirmButtonText}>Initialiser</Text>
    </TouchableOpacity>
    </View>
)}
{deleteAlbumaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'album qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{albumidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeleteAlbum(albumidaudio)} />
  </View>
)}
{deletephotoaudio.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de la photo qui doit être Supprimer.</Text>
    <Text style={styles.activity}>{photoidaudio}</Text>
    <Button title="Delete Activity audio" onPress={() => handleDeletePhoto(photoidaudio)} />
  </View>
)}
{albumupdateRef.current && (
  <View>
    <Text style={styles.transcription}>Veuillez prononcer l'id de l'album qu'on doit modifier.</Text>
    <Text style={styles.activity}>{albumidaudio}</Text>
  {albumupdatecontent.current && (
    <View>
      <Text style={styles.transcription}>Veuillez prononcer le nouveau titre de l'album.</Text>
      <Text style={styles.activity}>{currentContentaudio}</Text>
      <Button title="Update Activity audio" onPress={() => handleUpdateAlbumTitleaudio(albumidaudio)} />
    </View>
  )
  }
 </View>
)}
</View>





    </ScrollView>   




  );};

export default Help;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
  },
  voiceButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  voiceButtonText: {
    color: '#FFF',
    fontSize: 18,
  },
  text: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  transcription: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
    fontSize: 18,
  },
  activity: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
    fontSize: 18,
  },
});