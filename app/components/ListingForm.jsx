import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ID } from 'react-native-appwrite';
import {
    account,
    databases, 
    storage, 
    DATABASE_ID, 
    LISTINGS_COLLECTION_ID,
    IMAGES_COLLECTION_ID,
    IMAGES_BUCKET_ID 
} from '../../appwrite/config';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export default function ListingForm({ navigation: externalNavigation }){
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState('');
    const [location, setLocation] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted'){
                Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
                base64: false,
                exif: false,    
            });

            if (!result.canceled){
                console.log("Selected image info:", {
                    uri: result.assets[0].uri,
                    width: result.assets[0].width,
                    height: result.assets[0].height,
                    type: result.assets[0].type,
                });

                setImages([...images, result.assets[0]]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const removeImage = (index) => {
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);
    };

    const validateForm = () => {
      let errors = {};
  
      if (!title.trim()) errors.title = "Title is required.";
      if (!description.trim()) errors.description = "Description cannot be empty.";
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) errors.price = "Enter a valid price.";
      if (!category.trim()) errors.category = "Category is required.";
  
      setFieldErrors(errors);
  
      return Object.keys(errors).length === 0;
    };
    
    const submitListing = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try{
            console.log("Starting submission process");
            const currentUser = await account.get();
            console.log("Got current user:", currentUser.$id);

            const listingId = ID.unique();
            console.log("Generated listing ID:", listingId);

            await databases.createDocument(
                DATABASE_ID,
                LISTINGS_COLLECTION_ID,
                listingId,
                {
                  title: title.trim(),
                  description: description.trim(),
                  price: parseFloat(price),
                  category: category.trim(),
                  condition: condition.trim(),
                  location: location.trim(),
                  userId: currentUser.$id,
                  createdAt: new Date().toISOString(),
                  status: 'active',
                }
            );

            if (images.length > 0) {
                await Promise.all(images.map(async (image, index) => {
                  try {
                    // Get the file name from the URI
                    const uriParts = image.uri.split('/');
                    const fileName = uriParts[uriParts.length - 1];
                    
                    console.log(`Uploading image: ${fileName}`);
                    
                    // Create a unique ID for the file
                    const fileId = ID.unique();
                    
                    // Prepare form data
                    const formData = new FormData();
                    formData.append('fileId', fileId);
                    formData.append('file', {
                      uri: image.uri,
                      name: fileName,
                      type: 'image/jpeg',
                    });
                    
                    // Use fetch API to upload the file directly
                    const endpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files`;
                    const response = await fetch(endpoint, {
                      method: 'POST',
                      headers: {
                        'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
                        // Add your API key or session token here for authentication
                      },
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      throw new Error(`HTTP error ${response.status}`);
                    }
                    
                    const fileData = await response.json();
                    console.log(`File uploaded successfully with ID: ${fileData.$id}`);
                    
                    await databases.createDocument(
                      DATABASE_ID,
                      IMAGES_COLLECTION_ID,
                      ID.unique(),
                      {
                        listingId,
                        fileId: fileData.$id || fileId, // Use the response ID if available, fallback to our generated ID
                        order: index,
                      }
                    );
                  } catch (error) {
                    console.error(`Upload failed for image ${index}:`, error);
                  }
                }));
              }

            Alert.alert('Success', 'Your listing has been created!');

            // Use the router from Expo Router directly
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error creating listing:', error);
            Alert.alert('Error', 'Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Listing</Text>
        
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={[styles.input, fieldErrors.title && styles.error]}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setFieldErrors((prev) => ({ 
              ...prev, 
              title: text.trim() === "" ? "Title is required." : null }));
          }}
          placeholder="What are you selling?"
          placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
        />
        {fieldErrors.title && <Text style={styles.errorText}>{fieldErrors.title}</Text>}
        
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, fieldErrors.description && styles.error]}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setFieldErrors((prev) => ({ 
              ...prev, 
              description: text.trim() === "" ? "Description cannot be empty." : null, }));
          }}
          placeholder="Describe your item"
          placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
          multiline
          numberOfLines={4}
        />
        {fieldErrors.description && <Text style={styles.errorText}>{fieldErrors.description}</Text>}
        
        <Text style={styles.label}>Price *</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={[styles.priceInput, fieldErrors.price && styles.error]}
            value={price}
            onChangeText={(text) => {
              setPrice(text);const parsedPrice = parseFloat(text);
              let errorMessage = null;
  
              if (text.trim() === "") {
                  errorMessage = "Enter a valid price.";
              } else if (isNaN(parsedPrice)) {
                  errorMessage = "Price must be a number.";
              } else if (parsedPrice < 0) {
                  errorMessage = "Price cannot be negative.";
              }
              setFieldErrors((prev) => ({ 
                ...prev, 
                price: errorMessage }));
            }}
            placeholder="0.00"
            placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
            keyboardType="decimal-pad"
          />
        </View>
        {fieldErrors.price && <Text style={styles.errorText}>{fieldErrors.price}</Text>}
        
        <Text style={styles.label}>Category *</Text>
        <TextInput
          style={[styles.input, fieldErrors.category && styles.error]}
          value={category}
          onChangeText={(text) => {
            setCategory(text);
            setFieldErrors((prev) => ({ 
              ...prev, 
              category: text.trim() === "" ? "Category is required." : null, }));
          }}
          placeholder="e.g. Electronics, Textbooks, Furniture"
          placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
        />
        {fieldErrors.category && <Text style={styles.errorText}>{fieldErrors.category}</Text>}
        
        <Text style={styles.label}>Condition</Text>
        <TextInput
          style={styles.input}
          value={condition}
          onChangeText={setCondition}
          placeholder="e.g. New, Like New, Good, Fair"
          placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
        />
        
        <Text style={styles.label}>Location on Campus</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Where on campus?"
          placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
        />
        
        <Text style={styles.label}>Images</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <Text style={styles.imagePickerText}>+ Add Photos</Text>
        </TouchableOpacity>
        
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={submitListing}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      fontWeight: '500',
    },
    input: {
      height: 40,
      borderColor: '#ddd',
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 15,
      paddingHorizontal: 10,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
      paddingTop: 10,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    dollarSign: {
      fontSize: 18,
      marginRight: 5,
    },
    priceInput: {
      flex: 1,
      height: 40,
      borderColor: '#ddd',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
    },
    imagePicker: {
      height: 100,
      borderStyle: 'dashed',
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    imagePickerText: {
      color: '#2196F3',
    },
    imagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 15,
    },
    imageWrapper: {
      position: 'relative',
      width: 100,
      height: 100,
      margin: 5,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      borderRadius: 5,
    },
    removeButton: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: 'red',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: '#2196F3',
      padding: 14,
      borderRadius: 5,
      alignItems: 'center',
      marginVertical: 20,
    },
    buttonDisabled: {
      backgroundColor: '#A9A9A9',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    error: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: -10,
      marginBottom: 10,
    }
  });