import { StyleSheet,Text,View,ActivityIndicator,Pressable,FlatList,useWindowDimensions,} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MATCHES_URL } from '../config';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { Filter, Match, MatchStatus } from '../types';

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Запланирован',
  live: 'Идёт',
  finished: 'Завершён',
  postponed: 'Перенесён',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'finished', label: 'Завершённые' },
];

function formatStartDate(startsAt: string | null): string {
  return new Date(startsAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Экран «Матчи тура» — задание в README.md, часть 1.
export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); 
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  // переменные для адаптивной верстки
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const numColumns = width >= 1100 ? 3 : isWide ? 2 : 1;

  // ф-я загрузки данных о матчах
  const loadMatchesData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(MATCHES_URL);
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
      setUpdatedAt(new Date()); 
    } catch (e) {
      console.error('ошибка загрузки матчей:', e);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить матчи');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMatchesData();
  }, [loadMatchesData]);

  // фильтры
  const visibleMatches = useMemo(() => {
    if (filter === 'finished') return matches.filter((m) => m.status === 'finished');
    if (filter === 'upcoming') return matches.filter((m) => m.status !== 'finished');
    return matches;
  }, [matches, filter]);

  if (loading)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Загрузка матчей…</Text>
      </View>
    );

  if (error && matches.length === 0)
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorTitle}>Не удалось загрузить матчи</Text>
        <Text style={styles.hint}>{error}</Text>
        <Pressable style={styles.button} onPress={() => loadMatchesData()}>
          <Text style={styles.buttonText}>Повторить</Text>
        </Pressable>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Матчи тура</Text>
        <View style={styles.headerRight}>
          {updatedAt && <UpdatedAgo since={updatedAt} />}
          <Pressable onPress={() => loadMatchesData(true)} disabled={refreshing}>
            <Text style={styles.refreshLink}>{refreshing ? 'Обновляем…' : 'Обновить'}</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.errorBanner}>Не удалось обновить: {error}</Text>}

      <View style={[styles.layout, isWide && styles.layoutWide]}>
        <View style={[styles.sidebar, isWide && styles.sidebarWide]}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            >
              <Text style={filter === f.key ? styles.filterTextActive : styles.filterText}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          key={numColumns}
          style={styles.list}
          data={visibleMatches}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          keyExtractor={(m) => m.id}
          refreshing={refreshing}
          onRefresh={() => loadMatchesData(true)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {matches.length === 0 ? 'Матчей нет' : 'В этой категории матчей нет'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { maxWidth: `${100 / numColumns}%` }]}>
              <View style={styles.teamRow}>
                <Text style={styles.team} numberOfLines={2}>
                  {item.home.name}
                </Text>
                <Text style={styles.score}>{item.score !== null ? item.score.home : ''}</Text>
              </View>
              <View style={styles.teamRow}>
                <Text style={styles.team} numberOfLines={2}>
                  {item.away.name}
                </Text>
                <Text style={styles.score}>{item.score !== null ? item.score.away : ''}</Text>
              </View>
              <Text style={styles.meta}>{formatStartDate(item.startsAt)}</Text>
              <Text style={styles.status}>
                {STATUS_LABELS[item.status] ?? item.status}
                {item.status === 'live' && item.minute != null ? ` ${item.minute} минут` : ''}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  title: { fontSize: 24, fontWeight: '700' },
  refreshLink: { color: '#7099f1', fontWeight: '600' },
  errorBanner: { color: '#b00020', marginBottom: 8 },
  hint: { marginTop: 8, color: '#666', textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  button: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7099f1',
  },
  buttonText: { color: '#fff', fontWeight: '600' },

  // расположение
  layout: { flex: 1, flexDirection: 'column' },
  layoutWide: { flexDirection: 'row', gap: 16 },
  sidebar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sidebarWide: { flexDirection: 'column', flexWrap: 'nowrap', width: '30%', marginBottom: 0 },
  list: { flex: 1 },

  // фильтры
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterBtnActive: { backgroundColor: '#7099f1', borderColor: '#7099f1' },
  filterText: { color: '#333', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },

  // карточки
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  columnWrapper: { gap: 10 },
  card: {
    flex: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  team: { flex: 1, fontSize: 15, fontWeight: '600', marginRight: 8 },
  score: { fontSize: 18, fontWeight: '700' },
  meta: { marginTop: 6, color: '#666', fontSize: 13 },
  status: { marginTop: 2, color: '#7099f1', fontSize: 13, fontWeight: '600' },
});