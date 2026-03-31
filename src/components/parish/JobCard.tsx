import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';

export const JobCard: React.FC<any> = ({ job, onPress }) => {
    const { colors } = useTheme();

    return (
        <Card onPress={onPress} className="mb-4">
            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg mb-1">{job.title}</Text>
            <Text style={{ color: colors.textSecondary }} className="font-sans text-sm">{job.company}</Text>
        </Card>
    );
};