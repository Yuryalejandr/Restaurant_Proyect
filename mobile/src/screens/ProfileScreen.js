import React, { useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../api/config';
import { borrarSesionLocal, guardarSesionLocal } from '../database/sqlite';
import { colors } from '../theme';

export default function ProfileScreen({ route, navigation }) {
  const { user, token } = route.params;
  const [nombre, setNombre] = useState(user.nombre || '');
  const [email, setEmail] = useState(user.email || '');
  const [fotoUri, setFotoUri] = useState(user.foto_uri || '');
  const [guardando, setGuardando] = useState(false);
  const seleccionarResultado = (resultado) => { if (!resultado.canceled) setFotoUri(resultado.assets[0].uri); };
  const abrirGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return Alert.alert('Permiso necesario', 'Permite el acceso a la galería para seleccionar una foto.');
    seleccionarResultado(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 }));
  };
  const abrirCamara = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return Alert.alert('Permiso necesario', 'Permite el uso de la cámara para tomar tu foto de perfil.');
    seleccionarResultado(await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.75 }));
  };
  const elegirFoto = () => Alert.alert('Cambiar foto de perfil', 'Elige de dónde quieres obtener la foto.', [
    { text: 'Tomar foto', onPress: abrirCamara }, { text: 'Elegir de galería', onPress: abrirGaleria }, { text: 'Cancelar', style: 'cancel' },
  ]);
  const guardar = async () => {
    if (!nombre.trim() || !email.trim()) return Alert.alert('Faltan datos', 'Completa tu nombre y correo.');
    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ nombre, email, foto_uri: fotoUri }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'No se pudo guardar el perfil.');
      await guardarSesionLocal(data, token);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.', [{ text: 'Continuar', onPress: () => navigation.reset({ index: 0, routes: [{ name: data.rol === 'admin' ? 'AdminReservas' : 'Inicio', params: { user: data, token } }] }) }]);
    } catch (error) { Alert.alert('No se pudo guardar', error.message); } finally { setGuardando(false); }
  };
  const cerrarSesion = () => Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await borrarSesionLocal(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } },
  ]);
  return <SafeAreaView style={styles.safeArea}><View style={styles.container}>
    <Pressable style={styles.avatarButton} onPress={elegirFoto} accessibilityRole="button">
      {fotoUri ? <Image source={{ uri: fotoUri }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{(nombre || 'U').charAt(0).toUpperCase()}</Text></View>}
      <View style={styles.cameraBadge}><Text style={styles.cameraText}>CAMBIAR</Text></View>
    </Pressable>
    <Text style={styles.photoHint}>Toca la foto para usar la cámara o la galería.</Text>
    <Text style={styles.title}>{user.rol === 'admin' ? 'Perfil del administrador' : 'Tu perfil'}</Text><Text style={styles.subtitle}>{user.rol === 'admin' ? "Tu identidad dentro de Z'eloura" : 'Cuenta de cliente'}</Text>
    <View style={[styles.roleCard, user.rol === 'admin' && styles.adminRoleCard]}><View><Text style={styles.roleLabel}>ROL DE LA CUENTA</Text><Text style={styles.roleValue}>{user.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}</Text></View><Text style={styles.roleName}>{nombre || 'Sin nombre'}</Text></View>
    <Text style={styles.label}>NOMBRE COMPLETO</Text><TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={colors.muted} />
    <Text style={styles.label}>CORREO ELECTRÓNICO</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nombre@correo.com" placeholderTextColor={colors.muted} />
    <Pressable style={[styles.button, guardando && styles.disabled]} disabled={guardando} onPress={guardar}><Text style={styles.buttonText}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Text></Pressable>
    <Pressable style={styles.logoutButton} onPress={cerrarSesion}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, container: { padding: 24 }, avatarButton: { alignSelf: 'flex-start', marginBottom: 8 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.caramel, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.black, fontSize: 34, fontWeight: '800' }, cameraBadge: { position: 'absolute', right: -18, bottom: -3, backgroundColor: colors.surfaceLight, borderColor: colors.caramel, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 }, cameraText: { color: colors.caramelLight, fontSize: 8, fontWeight: '800' }, photoHint: { color: colors.muted, fontSize: 11, marginBottom: 20 }, title: { color: colors.cream, fontSize: 30, fontWeight: '800' }, subtitle: { color: colors.muted, marginTop: 5, marginBottom: 14 }, roleCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 11, padding: 12, marginBottom: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, adminRoleCard: { borderColor: colors.caramel }, roleLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800' }, roleValue: { color: colors.caramelLight, fontSize: 12, fontWeight: '800', marginTop: 4 }, roleName: { color: colors.cream, fontSize: 13, fontWeight: '800', maxWidth: '48%', textAlign: 'right' }, label: { color: colors.caramelLight, fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginTop: 14, marginBottom: 8 }, input: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 11, color: colors.cream, minHeight: 52, paddingHorizontal: 14 }, button: { backgroundColor: colors.caramel, borderRadius: 12, minHeight: 53, justifyContent: 'center', alignItems: 'center', marginTop: 27 }, disabled: { opacity: 0.55 }, buttonText: { color: colors.black, fontWeight: '800', fontSize: 15 }, logoutButton: { alignItems: 'center', padding: 18, marginTop: 7 }, logoutText: { color: colors.danger, fontWeight: '800', fontSize: 14 },
});
