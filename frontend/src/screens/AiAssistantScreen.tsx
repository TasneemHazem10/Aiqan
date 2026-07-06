import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StatusBar, KeyboardAvoidingView, Modal,
  Platform, Alert, Keyboard, ScrollView, TouchableOpacity, Animated, StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getData, storeData, KEYS } from '../utils/storage';
import { callGemini, callOpenRouter, callBackendAPI, getLocalResponse } from '../services/aiBackend';
import { GEMINI_API_KEY, IS_AI_CONFIGURED } from '../constants/config';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS, ANIMATION } from '../constants/theme';
import { FadeIn, SlideUp, ScaleIn, AnimatedPressable, StaggeredView } from '../components/AnimatedComponents';


const STORAGE_API_KEY = 'aiqan_ai_api_key';
const STORAGE_AI_PROVIDER = 'aiqan_ai_provider';
const STORAGE_AI_ENABLED = 'aiqan_ai_enabled';

type AIProvider = 'gemini' | 'openrouter' | '';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const SUGGESTIONS: Record<string, string[]> = {
  en: [
    'What is the Quran?',
    'How to be patient?',
    'Tell me about the prophets',
    'Dua for stress',
    'What is tawheed?',
    'Tips for memorizing Quran',
    'How to pray tahajjud?',
    'Story of Prophet Musa',
  ],
  ar: [
    'ما هو القرآن؟',
    'كيف أصبر؟',
    'حدثني عن الأنبياء',
    'دعاء للتوتر',
    'ما هو التوحيد؟',
    'نصائح لحفظ القرآن',
    'كيف أصلي التهجد؟',
    'قصة موسى عليه السلام',
  ],
};

const GREETING: Record<string, { title: string; subtitle: string }> = {
  en: {
    title: 'Ask me anything',
    subtitle: 'I\'m Aiqan AI — your intelligent assistant. I can answer questions about Islam, science, history, technology, give advice, or just chat. What\'s on your mind?',
  },
  ar: {
    title: 'اسألني عن أي شيء',
    subtitle: 'أنا إيقان AI — مساعدك الذكي. يمكنني الإجابة عن أسئلة الإسلام، العلوم، التاريخ، التكنولوجيا، تقديم النصائح، أو مجرد الدردشة. ما الذي يدور في بالك؟',
  },
};

function BouncingDots({ color }: { color: string }) {
  const opacities = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  const translates = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = opacities.map((op, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(translates[i], { toValue: -6, duration: 300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(op, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            Animated.timing(translates[i], { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.reset());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 4 }}>
      {[0, 1, 2].map(i => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5, backgroundColor: color,
            opacity: opacities[i],
            transform: [{ translateY: translates[i] }],
          }}
        />
      ))}
    </View>
  );
}

export default function AiAssistantScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { language, theme } = useApp();
  const isRtl = language === 'ar';
  const isDark = theme === 'dark' || theme === 'amoled';
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsKey, setSettingsKey] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    Animated.timing(inputFocusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION.normal,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    header: { paddingTop: SPACING.lg, paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { alignItems: 'flex-start' },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.display, color: COLORS.textOnDark, letterSpacing: 0.3 },
    aiToggleBtn: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 2,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'flex-end' },
    iconBtn: { width: 36, height: 36, borderRadius: RADIUS.circle, alignItems: 'center', justifyContent: 'center' },
    chatArea: { flex: 1 },
    chatContent: { paddingTop: SPACING.md, paddingHorizontal: SPACING.md },
    welcome: { alignItems: 'center', paddingTop: SPACING.huge, paddingHorizontal: SPACING.lg },
    welcomeGlow: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
    welcomeTitle: { fontSize: FONT_SIZES.display, fontFamily: FONTS.display, textAlign: 'center', marginBottom: SPACING.sm, letterSpacing: -0.3 },
    welcomeSub: { fontSize: FONT_SIZES.body, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
    setupBanner: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: SPACING.xxl,
    },
    setupBannerText: { fontSize: FONT_SIZES.caption, fontWeight: '600', flex: 1 },
    suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xs },
    suggestionChip: { borderRadius: RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderWidth: 1 },
    suggestionText: { fontSize: FONT_SIZES.caption, fontWeight: '500' },
    msgRow: { alignItems: 'flex-end', marginBottom: SPACING.md },
    msgRowAssistant: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.md },
    msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm, marginBottom: 2 },
    msgUser: { borderRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xs, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, maxWidth: screenWidth * 0.78 },
    msgUserText: { fontSize: FONT_SIZES.body, fontWeight: '500' },
    msgAssistantCard: { borderRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xs, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, maxWidth: screenWidth * 0.82, flex: 1 },
    msgLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: SPACING.sm },
    msgLabelText: { fontSize: FONT_SIZES.micro, fontWeight: '700', letterSpacing: 0.5 },
    msgAssistantText: { fontSize: FONT_SIZES.body, lineHeight: 22 },
    inputBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md },
    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end', borderRadius: RADIUS.xxl,
      borderWidth: 1, paddingLeft: SPACING.lg, paddingRight: 4, paddingVertical: 4,
    },
    textInput: { flex: 1, fontSize: FONT_SIZES.body, maxHeight: 100, paddingVertical: SPACING.sm },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.xl },
    modalIconRow: { alignItems: 'center', marginBottom: SPACING.md },
    modalIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.xs },
    modalSub: { fontSize: FONT_SIZES.small, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    modalLabel: { fontSize: FONT_SIZES.caption, fontWeight: '600', marginBottom: SPACING.xs },
    modalInput: { borderRadius: RADIUS.md, padding: SPACING.base, fontSize: FONT_SIZES.body, borderWidth: 1, marginBottom: SPACING.md },
    removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, alignSelf: 'flex-start' },
    removeBtnText: { fontSize: FONT_SIZES.caption, color: '#EF4444', fontWeight: '500' },
    modalHint: { fontSize: FONT_SIZES.micro, lineHeight: 16, marginBottom: SPACING.xl },
    modalActions: { flexDirection: 'row', gap: SPACING.md },
    modalBtn: { flex: 1, paddingVertical: SPACING.base, borderRadius: RADIUS.md, alignItems: 'center' },
    modalBtnText: { fontSize: FONT_SIZES.body, fontWeight: '600' },
    aiToggleLabel: {
      fontSize: FONT_SIZES.micro, fontWeight: '700',
      letterSpacing: 0.5,
    },
    spacing: { height: SPACING.lg },
  });

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const loadAll = async () => {
    const [history, key, provider, enabled] = await Promise.all([
      getData<ChatMessage[]>(KEYS.NOTES, []),
      getData<string>(STORAGE_API_KEY, ''),
      getData<AIProvider>(STORAGE_AI_PROVIDER, ''),
      getData<boolean>(STORAGE_AI_ENABLED, true),
    ]);
    if (history?.length) setMessages(history.slice(-30));
    if (key) setApiKey(key);
    if (provider) setAiProvider(provider);
    setAiEnabled(enabled ?? true);
  };

  const activeApiKey = apiKey || (IS_AI_CONFIGURED ? GEMINI_API_KEY : '');

  const saveHistory = async (msgs: ChatMessage[]) => {
    await storeData(KEYS.NOTES, msgs.slice(-50));
  };

  const handleSaveSettings = async () => {
    const key = settingsKey.trim();
    if (key.startsWith('AIza')) {
      setAiProvider('gemini');
      await storeData(STORAGE_AI_PROVIDER, 'gemini');
    } else if (key.startsWith('sk-or-')) {
      setAiProvider('openrouter');
      await storeData(STORAGE_AI_PROVIDER, 'openrouter');
    } else if (key) {
      setAiProvider('gemini');
      await storeData(STORAGE_AI_PROVIDER, 'gemini');
    }
    await storeData(STORAGE_API_KEY, key);
    setApiKey(key);
    setShowSettings(false);
    setSettingsKey('');
  };

  const handleRemoveKey = () => {
    Alert.alert(
      isRtl ? 'إزالة المفتاح' : 'Remove API Key',
      isRtl ? 'سيستخدم التطبيق الإجابات المحلية. هل أنت متأكد؟' : 'The app will use local responses only. Are you sure?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRtl ? 'إزالة' : 'Remove', style: 'destructive',
          onPress: async () => {
            await Promise.all([
              storeData(STORAGE_API_KEY, ''),
              storeData(STORAGE_AI_PROVIDER, ''),
            ]);
            setApiKey('');
            setAiProvider('');
          },
        },
      ]
    );
  };

  const toggleAi = async () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    await storeData(STORAGE_AI_ENABLED, next);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText('');
    setShowSuggestions(false);
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user', text, timestamp: Date.now(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    await getReply(updated);
  };

  const getReply = async (currentMessages: ChatMessage[]) => {
    setLoading(true);
    let reply = '';
    const key = activeApiKey;
    const msgsForApi = currentMessages.map(m => ({ role: m.role, content: m.text }));
    try {
      if (!aiEnabled) {
        reply = await getLocalResponse(msgsForApi);
      } else {
        const backendReply = await callBackendAPI(msgsForApi, language);
        if (backendReply) {
          reply = backendReply;
        } else if (key && aiProvider === 'gemini') {
          reply = (await callGemini(key, msgsForApi, language)) || await getLocalResponse(msgsForApi);
        } else if (key && aiProvider === 'openrouter') {
          reply = (await callOpenRouter(key, msgsForApi)) || await getLocalResponse(msgsForApi);
        } else if (key) {
          reply = (await callGemini(key, msgsForApi, language)) || await getLocalResponse(msgsForApi);
        } else {
          reply = await getLocalResponse(msgsForApi);
        }
      }
    } catch {
      reply = await getLocalResponse(msgsForApi);
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(), role: 'assistant', text: reply, timestamp: Date.now(),
    };
    const final = [...currentMessages, assistantMsg];
    setMessages(final);
    await saveHistory(final);
    setLoading(false);
  };

  const borderAnim = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.gold + '60'],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? COLORS.darkBg : COLORS.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={isDark ? ['#0F0F12', '#151518'] : ['#1A1A2E', '#16213E']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <AnimatedPressable onPress={() => navigation.goBack()} scaleTo={0.9}>
                <View style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </View>
              </AnimatedPressable>
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Aiqan AI</Text>
            </View>

            <View style={styles.headerRight}>
              <AnimatedPressable onPress={toggleAi} scaleTo={0.9}>
                <View style={[styles.aiToggleBtn, { backgroundColor: aiEnabled ? 'rgba(212,162,70,0.20)' : 'rgba(255,255,255,0.08)' }]}>
                  <Ionicons
                    name={aiEnabled ? 'sparkles' : 'sparkles-outline'}
                    size={16}
                    color={aiEnabled ? COLORS.gold : '#FFFFFF88'}
                  />
                </View>
              </AnimatedPressable>
              <AnimatedPressable onPress={() => setShowSettings(true)} scaleTo={0.9}>
                <View style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Ionicons name="settings-outline" size={19} color="#FFFFFFDD" />
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => { setMessages([]); setShowSuggestions(true); storeData(KEYS.NOTES, []); }}
                scaleTo={0.9}
              >
                <View style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFFDD" />
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <FadeIn delay={150}>
              <LinearGradient
                colors={isDark ? ['rgba(212,162,70,0.18)', 'rgba(212,162,70,0.04)'] : ['rgba(212,162,70,0.12)', 'rgba(212,162,70,0.03)']}
                style={styles.welcomeGlow}
              >
                <Ionicons name="sparkles" size={38} color={COLORS.gold} />
              </LinearGradient>
            </FadeIn>

            <SlideUp delay={250}>
              <Text style={[styles.welcomeTitle, { color: isDark ? COLORS.darkTextPrimary : COLORS.textPrimary }]}>
                {GREETING[language]?.title || GREETING.en.title}
              </Text>
            </SlideUp>

            <SlideUp delay={350}>
              <Text style={[styles.welcomeSub, { color: COLORS.textSecondary }]}>
                {GREETING[language]?.subtitle || GREETING.en.subtitle}
              </Text>
            </SlideUp>

            {!apiKey && !IS_AI_CONFIGURED && (
              <SlideUp delay={400}>
                <TouchableOpacity
                  onPress={() => setShowSettings(true)}
                  style={[styles.setupBanner, { borderColor: COLORS.gold, backgroundColor: COLORS.goldPale }, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key" size={14} color={COLORS.gold} />
                  <Text style={[styles.setupBannerText, { color: COLORS.gold }]}>
                    {isRtl ? 'أضف مفتاح Gemini API لإجابات أفضل' : 'Add a Gemini API key for better answers'}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.gold} />
                </TouchableOpacity>
              </SlideUp>
            )}

            {showSuggestions && (
              <View style={styles.suggestionsGrid}>
                <StaggeredView baseDelay={450} staggerBy={60}>
                  {(SUGGESTIONS[language] || SUGGESTIONS.en).map((text, i) => (
                    <AnimatedPressable key={i} onPress={() => setInputText(text)} scaleTo={0.95}>
                      <View style={[styles.suggestionChip, {
                        backgroundColor: isDark ? COLORS.darkCard : COLORS.card,
                        borderColor: COLORS.border,
                      }, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }]}>
                        <Text style={[styles.suggestionText, { color: COLORS.textSecondary }]}>{text}</Text>
                      </View>
                    </AnimatedPressable>
                  ))}
                </StaggeredView>
              </View>
            )}
          </View>
        ) : (
          messages.map((msg) =>
            msg.role === 'user' ? (
              <SlideUp key={msg.id} delay={0} duration={250}>
                <View style={styles.msgRow}>
                  <ScaleIn delay={0}>
                    <View style={[styles.msgUser, { backgroundColor: COLORS.gold }, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }]}>
                      <Text style={[styles.msgUserText, { color: COLORS.textInverse }]}>{msg.text}</Text>
                    </View>
                  </ScaleIn>
                </View>
              </SlideUp>
            ) : (
              <SlideUp key={msg.id} delay={50} duration={300}>
                <View style={styles.msgRowAssistant}>
                  <LinearGradient
                    colors={isDark ? ['#D4A24630', '#D4A24610'] : ['#D4A24620', '#D4A24605']}
                    style={styles.msgAvatar}
                  >
                    <Ionicons name="sparkles" size={14} color={COLORS.gold} />
                  </LinearGradient>
                  <View style={[styles.msgAssistantCard, {
                    backgroundColor: isDark ? COLORS.darkCard : COLORS.card,
                  }, { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }]}>
                    <View style={styles.msgLabel}>
                      <Text style={[styles.msgLabelText, { color: COLORS.gold }]}>Aiqan AI</Text>
                    </View>
                    <Text style={[styles.msgAssistantText, { color: isDark ? COLORS.darkTextPrimary : COLORS.textPrimary }]}>{msg.text}</Text>
                  </View>
                </View>
              </SlideUp>
            )
          )
        )}

        {loading && (
          <SlideUp delay={0} duration={200}>
            <View style={styles.msgRowAssistant}>
              <LinearGradient
                colors={isDark ? ['#D4A24630', '#D4A24610'] : ['#D4A24620', '#D4A24605']}
                style={styles.msgAvatar}
              >
                <Ionicons name="sparkles" size={14} color={COLORS.gold} />
              </LinearGradient>
              <View style={[styles.msgAssistantCard, {
                backgroundColor: isDark ? COLORS.darkCard : COLORS.card,
              }, { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }]}>
                <View style={styles.msgLabel}>
                  <Text style={[styles.msgLabelText, { color: COLORS.gold }]}>Aiqan AI</Text>
                </View>
                <BouncingDots color={COLORS.gold} />
              </View>
            </View>
          </SlideUp>
        )}

        <View style={styles.spacing} />
      </ScrollView>

      <View style={[styles.inputBar, {
        backgroundColor: isDark ? COLORS.darkBg : COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border + '60',
      }]}>
        <Animated.View style={[styles.inputRow, {
          backgroundColor: isDark ? 'rgba(28,28,31,0.85)' : 'rgba(255,255,255,0.85)',
          borderColor: borderAnim,
        }, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: isDark ? COLORS.darkTextPrimary : COLORS.textPrimary }, isRtl && { textAlign: 'right' }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isRtl ? 'اكتب رسالتك...' : 'Message'}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!loading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <AnimatedPressable
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            scaleTo={0.88}
          >
            <LinearGradient
              colors={inputText.trim() && !loading ? ['#D4A246', '#B8892E'] : [COLORS.glassDark, COLORS.glassDark]}
              style={styles.sendBtn}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() && !loading ? '#1C1C1E' : COLORS.textMuted}
              />
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>
      </View>

      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <ScaleIn>
            <View style={[styles.modalContent, { backgroundColor: isDark ? COLORS.darkCard : COLORS.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: COLORS.textMuted + '40' }]} />

              <View style={styles.modalIconRow}>
                <LinearGradient
                  colors={isDark ? ['#D4A24630', '#D4A24610'] : ['#D4A24620', '#D4A24605']}
                  style={styles.modalIconWrap}
                >
                  <Ionicons name="sparkles" size={24} color={COLORS.gold} />
                </LinearGradient>
              </View>

              <Text style={[styles.modalTitle, { color: isDark ? COLORS.darkTextPrimary : COLORS.textPrimary }]}>
                {isRtl ? 'إعدادات AI' : 'AI Settings'}
              </Text>

              <Text style={[styles.modalSub, { color: COLORS.textSecondary }]}>
                {isRtl
                  ? 'أضف مفتاح API مجاني للحصول على إجابات ذكية من Google Gemini.'
                  : 'Add a free API key for unlimited intelligent responses from Google Gemini.'}
              </Text>

              {IS_AI_CONFIGURED && !apiKey && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: 'rgba(212,162,70,0.12)', borderWidth: 1, borderColor: 'rgba(212,162,70,0.25)' }}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
                  <Text style={{ fontSize: FONT_SIZES.caption, color: COLORS.gold, flex: 1 }}>
                    {isRtl ? 'المفتاح المدمج نشط — يمكنك إضافة مفتاحك الخاص لرفع الحدود' : 'Built-in key active — add your own for higher limits'}
                  </Text>
                </View>
              )}

              {!IS_AI_CONFIGURED && !apiKey && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,100,100,0.08)', borderWidth: 1, borderColor: 'rgba(255,100,100,0.2)' }}>
                  <Ionicons name="information-circle" size={16} color="#FF6666" />
                  <Text style={{ fontSize: FONT_SIZES.caption, color: '#FF6666', flex: 1 }}>
                    {isRtl ? 'لا يوجد مفتاح — يتم استخدام الإجابات المحلية' : 'No key set — using local responses'}
                  </Text>
                </View>
              )}

              <Text style={[styles.modalLabel, { color: COLORS.textSecondary }]}>
                {isRtl ? 'مفتاح API (اختياري)' : 'API Key (optional)'}
              </Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: isDark ? COLORS.darkBg : '#F0F2F5',
                  color: isDark ? COLORS.darkTextPrimary : COLORS.textPrimary,
                  borderColor: COLORS.border,
                }]}
                value={settingsKey || apiKey}
                onChangeText={setSettingsKey}
                placeholder="AIza..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {apiKey ? (
                <TouchableOpacity onPress={handleRemoveKey} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text style={styles.removeBtnText}>
                    {isRtl ? 'إزالة المفتاح' : 'Remove key'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <Text style={[styles.modalHint, { color: COLORS.textMuted }]}>
                {isRtl
                  ? 'احصل على مفتاح مجاني من ai.google.dev — أو استخدم المفتاح المدمج المسبق'
                  : 'Get a free key at ai.google.dev — or use the pre-configured built-in key'}
              </Text>

              <View style={styles.modalActions}>
                <AnimatedPressable onPress={() => setShowSettings(false)} scaleTo={0.96}>
                  <View style={[styles.modalBtn, { backgroundColor: COLORS.glassDark }]}>
                    <Text style={[styles.modalBtnText, { color: COLORS.textSecondary }]}>
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </Text>
                  </View>
                </AnimatedPressable>
                <AnimatedPressable onPress={handleSaveSettings} scaleTo={0.96}>
                  <LinearGradient colors={['#D4A246', '#B8892E']} style={styles.modalBtn}>
                    <Text style={[styles.modalBtnText, { color: '#1C1C1E' }]}>
                      {isRtl ? 'حفظ' : 'Save'}
                    </Text>
                  </LinearGradient>
                </AnimatedPressable>
              </View>
            </View>
          </ScaleIn>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
