import "./pollyfilles";

import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "./contexts/WalletContext";
import "expo-router/entry";

export default function WalletConnectionScreen() {
  const { isConnecting, isConnected, connectWallet } = useWallet();
  const router = useRouter();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      // Navigation is now handled in the WalletContext
    } catch (error) {
      console.error("Failed to connect wallet", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: "https://solana.com/src/img/branding/solanaLogoMark.svg",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Connect Your Solana Wallet</Text>
        <Text style={styles.subtitle}>
          Join challenges, vote, and earn rewards by connecting your wallet
        </Text>

        <TouchableOpacity
          style={[
            styles.connectButton,
            isConnecting && styles.connectingButton,
          ]}
          onPress={handleConnectWallet}
          disabled={isConnecting || isConnected}>
          {isConnecting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.connectButtonText}>
              {isConnected ? "Wallet Connected" : "Connect Wallet"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            By connecting your wallet, you agree to our Terms of Service and
            Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectingButton: {
    backgroundColor: "#818cf8",
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  infoContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
});
