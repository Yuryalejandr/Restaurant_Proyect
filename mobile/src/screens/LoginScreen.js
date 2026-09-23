import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { API_URL } from '../api/config';
import { guardarSesionLocal, obtenerCredencialLocal } from '../database/sqlite';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!correo.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo.trim(), password }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert('Servidor sin actualizar', `El backend respondió HTTP ${response.status} sin datos válidos. Reinícialo desde la carpeta backend.`);
        return;
      }

      if (!response.ok) {
        Alert.alert('No pudimos ingresar', data.mensaje || data.error || 'Verifica tus credenciales.');
        return;
      }

      const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
      await guardarSesionLocal(data.user, data.token, passwordHash);
      entrar(data.user, data.token);
    } catch (error) {
      console.error(error);
      const credencial = await obtenerCredencialLocal();
      const passwordHash = credencial
        ? await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password)
        : null;
      const usuarioLocal = credencial ? JSON.parse(credencial.usuario) : null;
      const coincide = usuarioLocal
        && usuarioLocal.email.toLowerCase() === correo.trim().toLowerCase()
        && credencial.password_hash === passwordHash;

      if (coincide) {
        entrar(usuarioLocal, credencial.token);
      } else {
        Alert.alert('Sin conexión', `No se pudo conectar con el servidor en ${API_URL}. Ingresa una vez con conexión para habilitar el acceso offline.`);
      }
    } finally {
      setCargando(false);
    }
  };

  const continuarSinConexion = async () => {
    setCargando(true);
    try {
      const user = {
        id: 0,
        nombre: 'Invitado offline',
        email: 'offline@zeloura.local',
        rol: 'cliente',
        foto_uri: '',
      };
      await guardarSesionLocal(user, 'offline');
      entrar(user, 'offline');
    } finally {
      setCargando(false);
    }
  };

  const entrar = (user, token) => {
      navigation.reset({
        index: 0,
        routes: [{ name: user.rol === 'admin' ? 'AdminReservas' : 'Inicio', params: { user, token } }],
      });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' }}
        style={styles.ambientImage}
        blurRadius={5}
      />
      <View style={styles.ambientShade} />
      <View style={styles.brand}><Text style={styles.kicker}>RESTAURANTE</Text><Text style={styles.logo}>Z'eloura</Text><Text style={styles.tagline}>Cocina que se recuerda.</Text></View>
      <View style={styles.form}>
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>Ingresa para reservar tu próxima experiencia.</Text>
        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput style={styles.input} placeholder="nombre@correo.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" value={correo} onChangeText={setCorreo} />
        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput style={styles.input} placeholder="Tu contraseña" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={[styles.button, cargando && styles.buttonDisabled]} disabled={cargando} onPress={handleLogin}><Text style={styles.buttonText}>{cargando ? 'Ingresando…' : 'Ingresar'}</Text><Text style={styles.arrow}>→</Text></Pressable>
        <Pressable style={styles.offlineButton} disabled={cargando} onPress={continuarSinConexion}><Text style={styles.offlineText}>Continuar sin conexión</Text></Pressable>
      </View>
      <Pressable style={styles.linkButton} onPress={() => navigation.navigate('Register')}><Text style={styles.linkText}>¿Primera vez en Z'eloura? <Text style={styles.linkStrong}>Crea tu cuenta</Text></Text></Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  ambientImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.3 },
  ambientShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(23, 19, 15, 0.66)' },
  brand: { marginBottom: 38 },
  kicker: { color: colors.caramelLight, letterSpacing: 3, fontSize: 10, fontWeight: '800' },
  logo: { color: colors.cream, fontSize: 43, fontWeight: '800', marginTop: 4, letterSpacing: -1 },
  tagline: { color: colors.muted, fontSize: 14, marginTop: 2 },
  form: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20 },
  title: { color: colors.cream, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 25 },
  label: { color: colors.caramelLight, fontSize: 10, letterSpacing: 1.3, fontWeight: '800', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: colors.background, borderColor: colors.line, borderWidth: 1, borderRadius: 11, color: colors.cream, minHeight: 52, paddingHorizontal: 14, fontSize: 14 },
  button: { backgroundColor: colors.caramel, borderRadius: 12, minHeight: 53, paddingHorizontal: 17, marginTop: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.black, fontSize: 15, fontWeight: '800' },
  arrow: { color: colors.black, fontSize: 22, fontWeight: '800' },
  offlineButton: { alignItems: 'center', paddingTop: 18 },
  offlineText: { color: colors.caramelLight, fontSize: 13, fontWeight: '800' },
  linkButton: { alignItems: 'center', paddingTop: 24 },
  linkText: { color: colors.muted, fontSize: 13 },
  linkStrong: { color: colors.caramelLight, fontWeight: '800' },
});
