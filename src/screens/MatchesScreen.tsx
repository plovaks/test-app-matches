import { StyleSheet, Text, View, ActivityIndicator,Pressable,FlatList } from 'react-native';
import {useState, useEffect, useCallback} from "react"
import { MATCHES_URL } from '../config';
import { Match, MatchStatus,Filter } from '../types';

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Запланирован',
  live: 'Идёт',
  finished: 'Завершён',
  postponed: 'Перенесён',
};

function formatStartDate(startsAt:string | null):string{
  return new Date(startsAt).toLocaleString('ru-RU', {
    day:'numeric',
    month:'long',
    hour:'2-digit',
    minute:'2-digit'
  })
}

// Экран «Матчи тура» — задание в README.md, часть 1.
export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ф-я загрузки данных о матчах
  const loadMatchesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(MATCHES_URL);
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
      const data = await res.json();
      setMatches(data.matches);
    } catch (e) {
      setError(e);
      console.error('ошибка загрузки матчей: ', e.status)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatchesData();
  }, [loadMatchesData]);

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" />
      <Text style={styles.hint}>Зашрузка матчей</Text>
    </View>
  )

  if (error) return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.errorTitle}>Не получилось загрузить матчи</Text>
      <Text style={styles.hint}>{error}</Text>
      <Pressable style={styles.button} onPress={load}>
        <Text style={styles.buttonText}>Повторить</Text>
      </Pressable>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text style={styles.empty}>Матчей нет</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.team, styles.teamLeft]}>{item.home.name}</Text>
              <Text style={styles.score}>
                {item.score !== null ? `${item.score.home} : ${item.score.away}` : '–'}
              </Text>
              <Text style={[styles.team, styles.teamRight]}>{item.away.name}</Text>
            </View>
            <Text style={styles.meta}>
              {formatStartDate(item.startsAt)} · {STATUS_LABELS[item.status]}
              {item.status === 'live' && item.minute != null ? ` ${item.minute} минут` : ''}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
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
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  card: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, fontSize: 16, fontWeight: '600' },
  teamLeft: { textAlign: 'left' },
  teamRight: { textAlign: 'right' },
  score: { width: 70, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  meta: { marginTop: 8, color: '#666', fontSize: 13 },
});