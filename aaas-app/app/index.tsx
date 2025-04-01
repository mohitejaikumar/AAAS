import "./pollyfilles";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "./contexts/WalletContext";
import "expo-router/entry";
import { Alert } from "react-native";
import React, { useRef, useEffect } from "react";

export default function WalletConnectionScreen() {
  const { isConnecting, isConnected, connectWallet } = useWallet();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      // Navigation is now handled in the WalletContext
    } catch (error) {
      Alert.alert("Failed to connect wallet", error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.card,
            isDark && styles.cardDark,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://solana.com/src/img/branding/solanaLogoMark.svg",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>
            Connect Your Wallet
          </Text>

          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Join challenges, vote, and earn rewards on Solana
          </Text>

          <TouchableOpacity
            style={[
              styles.connectButton,
              isConnecting && styles.connectingButton,
              isConnected && styles.connectedButton,
              isDark && styles.connectButtonDark,
            ]}
            onPress={handleConnectWallet}
            disabled={isConnecting || isConnected}>
            {isConnecting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <View style={styles.buttonContent}>
                  <Image
                    source={{
                      uri: "https://cryptologos.cc/logos/solana-sol-logo.png",
                    }}
                    style={styles.buttonIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.connectButtonText}>
                    {isConnected ? "Wallet Connected" : "Connect Wallet"}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, isDark && styles.dividerLineDark]}
            />
            <Text
              style={[styles.dividerText, isDark && styles.dividerTextDark]}>
              Secured by Solana
            </Text>
            <View
              style={[styles.dividerLine, isDark && styles.dividerLineDark]}
            />
          </View>

          <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
            By connecting your wallet, you agree to our Terms of Service and
            Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: width > 500 ? 480 : width - 48,
    padding: 32,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardDark: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#000000",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  titleDark: {
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 24,
    maxWidth: 320,
  },
  subtitleDark: {
    color: "#a0aec0",
  },
  connectButton: {
    backgroundColor: "#512da8",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#512da8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDark: {
    backgroundColor: "#7c4dff",
    shadowColor: "#7c4dff",
  },
  connectingButton: {
    backgroundColor: "#7e57c2",
  },
  connectedButton: {
    backgroundColor: "#4caf50",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerLineDark: {
    backgroundColor: "#2d3748",
  },
  dividerText: {
    paddingHorizontal: 12,
    color: "#9ca3af",
    fontSize: 14,
  },
  dividerTextDark: {
    color: "#718096",
  },
  infoText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  infoTextDark: {
    color: "#718096",
  },
});
