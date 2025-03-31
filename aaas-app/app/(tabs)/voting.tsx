import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data for votable challenges
const VOTABLE_CHALLENGES = [
  {
    id: '1',
    title: 'Best UI Design',
    description: 'Vote for the best UI design for a crypto wallet app.',
    end_time: '2023-06-22T23:59:59Z',
    total_participants: 18,
    total_votes: 35,
    participants_voted: 8,
    voting_reward: 10,
    category: 'Design',
  },
  {
    id: '2',
    title: 'Web3 Portfolio Site Challenge',
    description: 'Select the most impressive web3 developer portfolio site.',
    end_time: '2023-06-30T23:59:59Z',
    total_participants: 12,
    total_votes: 18,
    participants_voted: 4,
    voting_reward: 8,
    category: 'Development',
  },
  {
    id: '3',
    title: 'DeFi Dashboard Challenge',
    description: 'Vote for the most intuitive DeFi dashboard design.',
    end_time: '2023-07-15T23:59:59Z',
    total_participants: 15,
    total_votes: 7,
    participants_voted: 3,
    voting_reward: 12,
    category: 'Design',
  },
  {
    id: '4',
    title: 'Solana dApp Dev Challenge',
    description: 'Vote for the most innovative Solana dApp projects.',
    end_time: '2023-07-10T23:59:59Z',
    total_participants: 21,
    total_votes: 14,
    participants_voted: 6,
    voting_reward: 15,
    category: 'Development',
  },
];

export default function VotingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [votableChallenges, setVotableChallenges] = useState(VOTABLE_CHALLENGES);
  const router = useRouter();

  const navigateToVoting = (challengeId: string) => {
    router.push(`/(stack)/voting-challenge/${challengeId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderChallengeItem = ({ item }: { item: typeof VOTABLE_CHALLENGES[0] }) => (
    <TouchableOpacity 
      style={styles.challengeCard}
      onPress={() => navigateToVoting(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
      
      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.total_participants} Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.participants_voted} Voted</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>Until {formatDate(item.end_time)}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.rewardContainer}>
          <Ionicons name="gift-outline" size={18} color="#4f46e5" />
          <Text style={styles.rewardText}>
            {item.voting_reward} SOL reward for voting
          </Text>
        </View>
        <View style={styles.voteButtonContainer}>
          <TouchableOpacity 
            style={styles.voteButton}
            onPress={() => navigateToVoting(item.id)}
          >
            <Text style={styles.voteButtonText}>Vote Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={votableChallenges}
        renderItem={renderChallengeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Vote & Earn</Text>
            <Text style={styles.headerSubtitle}>
              Vote for the best submissions and earn SOL rewards
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 4,
  },
  voteButtonContainer: {
    
  },
  voteButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 