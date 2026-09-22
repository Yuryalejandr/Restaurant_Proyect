import NetInfo from '@react-native-community/netinfo';
import { obtenerReservasPendientesSync, marcarComoSincronizados } from '../database/sqlite';
import { API_URL } from './config';

export const sincronizarConBackend = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return false;

  const pendientes = await obtenerReservasPendientesSync();
  if (pendientes.length === 0) return true;

  try {
    const response = await fetch(`${API_URL}/reservas/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservas: pendientes }),
    });
    if (!response.ok) return false;
    await marcarComoSincronizados();
    return true;
  } catch (error) {
    console.error('Error al sincronizar con el backend:', error);
    return false;
  }
};
