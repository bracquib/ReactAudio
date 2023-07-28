import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Button } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';

const ForumsScreen = ({ navigation }) => {
  // State variables to store data
  const [forums, setForums] = useState([]);
  const [topics, setTopics] = useState([]);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyContents, setReplyContents] = useState({});
  const [replyTitle, setReplyTitle] = useState({});
  const [replyReplyTo, setReplyReplyTo] = useState({});
  const [replyTags, setReplyTags] = useState({});
  const [replySubscribe, setReplySubscribe] = useState({});
  const [replyBbpMedia, setReplyBbpMedia] = useState({});
  const [replyBbpMediaGif, setReplyBbpMediaGif] = useState({});
  const [topicTitle, setTopicTitle] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [mergeTopicId, setMergeTopicId] = useState('');
  const [destinationTopicId, setDestinationTopicId] = useState('');
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [updatedContent, setUpdatedContent] = useState('');

  // Get the authentication token from Redux state
  const token = useSelector(state => state.token);

  // Define headers for API requests with authorization token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Check if the user is logged in before rendering the component
  useEffect(() => {
    if (!token) {
      // If the user is not logged in, navigate to the Login screen
      navigation.navigate('Login');
    }
  }, [token, navigation]);

  // Function to fetch forum data from the API
  const fetchForums = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/forums', { headers });
      setForums(response.data);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to fetch topic data from the API
  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/topics', { headers });
      setTopics(response.data);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to fetch reply data from the API
  const fetchReplies = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://q-rious.fr/wp-json/buddyboss/v1/reply', { headers });
      setReplies(response.data);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to edit a reply
  const editReply = async (replyId, content, topicId) => {
    setIsLoading(true);
    try {
      const data = {
        id: replyId,
        content: content,
        topic_id: topicId
      };
      const response = await axios.patch(
        `https://q-rious.fr/wp-json/buddyboss/v1/reply/${replyId}`,
        data,
        { headers }
      );
      // Update the modified reply in your state
      const updatedReplies = replies.map((reply) =>
        reply.id === replyId ? response.data : reply
      );
      setReplies(updatedReplies);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to update a topic
  const updateTopic = async (topicId, updatedTitle, updatedContent, parentForumId) => {
    setIsLoading(true);
    try {
      const data = {
        id: topicId,
        title: updatedTitle,
        content: updatedContent,
        parent: parentForumId
      };
      const response = await axios.patch(`https://q-rious.fr/wp-json/buddyboss/v1/topics/${topicId}`, data, { headers });
      // Update the modified topic in your state
      const updatedTopics = topics.map((topic) =>
        topic.id === topicId ? response.data : topic
      );
      setTopics(updatedTopics);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to create a topic
  const createTopic = async (title, content, parent) => {
    setIsLoading(true);
    try {
      const data = {
        title: title,
        content: content,
        parent: parent
      };
      const response = await axios.post('https://q-rious.fr/wp-json/buddyboss/v1/topics', data, { headers });
      setTopics(prevTopics => [...prevTopics, response.data]);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to merge two topics
  const mergeTopics = async (mergeId, destinationId) => {
    setIsLoading(true);
    try {
      const data = {
        id: mergeId,
        destination_id: destinationId
      };
      const response = await axios.post(
        `https://q-rious.fr/wp-json/buddyboss/v1/topics/merge/${mergeId}`,
        data,
        { headers }
      );
      // Update topics after the merge
      const updatedTopics = topics.filter(topic => topic.id !== mergeId);
      setTopics(updatedTopics);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to perform an action on a reply
  const performReplyAction = async (replyId, action, value) => {
    setIsLoading(true);
    try {
      const data = {
        id: replyId,
        action: action,
        value: value.toString()
      };
      const response = await axios.post(
        `https://q-rious.fr/wp-json/buddyboss/v1/reply/action/${replyId}`,
        data,
        { headers }
      );
      // Update the modified reply in your state
      const updatedReplies = replies.map((reply) =>
        reply.id === replyId ? response.data : reply
      );
      setReplies(updatedReplies);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to delete a reply
  const deleteReply = async (replyId) => {
    setIsLoading(true);
    try {
      await axios.delete(`https://q-rious.fr/wp-json/buddyboss/v1/reply/${replyId}`, { headers });
      // Update replies by removing the deleted one
      const updatedReplies = replies.filter((reply) => reply.id !== replyId);
      setReplies(updatedReplies);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to delete a topic
  const deleteTopic = async (topicId) => {
    setIsLoading(true);
    try {
      await axios.delete(`https://q-rious.fr/wp-json/buddyboss/v1/topics/${topicId}`, { headers });
      // Update topics after the deletion
      const updatedTopics = topics.filter(topic => topic.id !== topicId);
      setTopics(updatedTopics);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Function to create a reply
  const createReply = async (topicId) => {
    setIsLoading(true);
    try {
      const data = {
        topic_id: topicId,
        title: replyTitle[topicId] || undefined,
        content: replyContents[topicId] || '',
        reply_to: replyReplyTo[topicId] || undefined,
        tags: replyTags[topicId] || undefined,
        subscribe: replySubscribe[topicId] || undefined,
        bbp_media: replyBbpMedia[topicId] || undefined,
        bbp_media_gif: replyBbpMediaGif[topicId] || undefined
      };
      const response = await axios.post('https://q-rious.fr/wp-json/buddyboss/v1/reply', data, { headers });
      setReplyTitle(prevTitles => ({ ...prevTitles, [topicId]: '' }));
      setReplyContents(prevContents => ({ ...prevContents, [topicId]: '' }));
      setReplyReplyTo(prevReplyTo => ({ ...prevReplyTo, [topicId]: '' }));
      setReplyTags(prevTags => ({ ...prevTags, [topicId]: '' }));
      setReplySubscribe(prevSubscribe => ({ ...prevSubscribe, [topicId]: '' }));
      setReplyBbpMedia(prevBbpMedia => ({ ...prevBbpMedia, [topicId]: '' }));
      setReplyBbpMediaGif(prevBbpMediaGif => ({ ...prevBbpMediaGif, [topicId]: '' }));
      setReplies(prevReplies => [...prevReplies, response.data]);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Fetch initial data when the component mounts
  useEffect(() => {
    fetchForums();
    fetchTopics();
    fetchReplies();
  }, []);

  const isAdmin = useSelector(state => state.isAdmin);

  if(!isAdmin){
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1}}>
        <Text>Forums:</Text>
        {forums.map((forum) => (
          <View key={forum.id}>
            <Text style={styles.boldText}>ID: {forum.id}</Text>
            <Text>Title: {forum.title.raw}</Text>
            <Text>Content: {forum.content.raw}</Text>
            <Text>Link: {forum.link}</Text>
            <Text>Author: {forum.author}</Text>
            <Text>Status: {forum.status}</Text>
           
            <Text>Topics:</Text>
            {topics.map((topic) => {
              if (topic.forum_id === forum.id) {
                const topicReplies = replies.filter(reply => reply.parent === topic.id);
                const lastReply = topicReplies.length > 0 ? topicReplies[topicReplies.length - 1] : null;
                return (
                  <View key={topic.id} style={{ marginLeft: 20, marginBottom: 10 }}>
                    <Text style={styles.boldText}>ID: {topic.id}</Text>
                    <Text>topic Actions States: {JSON.stringify(topic.action_states)}</Text>
                    <Text>Title: {topic.title.raw}</Text>
                    <Text>Content: {topic.content.raw}</Text>
                    <Text>Link: {topic.link}</Text>
                    <Text>Author: {topic.author}</Text>
                    <Text>Status: {topic.status}</Text>
                    <Text>Topic Tags: {topic.topic_tags}</Text>
                   

                    <Text>Replies:</Text>
                    {topicReplies.map((reply) => (
  <View key={reply.id} style={{ marginLeft: 40 }}>
    <Text style={styles.boldText}>ID: {reply.id}</Text>
    <Text>Reply Actions States: {JSON.stringify(reply.action_states)}</Text>
    <Text>Date: {reply.date}</Text>
    <Text>Content: {reply.content.raw}</Text>
    <Text>Link: {reply.link}</Text>
    <Text>Author: {reply.author}</Text>
    <Text>Status: {reply.status}</Text>
    <Text>Title: {reply.title.raw}</Text>
    <Text>Reply To: {reply.reply_to}</Text>
    <Text>Forum ID: {reply.forum_id}</Text>
    <Text>Tags: {reply.tags}</Text>
    <Text>Subscribe: {reply.subscribe ? 'true' : 'false'}</Text>
    <Text>BBP Media: {reply.bbp_media}</Text>
    <Text>BBP Media GIF: {reply.bbp_media_gif}</Text>
    
      
  </View>
))}


                    
                  </View>
                );
              }
            })}
          </View>
        ))}

    </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View>
        <Text>Forums:</Text>
        {forums.map((forum) => (
          <View key={forum.id}>
            <Text style={styles.boldText}>ID: {forum.id}</Text>
            <Text>Title: {forum.title.raw}</Text>
            <Text>Content: {forum.content.raw}</Text>
            <Text>Link: {forum.link}</Text>
            <Text>Author: {forum.author}</Text>
            <Text>Status: {forum.status}</Text>
            <Text>Create Topic:</Text>
            <TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Title"
  value={topicTitle}
  onChangeText={text => setTopicTitle(text)}
/>
<TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Content"
  value={topicContent}
  onChangeText={text => setTopicContent(text)}
/>


  <Button
    title="Create Topic"
    onPress={() => createTopic(topicTitle, topicContent, forum.id)}
  />
            <Text>Topics:</Text>
            {topics.map((topic) => {
              if (topic.forum_id === forum.id) {
                const topicReplies = replies.filter(reply => reply.parent === topic.id);
                const lastReply = topicReplies.length > 0 ? topicReplies[topicReplies.length - 1] : null;
                return (
                  <View key={topic.id} style={{ marginLeft: 20, marginBottom: 10 }}>
                    <Text style={styles.boldText}>ID: {topic.id}</Text>
                    <Text>topic Actions States: {JSON.stringify(topic.action_states)}</Text>
                    <Text>Title: {topic.title.raw}</Text>
                    <Text>Content: {topic.content.raw}</Text>
                    <Text>Link: {topic.link}</Text>
                    <Text>Author: {topic.author}</Text>
                    <Text>Status: {topic.status}</Text>
                    <Text>Topic Tags: {topic.topic_tags}</Text>
                    <Button title="Delete" onPress={() => deleteTopic(topic.id)} />
                    <TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Nouveau titre du topic"
  value={updatedTitle}
  onChangeText={text => setUpdatedTitle(text)}
/>
<TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Nouveau contenu du topic"
  value={updatedContent}
  onChangeText={text => setUpdatedContent(text)}
/>
<Button
  title="Edit"
  onPress={() => updateTopic(topic.id, updatedTitle, updatedContent, topic.forum_id)}
/>

                    <Text>Replies:</Text>
                    {topicReplies.map((reply) => (
  <View key={reply.id} style={{ marginLeft: 40 }}>
    <Text style={styles.boldText}>ID: {reply.id}</Text>
    <Text>Reply Actions States: {JSON.stringify(reply.action_states)}</Text>
    <Text>Date: {reply.date}</Text>
    <Text>Content: {reply.content.raw}</Text>
    <Text>Link: {reply.link}</Text>
    <Text>Author: {reply.author}</Text>
    <Text>Status: {reply.status}</Text>
    <Text>Title: {reply.title.raw}</Text>
    <Text>Reply To: {reply.reply_to}</Text>
    <Text>Forum ID: {reply.forum_id}</Text>
    <Text>Tags: {reply.tags}</Text>
    <Text>Subscribe: {reply.subscribe ? 'true' : 'false'}</Text>
    <Text>BBP Media: {reply.bbp_media}</Text>
    <Text>BBP Media GIF: {reply.bbp_media_gif}</Text>
    <View style={{ flexDirection: 'row' }}>
      <Button title="Spam" onPress={() => performReplyAction(reply.id, 'spam', true)} />
      <Button title="Unspam" onPress={() => performReplyAction(reply.id, 'spam', false)} />
      <Button title="Trash" onPress={() => performReplyAction(reply.id, 'trash', true)} />
      <Button title="Untrash" onPress={() => performReplyAction(reply.id, 'trash', false)} />
      <Button title="Delete" onPress={() => deleteReply(reply.id)} />
      </View>
      <TextInput
      style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
      placeholder="Edit Reply"
      value={replyContents[reply.id] || reply.content.raw}
      onChangeText={(text) =>
        setReplyContents((prevContents) => ({ ...prevContents, [reply.id]: text }))
      }
    />
    <Button
      title="Update"
      onPress={() => editReply(reply.id, replyContents[reply.id] || reply.content.raw, topic.id)}
    />
      
  </View>
))}


                    <View style={{ marginTop: 10 }}>
                      <Text>Create Reply:</Text>
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`Title (optionnel) : The title of the reply.`}
                        value={replyTitle[topic.id] || ''}
                        onChangeText={text => setReplyTitle(prevTitles => ({ ...prevTitles, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`Content : The content of the reply.`}
                        value={replyContents[topic.id] || ''}
                        onChangeText={text => setReplyContents(prevContents => ({ ...prevContents, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`Reply To (optionnel) : Parent Reply ID for reply.`}
                        value={replyReplyTo[topic.id] || ''}
                        onChangeText={text => setReplyReplyTo(prevReplyTo => ({ ...prevReplyTo, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`Tags (optionnel) : Tags to add into the topic with comma separated.`}
                        value={replyTags[topic.id] || ''}
                        onChangeText={text => setReplyTags(prevTags => ({ ...prevTags, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`Subscribe (true/false) (optionnel) : Whether user subscribe topic or not.`}
                        value={replySubscribe[topic.id] || ''}
                        onChangeText={text => setReplySubscribe(prevSubscribe => ({ ...prevSubscribe, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`BBP Media (optionnel) : Media specific IDs when Media component is enable.`}
                        value={replyBbpMedia[topic.id] || ''}
                        onChangeText={text => setReplyBbpMedia(prevBbpMedia => ({ ...prevBbpMedia, [topic.id]: text }))}
                      />
                      <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                        placeholder={`BBP Media GIF (optionnel) : Save gif data into reply when Media component is enable. param(url,mp4)`}
                        value={replyBbpMediaGif[topic.id] || ''}
                        onChangeText={text => setReplyBbpMediaGif(prevBbpMediaGif => ({ ...prevBbpMediaGif, [topic.id]: text }))}
                      />
                      <Button title="Create Reply" onPress={() => createReply(topic.id)} />
                    </View>
                  </View>
                );
              }
            })}
          </View>
        ))}
      </View>
      <TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Topic ID to Merge"
  value={mergeTopicId}
  onChangeText={text => setMergeTopicId(text)}
/>
<TextInput
  style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
  placeholder="Destination Topic ID"
  value={destinationTopicId}
  onChangeText={text => setDestinationTopicId(text)}
/>
<Button
  title="Merge Topics"
  onPress={() => mergeTopics(mergeTopicId, destinationTopicId)}
/>

    </ScrollView>
  );
};


const styles = {
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export default ForumsScreen;