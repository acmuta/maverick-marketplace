import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Utility to wrap Moti Skeleton with Theme
function ThemedSkeleton({ width, height, radius = 4, style }) {
    const { colors, dark } = useTheme();
    return (
        <View style={style}>
            <Skeleton
                colorMode={dark ? 'dark' : 'light'}
                width={width}
                height={height}
                radius={radius}
                colors={dark ?
                    [colors.surfaceVariant, colors.surface, colors.surfaceVariant] :
                    [colors.surfaceVariant, colors.surface, colors.surfaceVariant]}
            />
        </View>
    );
}

// Skeleton for listing cards in grid layout
export function SkeletonCard() {
    const { colors } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <ThemedSkeleton width={CARD_WIDTH - 16} height={CARD_WIDTH - 16} radius={12} style={{ marginBottom: 8 }} />
            <ThemedSkeleton width={'80%'} height={16} radius={4} style={{ marginBottom: 6 }} />
            <ThemedSkeleton width={'40%'} height={20} radius={4} />
        </View>
    );
}

// Skeleton grid for home and search screens
export function SkeletonGrid({ count = 6 }) {
    return (
        <View style={styles.grid}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

// Skeleton for chat list items
export function SkeletonChatItem() {
    const { colors } = useTheme();

    return (
        <View style={[styles.chatItem, { borderBottomColor: colors.outline }]}>
            <ThemedSkeleton width={48} height={48} radius={24} style={{ marginRight: 16 }} />
            <View style={styles.chatContent}>
                <ThemedSkeleton width={'60%'} height={16} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={'80%'} height={14} radius={4} />
            </View>
        </View>
    );
}

// Skeleton chat list
export function SkeletonChatList({ count = 5 }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonChatItem key={index} />
            ))}
        </View>
    );
}

// Skeleton for profile page
export function SkeletonProfile() {
    return (
        <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
                <ThemedSkeleton width={100} height={100} radius={50} style={{ marginBottom: 16 }} />
                <ThemedSkeleton width={150} height={24} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={200} height={16} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={120} height={24} radius={12} />
            </View>
            <View style={styles.profileListings}>
                <ThemedSkeleton width={100} height={20} radius={4} style={{ marginBottom: 12 }} />
                {Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonProfileListingItem key={index} />
                ))}
            </View>
        </View>
    );
}

// Skeleton for profile listing item
function SkeletonProfileListingItem() {
    const { colors } = useTheme();

    return (
        <View style={[styles.profileListingItem, { backgroundColor: colors.surface }]}>
            <ThemedSkeleton width={50} height={50} radius={8} style={{ marginRight: 12 }} />
            <View style={styles.profileListingContent}>
                <ThemedSkeleton width={'70%'} height={16} radius={4} style={{ marginBottom: 6 }} />
                <ThemedSkeleton width={60} height={12} radius={4} />
            </View>
            <ThemedSkeleton width={50} height={18} radius={4} />
        </View>
    );
}

// Skeleton for listing detail page
export function SkeletonListingDetail() {
    const { colors } = useTheme();

    return (
        <View style={styles.detailContainer}>
            <ThemedSkeleton width={width} height={width} radius={0} />
            <View style={styles.detailContent}>
                <ThemedSkeleton width={100} height={36} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={'80%'} height={28} radius={4} style={{ marginBottom: 16 }} />
                <ThemedSkeleton width={80} height={28} radius={8} style={{ marginBottom: 24 }} />

                <View style={{ width: '100%', height: 1, backgroundColor: colors.surfaceVariant, marginBottom: 24 }} />

                <ThemedSkeleton width={48} height={48} radius={24} style={{ marginBottom: 24 }} />

                <View style={{ width: '100%', height: 1, backgroundColor: colors.surfaceVariant, marginBottom: 24 }} />

                <ThemedSkeleton width={100} height={20} radius={4} style={{ marginBottom: 12 }} />
                <ThemedSkeleton width={'100%'} height={16} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={'90%'} height={16} radius={4} style={{ marginBottom: 8 }} />
                <ThemedSkeleton width={'70%'} height={16} radius={4} />
            </View>
        </View>
    );
}

// Skeleton for chat message
function SkeletonChatMessage({ isMine }) {
    const { colors } = useTheme();

    return (
        <View style={{
            flexDirection: 'row',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            marginBottom: 16,
            paddingHorizontal: 16,
        }}>
            {!isMine && (
                <ThemedSkeleton width={32} height={32} radius={16} style={{ marginRight: 8, alignSelf: 'flex-end' }} />
            )}
            <View style={{
                width: '70%',
                alignItems: isMine ? 'flex-end' : 'flex-start',
            }}>
                <ThemedSkeleton
                    width={'100%'}
                    height={40}
                    radius={16}
                    style={{
                        borderBottomRightRadius: isMine ? 4 : 16,
                        borderBottomLeftRadius: !isMine ? 4 : 16,
                    }}
                />
                <ThemedSkeleton width={50} height={12} radius={4} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
}

// Skeleton message list
export function SkeletonMessageList() {
    return (
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 20 }}>
            <SkeletonChatMessage isMine={false} />
            <SkeletonChatMessage isMine={true} />
            <SkeletonChatMessage isMine={false} />
            <SkeletonChatMessage isMine={true} />
            <SkeletonChatMessage isMine={true} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginBottom: 16,
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingTop: 16,
        justifyContent: 'space-between',
    },
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
    },
    chatContent: {
        flex: 1,
    },
    profileContainer: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    profileListings: {
        padding: 16,
    },
    profileListingItem: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderRadius: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    profileListingContent: {
        flex: 1,
    },
    detailContainer: {
        flex: 1,
    },
    detailContent: {
        padding: 20,
    },
});
