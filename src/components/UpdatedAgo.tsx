import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  // Момент последней успешной загрузки данных.
  since: Date;
};

// Подпись «Обновлено N сек назад».
export function UpdatedAgo({ since }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // ф-я расчет аразницы в сек
    const calculateSeconds = () => {
      const diffInMs = Date.now() - since.getTime();
      setSeconds(Math.max(0, Math.floor(diffInMs / 1000)));
    };
    calculateSeconds();

    const id = setInterval(() => {
      calculateSeconds();
    }, 1000);
    return () => clearInterval(id); 
  }, [since.getTime()]);

  return <Text style={styles.text}>Обновлено {seconds} сек назад</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: '#6b7280',
  },
});
