import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AgendarReservaScreen from '../screens/AgendarReservaScreen';
import MisReservasScreen from '../screens/MisReservasScreen';
import AdminReservasScreen from '../screens/AdminReservasScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.cream, border: colors.line },
};

export default function AppNavigator({ sesion }) {
  const rutaInicial = sesion ? (sesion.user.rol === 'admin' ? 'AdminReservas' : 'Inicio') : 'Login';
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName={rutaInicial} screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.cream, headerTitleStyle: { fontWeight: '800' }, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Z'eloura" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Inicio" component={HomeScreen} initialParams={sesion || undefined} options={{ headerShown: false }} />
        <Stack.Screen name="AgendarReserva" component={AgendarReservaScreen} options={{ title: 'Reservar mesa' }} />
        <Stack.Screen name="MisReservas" component={MisReservasScreen} options={{ title: 'Mis reservas' }} />
        <Stack.Screen name="AdminReservas" component={AdminReservasScreen} initialParams={sesion || undefined} options={{ title: 'Administración' }} />
        <Stack.Screen name="Perfil" component={ProfileScreen} initialParams={sesion || undefined} options={{ title: 'Mi perfil' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
