import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PublicKey } from "@solana/web3.js";
import { ChallengeType } from "../services/contractService";
import * as Crypto from "expo-crypto";
import * as contractService from "../services/contractService";
import { useWallet } from "../contexts/WalletContext";
import { useConnection } from "../hooks/useConnection";
import { MINT_OF_TOKEN_TO_PARTICIPATE_IN_CHALLENGE } from "../utils";
import * as Google from "expo-auth-session/providers/google";

// Define the schema
const challengeFormSchema = z.object({
  title: z.string().min(4, { message: "Title must be at least 4 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  challenge_type: z.nativeEnum(ChallengeType),
  steps_per_day: z
    .number()
    .min(0, { message: "Steps per day must be at least 1000" })
    .optional(),
  commits_per_day: z
    .number()
    .min(1, { message: "Commits per day must be at least 1" })
    .optional(),
  start_time: z.date(),
  end_time: z.date(),
  money_per_participant: z
    .number()
    .min(1, { message: "Amount must be at least 1 LAMPORTS" }),
  is_private: z.boolean(),
  private_participants: z.array(z.string()).optional(),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

// Google Fit configuration
const GOOGLE_FIT_CLIENT_ID =
  "669237031928-cjknnm3bd4q4e8j7a9r6j73vp438of9b.apps.googleusercontent.com"; // Replace with your actual client ID
const GOOGLE_FIT_REDIRECT_URI = "myapp://oauth2redirect"; // Replace with your app's redirect URI
const GOOGLE_FIT_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read";

export default function CreateChallengeScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privateParticipant, setPrivateParticipant] = useState("");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [googleFitAuthorized, setGoogleFitAuthorized] = useState(false);
  const { program, userPublickey, signAndSendTransaction } = useWallet();
  const connection = useConnection();
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_FIT_CLIENT_ID,
    scopes: [GOOGLE_FIT_SCOPE],
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      challenge_type: ChallengeType.GITHUB,
      steps_per_day: 10000,
      commits_per_day: 3,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      money_per_participant: 10,
      is_private: false,
      private_participants: [],
    },
  });

  const isPrivate = watch("is_private");
  const privateParticipants = watch("private_participants") || [];
  const challengeType = watch("challenge_type");

  useEffect(() => {
    if (challengeType === ChallengeType.GOOGLE_FIT && !googleFitAuthorized) {
      Alert.alert(
        "Google Fit Authorization",
        "This challenge requires access to your Google Fit data. Would you like to authorize now?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Authorize",
            onPress: () => promptAsync(),
          },
        ]
      );
    }
  }, [challengeType]);

  useEffect(() => {
    console.log(response);
  }, [response]);

  const requestGoogleFitAuthorization = async () => {
    try {
      const result = await promptAsync();
      console.log("Prompt async result:", response);
    } catch (error) {
      console.error("Error requesting Google Fit authorization:", error);
      Alert.alert(
        "Authorization Failed",
        "Failed to request Google Fit authorization. Please try again later."
      );
    }
  };

  const handleRedirect = async (event) => {
    const { url } = event;
    console.log("Handling redirect URL:", url);

    if (url && url.includes("code=")) {
      try {
        // Extract code properly, handling URL encoding
        const code = decodeURIComponent(url.split("code=")[1].split("&")[0]);
        console.log("Extracted code:", code);

        // Use your actual backend URL here (not localhost for mobile)
        const apiUrl = "http://10.0.2.2:3000/api/google-fit/auth"; // For Android emulator

        console.log("Sending code to API:", apiUrl);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            user_id: userPublickey.toString(),
            redirect_uri: GOOGLE_FIT_REDIRECT_URI, // Send the redirect_uri with the request
          }),
        });

        const responseData = await response.json();
        console.log("API response:", responseData);

        if (response.ok) {
          setGoogleFitAuthorized(true);
          Alert.alert(
            "Authorization Successful",
            "Google Fit has been successfully authorized for step tracking."
          );
        } else {
          Alert.alert(
            "Authorization Failed",
            `Failed to complete Google Fit authorization. Error: ${
              responseData.error || "Unknown error"
            }`
          );
        }
      } catch (error) {
        console.error("Error exchanging auth code:", error);
        Alert.alert(
          "Authorization Failed",
          `Failed to complete Google Fit authorization: ${error.message}`
        );
      }
    } else if (url) {
      console.log("Redirect URL doesn't contain auth code:", url);
      Alert.alert(
        "Authorization Failed",
        "Did not receive authorization code from Google. Please try again."
      );
    }
  };

  // useEffect(() => {
  //   console.log(response);
  // }, [response]);

  const addPrivateParticipant = () => {
    if (!privateParticipant.trim()) {
      Alert.alert("Error", "Please enter a valid wallet address");
      return;
    }

    setValue("private_participants", [
      ...privateParticipants,
      privateParticipant.trim(),
    ]);
    setPrivateParticipant("");
  };

  const removePrivateParticipant = (index: number) => {
    const newParticipants = [...privateParticipants];
    // newParticipants.splice(index, 1);
    setValue("private_participants", newParticipants);
  };

  const onSubmit = async (data: ChallengeFormValues) => {
    if (
      data.challenge_type === ChallengeType.GOOGLE_FIT &&
      !googleFitAuthorized
    ) {
      Alert.alert(
        "Authorization Required",
        "Google Fit authorization is required to create this challenge.",
        [
          {
            text: "Authorize",
            onPress: requestGoogleFitAuthorization,
          },
        ]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const challengeId = Crypto.getRandomValues(new Uint8Array(1))[0];

      const mint = new PublicKey(MINT_OF_TOKEN_TO_PARTICIPATE_IN_CHALLENGE); // JKCOIN on devnet

      const txs = await contractService.initializeChallenge(
        program,
        challengeId,
        data.challenge_type,
        data.start_time,
        data.end_time,
        data.money_per_participant,
        data.is_private,
        data.private_participants || [],
        mint,
        userPublickey,
        data.title,
        data.description,
        data.steps_per_day,
        data.commits_per_day
      );
      console.log(txs);

      const signature = await signAndSendTransaction(txs);

      await connection.confirmTransaction(signature, "confirmed");

      console.log("Challenge created with ID:", challengeId);

      if (data.challenge_type === ChallengeType.GOOGLE_FIT) {
        try {
          await fetch(
            "http://10.0.2.2:3000/api/google-fit/register-challenge",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                challenge_id: challengeId,
                user_id: userPublickey.toString(),
                steps_per_day: data.steps_per_day,
                start_time: data.start_time.toISOString(),
                end_time: data.end_time.toISOString(),
              }),
            }
          );
        } catch (error) {
          console.error("Error registering challenge with backend:", error);
        }
      }

      setIsSubmitting(false);
      Alert.alert(
        "Challenge Created!",
        "Your challenge has been successfully created on the blockchain.",
        [{ text: "OK", onPress: () => router.replace("/challenges") }]
      );
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(
        "Error",
        "Failed to create challenge. Please try again later."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create a Challenge</Text>
          <Text style={styles.headerSubtitle}>
            Set up a new challenge for the community
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Enter challenge title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.textArea,
                    errors.description && styles.inputError,
                  ]}
                  placeholder="Describe your challenge"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Challenge Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.GOOGLE_FIT &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.GOOGLE_FIT)
                }>
                <Ionicons
                  name="fitness-outline"
                  size={24}
                  color={
                    challengeType === ChallengeType.GOOGLE_FIT
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.GOOGLE_FIT &&
                      styles.typeButtonTextActive,
                  ]}>
                  GoogleFit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.GITHUB &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.GITHUB)
                }>
                <Ionicons
                  name="logo-github"
                  size={24}
                  color={
                    challengeType === ChallengeType.GITHUB
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.GITHUB &&
                      styles.typeButtonTextActive,
                  ]}>
                  GitHub
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.VOTE_BASED &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.VOTE_BASED)
                }>
                <Ionicons
                  name="thumbs-up-outline"
                  size={24}
                  color={
                    challengeType === ChallengeType.VOTE_BASED
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.VOTE_BASED &&
                      styles.typeButtonTextActive,
                  ]}>
                  Votebased
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Time & Rewards</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <Controller
              control={control}
              name="start_time"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {value.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    {value.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Ionicons name="calendar-outline" size={24} color="#6b7280" />
                </TouchableOpacity>
              )}
            />

            {showStartDatePicker && Platform.OS === "ios" && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.iosPickerDoneBtn}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Controller
                  control={control}
                  name="start_time"
                  render={({ field: { onChange, value } }) => (
                    <DateTimePicker
                      testID="startDatePicker"
                      value={value}
                      mode="datetime"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || value;
                        onChange(currentDate);
                      }}
                    />
                  )}
                />
              </View>
            )}

            {showStartDatePicker && Platform.OS === "android" && (
              <Controller
                control={control}
                name="start_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    testID="startDatePicker"
                    value={value}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        // Create a new date with the selected date but keep the original time
                        const newDate = new Date(selectedDate);
                        newDate.setHours(value.getHours());
                        newDate.setMinutes(value.getMinutes());
                        onChange(newDate);
                        // Show the time picker after date selection
                        setShowStartTimePicker(true);
                      }
                    }}
                  />
                )}
              />
            )}

            {showStartTimePicker && Platform.OS === "android" && (
              <Controller
                control={control}
                name="start_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    testID="startTimePicker"
                    value={value}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(false);
                      if (selectedTime) {
                        // Create a new date with the original date but selected time
                        const newDateTime = new Date(value);
                        newDateTime.setHours(selectedTime.getHours());
                        newDateTime.setMinutes(selectedTime.getMinutes());
                        onChange(newDateTime);
                      }
                    }}
                  />
                )}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <Controller
              control={control}
              name="end_time"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {value.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    {value.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Ionicons name="calendar-outline" size={24} color="#6b7280" />
                </TouchableOpacity>
              )}
            />

            {showEndDatePicker && Platform.OS === "ios" && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.iosPickerDoneBtn}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Controller
                  control={control}
                  name="end_time"
                  render={({ field: { onChange, value } }) => (
                    <DateTimePicker
                      testID="endDatePicker"
                      value={value}
                      mode="datetime"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || value;
                        onChange(currentDate);
                      }}
                    />
                  )}
                />
              </View>
            )}

            {showEndDatePicker && Platform.OS === "android" && (
              <Controller
                control={control}
                name="end_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    testID="endDatePicker"
                    value={value}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        // Create a new date with the selected date but keep the original time
                        const newDate = new Date(selectedDate);
                        newDate.setHours(value.getHours());
                        newDate.setMinutes(value.getMinutes());
                        onChange(newDate);
                        // Show the time picker after date selection
                        setShowEndTimePicker(true);
                      }
                    }}
                  />
                )}
              />
            )}

            {showEndTimePicker && Platform.OS === "android" && (
              <Controller
                control={control}
                name="end_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    testID="endTimePicker"
                    value={value}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (selectedTime) {
                        // Create a new date with the original date but selected time
                        const newDateTime = new Date(value);
                        newDateTime.setHours(selectedTime.getHours());
                        newDateTime.setMinutes(selectedTime.getMinutes());
                        onChange(newDateTime);
                      }
                    }}
                  />
                )}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Money per Participant (LAMPORTS)</Text>
            <Controller
              control={control}
              name="money_per_participant"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.money_per_participant && styles.inputError,
                  ]}
                  placeholder="10"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(Number(text) || 0)}
                  value={value.toString()}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.money_per_participant && (
              <Text style={styles.errorText}>
                {errors.money_per_participant.message}
              </Text>
            )}
          </View>

          {challengeType === ChallengeType.GOOGLE_FIT && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Steps/Day</Text>
              <Controller
                control={control}
                name="steps_per_day"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      errors.steps_per_day && styles.inputError,
                    ]}
                    placeholder="10000"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.steps_per_day && (
                <Text style={styles.errorText}>
                  {errors.steps_per_day.message}
                </Text>
              )}
            </View>
          )}

          {challengeType === ChallengeType.GITHUB && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Commits/Day</Text>
              <Controller
                control={control}
                name="commits_per_day"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      errors.commits_per_day && styles.inputError,
                    ]}
                    placeholder="3"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.commits_per_day && (
                <Text style={styles.errorText}>
                  {errors.commits_per_day.message}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <View style={styles.privateToggleContainer}>
              <Text style={styles.label}>Private Challenge</Text>
              <Controller
                control={control}
                name="is_private"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
                    thumbColor={value ? "#6366f1" : "#f4f3f4"}
                    onValueChange={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            <Text style={styles.helperText}>
              Private challenges are only visible to invited participants
            </Text>
          </View>

          {isPrivate && (
            <View style={styles.privateParticipantsSection}>
              <Text style={styles.label}>Add Participants</Text>

              <View style={styles.participantInputContainer}>
                <TextInput
                  style={styles.participantInput}
                  placeholder="Enter wallet address"
                  value={privateParticipant}
                  onChangeText={setPrivateParticipant}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addPrivateParticipant}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {privateParticipants.length > 0 && (
                <View style={styles.participantsList}>
                  {privateParticipants.map((participant, index) => (
                    <View key={index} style={styles.participantItem}>
                      <Text style={styles.participantAddress} numberOfLines={1}>
                        {participant}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removePrivateParticipant(index)}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.submitButtonText}>Create Challenge</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  textArea: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    height: 100,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f7",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: "#6366f1",
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
    marginTop: 8,
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#1f2937",
  },
  privateToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privateParticipantsSection: {
    marginTop: 16,
  },
  participantInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  participantsList: {
    marginTop: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  participantAddress: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  iosPickerContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iosPickerDoneBtn: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
});
