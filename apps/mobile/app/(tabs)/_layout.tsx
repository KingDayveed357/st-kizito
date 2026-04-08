import { Tabs } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../src/theme';

export default function TabLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.surfaceElevated,
                    height: spacing.tabBarHeight,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: typography.sans,
                    fontSize: typography.sizes.xs,
                    marginTop: 4,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="readings"
                options={{
                    title: 'Readings',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="divine-office"
                options={{
                    title: 'Office',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "business" : "business-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="parish"
                options={{
                    title: 'Parish',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}