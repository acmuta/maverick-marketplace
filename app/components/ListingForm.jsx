import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Modal, Pressable, Platform, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ID, Role, Permission } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import {
    account,
    databases, 
    storage, 
    DATABASE_ID, 
    LISTINGS_COLLECTION_ID,
    IMAGES_COLLECTION_ID,
    IMAGES_BUCKET_ID 
} from '../../appwrite';

const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  lightBlue: '#1565C0',
  orange: '#FF6F00', 
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  mediumGray: '#B0BEC5',
  darkGray: '#546E7A',
  error: '#FF5252',
  success: '#4CAF50',
  background: '#0A1929',
  cardBackground: '#0F2942',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
};

export default function ListingForm() {
    const insets = useSafeAreaInsets();
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

    const handleSelectImage = () => {
      Alert.alert(
        'Add Photo',
        'Choose a source',
        [
          {
            text: 'Take Photo',
            onPress: () => selectImageFromCamera(),
          },
          {
            text: 'Choose from Gallery',
            onPress: () => selectImageFromGallery(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    };

    const selectImageFromGallery = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access gallery was denied');
          return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          const newImagesArray = [...images, pickerResult.assets[0]];
          setImages(newImagesArray);
        }
      } catch (err) {
        console.error('Error selecting from gallery:', err);
        Alert.alert('Error', 'Could not select image from gallery');
      }
    };

    const selectImageFromCamera = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access camera was denied');
          return;
        }

        const pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          const newImagesArray = [...images, pickerResult.assets[0]];
          setImages(newImagesArray);
        }
      } catch (err) {
        console.error('Error taking photo:', err);
        Alert.alert('Error', 'Could not take photo');
      }
    };

    const removeImage = (index) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
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
            const documentData = {
              title: title.trim(),
              description: description.trim(),
              price: parseFloat(price),
              category: category.trim(),
              condition: condition.trim(),
              location: location.trim(),
              userId: currentUser.$id,
              createdAt: new Date().toISOString(),
              status: 'active',
            };
            
            console.log('Creating document with data:', JSON.stringify(documentData, null, 2));
            console.log('Using collection ID:', LISTINGS_COLLECTION_ID);
            console.log('Using database ID:', DATABASE_ID);
            await databases.createDocument(
                DATABASE_ID,
                LISTINGS_COLLECTION_ID,
                listingId,
                documentData,
                [
                  Permission.read(Role.any()),
                  Permission.update(Role.user(currentUser.$id)),
                  Permission.delete(Role.user(currentUser.$id))
                ]
            );

            if (images.length > 0) {
                await Promise.all(images.map(async (image, index) => {
                  try {
                    const fileName = image.uri.split('/').pop() || 'image.jpg';
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

            Alert.alert('Success', 'Your listing has been created!', [
              {
                text: 'OK',
                onPress: () => {
                  // Reset form
                  setTitle('');
                  setDescription('');
                  setPrice('');
                  setCategory('');
                  setCondition('');
                  setLocation('');
                  setImages([]);
                  setFieldErrors({});
                  
                  // Navigate back to listings
                  router.replace('/(tabs)');
                }
              }
            ]);
            
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

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
                <ActivityIndicator size="large" color={COLORS.brightOrange} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={[styles.containerCenter, { paddingTop: insets.top }]}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
                <Text style={styles.message}>Please log in to create a listing</Text>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
                    <Text style={styles.loginButtonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        );       
    }

    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
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
              onPress={handleSelectImage}
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
            placeholderTextColor={COLORS.mediumGray}
            color={COLORS.textPrimary}
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
              placeholderTextColor={COLORS.mediumGray}
              keyboardType="decimal-pad"
              color={COLORS.textPrimary}
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
              placeholderTextColor={COLORS.mediumGray}
              color={COLORS.textPrimary}
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
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={6}
            color={COLORS.textPrimary}
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
      </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  loginButton: {
    backgroundColor: COLORS.brightOrange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: 200,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
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
    color: COLORS.brightOrange,
  },
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.white,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
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
    borderColor: COLORS.mediumGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 41, 66, 0.5)',
  },
  addImageContent: {
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 24,
    color: COLORS.brightOrange,
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.brightOrange,
  },
  fieldContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.white,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.darkBlue,
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
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: COLORS.darkBlue,
  },
  dollarSign: {
    paddingLeft: 15,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  priceInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 5,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.darkBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: COLORS.darkBlue,
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
    color: COLORS.textPrimary,
  },
  infoBox: {
    backgroundColor: 'rgba(21, 101, 192, 0.2)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(21, 101, 192, 0.3)',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.brightOrange,
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: COLORS.darkGray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  requiredNote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: COLORS.white,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
});