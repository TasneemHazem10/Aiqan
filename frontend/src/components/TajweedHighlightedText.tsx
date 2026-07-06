import React, { useState, useRef, useMemo } from 'react';
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
  ghunnah: '#FF4444',
  madd: '#4488FF',
  idgham: '#44CC88',
  ikhfa: '#FF8844',
  iqlab: '#AA66CC',
  idhar: '#E8D5A3',
};

const IDGHAM_LETTERS = ['ي', 'و', 'م', 'ن', 'ل', 'ر'];
const IDHAR_LETTERS = ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];

function isDiacritic(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x064B && c <= 0x0658) || c === 0x0670;
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

function scanTajweed(text: string): TajweedSpan[] {
  const tokens = tokenize(text);
  const result: TajweedSpan[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const hasShaddah = t.diacs.includes('\u0651');
    const hasSukun = t.diacs.includes('\u0652');
    const hasFatha = t.diacs.includes('\u064E');
    const hasDamma = t.diacs.includes('\u064F');
    const hasKasra = t.diacs.includes('\u0650');
    const hasFathatan = t.diacs.includes('\u064B');
    const hasDammatan = t.diacs.includes('\u064C');
    const hasKasratan = t.diacs.includes('\u064D');
    const hasTanween = hasFathatan || hasDammatan || hasKasratan;
    let color: string | null = null;
    let rule = '';

    if ((t.char === 'ن' || t.char === 'م') && hasShaddah) {
      color = TAJWEED_COLORS.ghunnah;
      rule = 'Ghunnah';
    } else if (t.char === 'ا' && (t.diacs.includes('\u0653') || (i > 0 && tokens[i - 1].diacs.includes('\u064E')))) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if (t.char === 'و' && i > 0 && tokens[i - 1].diacs.includes('\u064F')) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if (t.char === 'ي' && i > 0 && tokens[i - 1].diacs.includes('\u0650')) {
      color = TAJWEED_COLORS.madd;
      rule = 'Madd';
    } else if ((t.char === 'ن' && hasSukun) || hasTanween) {
      if (i + 1 < tokens.length) {
        const next = tokens[i + 1].char;
        if (IDGHAM_LETTERS.includes(next)) {
          color = TAJWEED_COLORS.idgham;
          rule = 'Idgham';
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
  const spans = useMemo(() => scanTajweed(text), [text]);
  const [labelText, setLabelText] = useState<string | null>(null);
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0 });
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLongPress = (rule: string, event: any) => {
    if (!showLabels || !rule) return;
    const { pageX, pageY } = event.nativeEvent;
    setLabelText(rule);
    setLabelPos({ x: pageX, y: pageY });
  };

  const dismissLabel = () => setLabelText(null);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize, color: defaultColor }]} textBreakStrategy="highQuality">
        {spans.map((span, idx) => {
          if (!span.color) {
            return (
              <Text key={idx} style={{ color: defaultColor, fontSize }}>
                {span.text}
              </Text>
            );
          }
          return (
            <Text
              key={idx}
              style={{ color: span.color, fontSize, fontWeight: '600' }}
              onLongPress={(e) => handleLongPress(span.rule, e)}
            >
              {span.text}
            </Text>
          );
        })}
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
