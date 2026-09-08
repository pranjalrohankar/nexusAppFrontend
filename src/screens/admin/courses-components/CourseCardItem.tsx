import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from './types';
import { parseSyllabus } from '../../../utils/syllabus-parser';
import { parseTopicsData, isTopicCovered } from '../../../utils/syllabus-progress-store';
import { coursesData } from '../../home/home-screen';

interface CourseCardItemProps {
  item: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export const CourseCardItem = React.memo(({ item, onEdit, onDelete }: CourseCardItemProps) => {
  const formattedDate = useMemo(() => {
    if (!item.startDate) return '';
    try {
      const [y, m, d] = item.startDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return item.startDate;
    }
  }, [item.startDate]);

  const syllabusMetrics = useMemo(() => {
    const rawSyllabus = item.syllabusTopics || (coursesData as any)?.[item.title]?.syllabusTopics || (coursesData as any)?.[item.title]?.syllabus;
    const modules = parseSyllabus(rawSyllabus);
    let allTopics: string[] = [];
    modules.forEach(m => {
      if (m.topics && m.topics.length > 0) allTopics.push(...m.topics);
    });
    const total = allTopics.length;
    const coveredList = parseTopicsData(item.coveredTopics);
    const done = allTopics.filter(t => isTopicCovered(t, coveredList)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [item.syllabusTopics, item.title, item.coveredTopics]);

  return (
    <View style={styles.courseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleCol}>
          <Text style={styles.courseTitle}>{item.title}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'Active'
              ? styles.statusActive
              : item.status === 'Upcoming'
              ? styles.statusUpcoming
              : styles.statusCompleted,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              item.status === 'Active'
                ? styles.statusActiveText
                : item.status === 'Upcoming'
                ? styles.statusUpcomingText
                : styles.statusCompletedText,
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={13} color="#6B7280" />
          <Text style={styles.detailVal}>{item.duration}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={13} color="#6B7280" />
          <Text style={styles.detailVal}>
            {item.studentsCount}/{item.maxCapacity} enrolled
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.detailVal}>{formattedDate}</Text>
        </View>
      </View>

      {/* Syllabus Progress Bar */}
      {syllabusMetrics.total > 0 && (
        <View style={styles.syllabusProgressBox}>
          <View style={styles.progressHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="school-outline" size={14} color="#7B2CBF" />
              <Text style={styles.progressLabel}>Syllabus Progress</Text>
            </View>
            <Text style={[styles.progressVal, { color: syllabusMetrics.pct === 100 ? '#059669' : '#7B2CBF' }]}>
              {syllabusMetrics.done} / {syllabusMetrics.total} Topics ({syllabusMetrics.pct}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${syllabusMetrics.pct}%`,
                  backgroundColor: syllabusMetrics.pct === 100 ? '#10B981' : '#7B2CBF',
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.priceRow}>
        <Text style={styles.priceVal}>{item.price}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Ionicons name="create-outline" size={14} color="#7B2CBF" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteCardBtn} onPress={() => onDelete(item.id)}>
          <Ionicons name="trash-outline" size={14} color="#EF4444" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },
  instructorName: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  statusUpcoming: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(107,114,128,0.12)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusUpcomingText: {
    color: '#D97706',
  },
  statusCompletedText: {
    color: '#4B5563',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailVal: {
    fontSize: 12,
    color: '#4B5563',
  },
  priceRow: {
    marginBottom: 12,
  },
  priceVal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(123,44,191,0.08)',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  syllabusProgressBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

CourseCardItem.displayName = 'CourseCardItem';
