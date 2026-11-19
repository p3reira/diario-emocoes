// Endereço da API do app. Vem do arquivo app/.env (que vai no ZIP, não no GitHub).
// O Expo só repassa ao app variáveis que começam com EXPO_PUBLIC_.
//
// No celular, "localhost" é o próprio celular: use o IP do computador na rede,
// por exemplo http://192.168.0.10:3000 (veja o README).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
