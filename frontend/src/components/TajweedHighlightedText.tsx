import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';

interface TajweedHighlightedTextProps {
  text: string;
  fontSize?: number;
  showLabels?: boolean;
  defaultColor?: string;
}

interface TajweedSpan {
  text: string;
  color: string | null;
  rule: string;
}

const TAJWEED_COLORS = {
  ghunnah: '#E53935',
  madd: '#1E88E5',
  idgham: '#43A047',
  ikhfa: '#FB8C00',
  iqlab: '#8E24AA',
  idhar: '#D4A84B',
  qalqalah: '#00ACC1',
};

const IDGHAM_LETTERS = ['ي', 'و', 'م', 'ن', 'ل', 'ر'];
const IDHAR_LETTERS = ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const QALQALAH_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
const IDGHAM_WITH_GHUNNAH = ['ي', 'و', 'م', 'ن'];

const RULE_PRIORITY: Record<string, number> = {
  'Ghunnah': 1,
  'Idgham Shafawi': 1,
  'Madd': 2,
  'Qalqalah': 3,
  'Idgham bi Ghunnah': 4,
  'Idgham bila Ghunnah': 4,
  'Iqlab': 5,
  'Ikhfa Shafawi': 5,
  'Ikhfa': 6,
  'Idhar Shafawi': 7,
  'Idhar': 7,
};

function isDiacritic(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x064B && c <= 0x065F)
    || c === 0x0670
    || (c >= 0x06DF && c <= 0x06E6)
    || c === 0x06ED;
}

function tokenize(text: string): Array<{ char: string; diacs: string[] }> {
  const chars = [...text];
  const tokens: Array<{ char: string; diacs: string[] }> = [];
  let i = 0;
  while (i < chars.length) {
    if (!chars[i] || isDiacritic(chars[i])) { i++; continue; }
    const char = chars[i];
    const diacs: string[] = [];
    i++;
    while (i < chars.length && isDiacritic(chars[i])) {
      diacs.push(chars[i]);
      i++;
    }
    tokens.push({ char, diacs });
  }
  return tokens;
}

function nextRealToken(tokens: Array<{ char: string; diacs: string[] }>, i: number): { char: string; diacs: string[] } | null {
  let j = i + 1;
  while (j < tokens.length && tokens[j].char === ' ') { j++; }
  return j < tokens.length ? tokens[j] : null;
}

function groupByWord(spans: TajweedSpan[]): TajweedSpan[] {
  const result: TajweedSpan[] = [];
  let i = 0;
  while (i < spans.length) {
    if (spans[i].text === ' ' || spans[i].text === '') {
      result.push({ text: spans[i].text, color: null, rule: '' });
      i++;
      continue;
    }
    const wordParts: TajweedSpan[] = [];
    while (i < spans.length && spans[i].text !== ' ') {
      wordParts.push(spans[i]);
      i++;
    }
    const colored = wordParts.filter(p => p.color !== null);
    if (colored.length === 0) {
      result.push({ text: wordParts.map(p => p.text).join(''), color: null, rule: '' });
    } else {
      let best = colored[0];
      let bestPriority = RULE_PRIORITY[best.rule] ?? 999;
      for (let j = 1; j < colored.length; j++) {
        const pri = RULE_PRIORITY[colored[j].rule] ?? 999;
        if (pri < bestPriority) {
          bestPriority = pri;
          best = colored[j];
        }
      }
      result.push({ text: wordParts.map(p => p.text).join(''), color: best.color, rule: best.rule });
    }
  }
  return result;
}

function scanTajweed(text: string): TajweedSpan[] {
  const tokens = tokenize(text);
  const result: TajweedSpan[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const hasShaddah = t.diacs.includes('\u0651');
    const hasSukun = t.diacs.includes('\u0652');
    const hasFathatan = t.diacs.includes('\u064B');
    const hasDammatan = t.diacs.includes('\u064C');
    const hasKasratan = t.diacs.includes('\u064D');
    const hasTanween = hasFathatan || hasDammatan || hasKasratan;
    const hasDaggerAlif = t.diacs.includes('\u0670');
    const hasMaddSign = t.diacs.includes('\u0653');
    let color: string | null = null;
    let rule = '';

    if ((t.char === 'ن' || t.char === 'م') && hasShaddah) {
      color = TAJWEED_COLORS.ghunnah;
      rule = 'Ghunnah';
    } else if (QALQALAH_LETTERS.includes(t.char) && hasSukun) {
      color = TAJWEED_COLORS.qalqalah;
      rule = 'Qalqalah';
    } else if (hasDaggerAlif) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if ((t.char === 'ا' || t.char === 'آ') && (hasMaddSign || (i > 0 && tokens[i - 1].diacs.includes('\u064E')))) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if (t.char === 'و' && i > 0 && tokens[i - 1].diacs.includes('\u064F')) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if (t.char === 'ي' && i > 0 && tokens[i - 1].diacs.includes('\u0650')) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if (t.char === 'م' && hasSukun) {
      const nxt = nextRealToken(tokens, i);
      if (nxt) {
        const next = nxt.char;
        if (next === 'م') {
          color = TAJWEED_COLORS.ghunnah;
          rule = 'Idgham Shafawi';
        } else if (next === 'ب') {
          color = TAJWEED_COLORS.ikhfa;
          rule = 'Ikhfa Shafawi';
        } else if (next === 'و' || next === 'ف') {
          color = TAJWEED_COLORS.idhar;
          rule = 'Idhar Shafawi';
        }
      }
    } else if ((t.char === 'ن' && hasSukun) || hasTanween) {
      const nxt = nextRealToken(tokens, i);
      if (nxt) {
        const next = nxt.char;
        if (IDGHAM_LETTERS.includes(next)) {
          if (IDGHAM_WITH_GHUNNAH.includes(next)) {
            color = TAJWEED_COLORS.idgham;
            rule = 'Idgham bi Ghunnah';
          } else {
            color = TAJWEED_COLORS.idgham;
            rule = 'Idgham bila Ghunnah';
          }
        } else if (next === 'ب') {
          color = TAJWEED_COLORS.iqlab;
          rule = 'Iqlab';
        } else if (IDHAR_LETTERS.includes(next)) {
          color = TAJWEED_COLORS.idhar;
          rule = 'Idhar';
        } else if (IKHFA_LETTERS.includes(next)) {
          color = TAJWEED_COLORS.ikhfa;
          rule = 'Ikhfa';
        }
      }
    }

    result.push({ text: t.char + t.diacs.join(''), color, rule });
    i++;
  }
  return result;
}

export default function TajweedHighlightedText({
  text, fontSize = 24, showLabels = false, defaultColor = '#1C1C1E',
}: TajweedHighlightedTextProps) {
  const spans = useMemo(() => groupByWord(scanTajweed(text)), [text]);
  const [labelText, setLabelText] = useState<string | null>(null);
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0 });

  const handleLongPress = (rule: string, event: any) => {
    if (!showLabels || !rule) return;
    const { pageX, pageY } = event.nativeEvent;
    setLabelText(rule);
    setLabelPos({ x: pageX, y: pageY });
  };

  const dismissLabel = () => setLabelText(null);

  const children: React.ReactNode[] = [];
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (!span.color) {
      children.push(span.text);
    } else {
      children.push(
        <Text key={i} style={{ color: span.color, fontSize }}>{span.text}</Text>
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize, color: defaultColor }]}>
        {children}
      </Text>
      {labelText && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismissLabel}
        >
          <View
            style={[
              styles.tooltip,
              { left: Math.min(labelPos.x, 200), top: Math.max(labelPos.y - 50, 10) },
            ]}
          >
            <Text style={styles.tooltipText}>{labelText}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  text: {
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 52,
    fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 999,
  },
  tooltipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
