import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Modal, Pressable, Platform } from 'react-native';
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
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
    const [showConditionDropdown, setShowConditionDropdown] = useState(false);

    const categories = [
        'Electronics',
        'Textbooks',
        'Furniture',
        'Clothing',
        'Sports Equipment',
        'Home Appliances',
        'School Supplies',
        'Other'
    ];

    const conditions = [
      'New',
      'Like New',
      'Good',
      'Fair',
      'Poor'
    ];

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session) {
                    const user = await account.get();
                    setCurrentUser(user);
                }
            } catch (error) {
                console.log('No active session found');
            } finally {
                setIsLoading(false);
            }
        };
        
        checkSession();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={styles.containerCenter}>
                <Text style={styles.message}>Please log in to create a listing</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        );       
    }

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'We need camera and photo library permissions to upload images',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const pickImageFromGallery = async () => {
      setShowImageSourceDialog(false);
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;
  
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
  
        if (!result.canceled) {
          setImages([...images, result.assets[0]]);
        }
      } catch (error) {
        console.error('Error picking image:', error);
        alert('Failed to pick image from gallery');
      }
    };

    const takePhotoWithCamera = async () => {
      setShowImageSourceDialog(false);
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;
  
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
  
        if (!result.canceled) {
          setImages([...images, result.assets[0]]);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        alert('Failed to take photo');
      }
    };

    const showImagePickerOptions = () => {
        setShowImageSourceDialog(true);
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

        try {
            const listingId = ID.unique();

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
                    const uriParts = image.uri.split('/');
                    const fileName = uriParts[uriParts.length - 1];
                    const fileId = ID.unique();
                    
                    const formData = new FormData();
                    formData.append('fileId', fileId);
                    formData.append('file', {
                      uri: image.uri,
                      name: fileName,
                      type: 'image/jpeg',
                    });
                    
                    const endpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files`;
                    const response = await fetch(endpoint, {
                      method: 'POST',
                      headers: {
                        'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
                      },
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      throw new Error(`HTTP error ${response.status}`);
                    }
                    
                    const fileData = await response.json();
                    
                    await databases.createDocument(
                      DATABASE_ID,
                      IMAGES_COLLECTION_ID,
                      ID.unique(),
                      {
                        listingId,
                        fileId: fileData.$id || fileId,
                        order: index,
                      }
                    );
                  } catch (error) {
                    console.error(`Upload failed for image ${index}:`, error);
                  }
                }));
              }

            Alert.alert('Success', 'Your listing has been created!');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error creating listing:', error);
            Alert.alert('Error', 'Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectCategory = (selectedCategory) => {
      setCategory(selectedCategory);
      setShowCategoryDropdown(false);
      setFieldErrors(prev => ({ ...prev, category: null }));
    };
    
    const selectCondition = (selectedCondition) => {
      setCondition(selectedCondition);
      setShowConditionDropdown(false);
    };

    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create New Listing</Text>
        
        {/* Images Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.sectionSubtitle}>First image will be the cover photo</Text>
          
          <View style={styles.imagesRow}>
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
            
            <TouchableOpacity 
              style={styles.addImageButton} 
              onPress={() => setShowImageSourceDialog(true)}
            >
              <View style={styles.addImageContent}>
                <Text style={styles.plusIcon}>+</Text>
                <Text style={styles.addImageText}>Add Photo</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Title Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, fieldErrors.title && styles.errorInput]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setFieldErrors(prev => ({ 
                ...prev, 
                title: text.trim() === "" ? "Title is required." : null 
              }));
            }}
            placeholder="What are you selling?"
          />
          {fieldErrors.title && <Text style={styles.errorText}>{fieldErrors.title}</Text>}
        </View>
        
        {/* Price Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
          <View style={[styles.priceContainer, fieldErrors.price && styles.errorInput]}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                const parsedPrice = parseFloat(text);
                let errorMessage = null;
    
                if (text.trim() === "") {
                  errorMessage = "Enter a valid price.";
                } else if (isNaN(parsedPrice)) {
                  errorMessage = "Price must be a number.";
                } else if (parsedPrice < 0) {
                  errorMessage = "Price cannot be negative.";
                }
                setFieldErrors(prev => ({ ...prev, price: errorMessage }));
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          {fieldErrors.price && <Text style={styles.errorText}>{fieldErrors.price}</Text>}
        </View>
        
        {/* Category Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.dropdown, fieldErrors.category && styles.errorInput]} 
            onPress={() => setShowCategoryDropdown(true)}
          >
            <Text style={category ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {category || 'Select a category'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {fieldErrors.category && <Text style={styles.errorText}>{fieldErrors.category}</Text>}
        </View>
        
        {/* Condition Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Condition</Text>
          <TouchableOpacity 
            style={styles.dropdown} 
            onPress={() => setShowConditionDropdown(true)}
          >
            <Text style={condition ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {condition || 'Select condition'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        {/* Location Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location on Campus</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Where on campus?"
            />
          </View>
        </View>
        
        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea, fieldErrors.description && styles.errorInput]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setFieldErrors(prev => ({ 
                ...prev, 
                description: text.trim() === "" ? "Description cannot be empty." : null 
              }));
            }}
            placeholder="Describe your item in detail. Include any relevant information that buyers would want to know."
            multiline
            numberOfLines={6}
          />
          {fieldErrors.description && <Text style={styles.errorText}>{fieldErrors.description}</Text>}
        </View>
        
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            By posting this listing, you agree to our terms of service and community guidelines.
            Your contact information will be shared with interested buyers.
          </Text>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={submitListing}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Post Listing</Text>
          )}
        </TouchableOpacity>
        
        {/* Required Fields Note */}
        <Text style={styles.requiredNote}>Fields marked with * are required</Text>
  
        <View style={styles.bottomSpacer} />
        
        {/* Category Modal */}
        <Modal
          visible={showCategoryDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowCategoryDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <ScrollView style={styles.modalScrollView}>
                {categories.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => selectCategory(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryDropdown(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        
        {/* Condition Modal */}
        <Modal
          visible={showConditionDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConditionDropdown(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowConditionDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <ScrollView style={styles.modalScrollView}>
                {conditions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => selectCondition(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowConditionDropdown(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        
        {/* Image Source Modal */}
        <Modal
          visible={showImageSourceDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageSourceDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContent}>
              <Text style={styles.modalTitle}>Add Photo</Text>
              <TouchableOpacity
                style={[styles.imageModalButton, styles.cameraButton]}
                onPress={takePhotoWithCamera}
              >
                <Text style={styles.imageModalButtonText}>📸 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageModalButton, styles.galleryButton]}
                onPress={pickImageFromGallery}
              >
                <Text style={styles.imageModalButtonText}>🖼️ Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageModalButton, styles.cancelButton]}
                onPress={() => setShowImageSourceDialog(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f7',
    },
    containerCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    message: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: '#1a73e8',
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
      color: '#333',
    },
    sectionSubtitle: {
      fontSize: 12,
      color: '#888',
      marginBottom: 10,
      fontStyle: 'italic',
    },
    imagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    imageWrapper: {
      position: 'relative',
      width: 100,
      height: 100,
      margin: 4,
      borderRadius: 8,
      overflow: 'hidden',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
    },
    removeButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    addImageButton: {
      width: 100,
      height: 100,
      margin: 4,
      borderWidth: 1,
      borderColor: '#ccc',
      borderStyle: 'dashed',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
    },
    addImageContent: {
      alignItems: 'center',
    },
    plusIcon: {
      fontSize: 24,
      color: '#1a73e8',
      marginBottom: 4,
    },
    addImageText: {
      fontSize: 12,
      color: '#1a73e8',
    },
    fieldContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
      color: '#333',
    },
    required: {
      color: '#e53935',
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: 'white',
      fontSize: 16,
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
      paddingTop: 12,
      paddingBottom: 12,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      backgroundColor: 'white',
    },
    dollarSign: {
      paddingLeft: 15,
      fontSize: 18,
      color: '#333',
    },
    priceInput: {
      flex: 1,
      height: 50,
      paddingHorizontal: 5,
      fontSize: 16,
    },
    dropdown: {
      height: 50,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownSelectedText: {
      fontSize: 16,
      color: '#333',
    },
    dropdownPlaceholder: {
      fontSize: 16,
      color: '#aaa',
    },
    dropdownArrow: {
      fontSize: 12,
      color: '#777',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      backgroundColor: 'white',
    },
    locationIcon: {
      paddingLeft: 15,
      fontSize: 16,
    },
    locationInput: {
      flex: 1,
      height: 50,
      paddingHorizontal: 5,
      fontSize: 16,
    },
    infoBox: {
      backgroundColor: '#e3f2fd',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#bbdefb',
    },
    infoIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: '#0d47a1',
      lineHeight: 18,
    },
    button: {
      backgroundColor: '#1a73e8',
      height: 54,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonDisabled: {
      backgroundColor: '#9e9e9e',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    requiredNote: {
      textAlign: 'center',
      fontSize: 12,
      color: '#777',
      marginBottom: 20,
    },
    bottomSpacer: {
      height: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      maxHeight: '70%',
    },
    imageModalContent: {
      width: '80%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
      color: '#333',
    },
    modalScrollView: {
      maxHeight: 300,
    },
    modalItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    modalItemText: {
      fontSize: 16,
      color: '#333',
    },
    modalCloseButton: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
    },
    modalCloseButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#777',
    },
    imageModalButton: {
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 10,
    },
    cameraButton: {
      backgroundColor: '#1a73e8',
    },
    galleryButton: {
      backgroundColor: '#43a047',
    },
    cancelButton: {
      backgroundColor: '#f5f5f5',
    },
    imageModalButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    cancelButtonText: {
      color: '#777',
      fontSize: 16,
      fontWeight: '500',
    },
    errorInput: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
      marginBottom: 4,
    }
  });