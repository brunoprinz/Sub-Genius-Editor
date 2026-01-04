import { StyleConfig, Subtitle } from '../types';
import { formatTimeASS } from './time';

// Helper to convert HEX to ASS BGR format (&HBBGGRR)
const toAssColor = (hex: string, alpha: number = 0): string => {
  const cleanHex = hex.replace('#', '');
  const r = cleanHex.substring(0, 2);
  const g = cleanHex.substring(2, 4);
  const b = cleanHex.substring(4, 6);
  // Alpha in ASS is 00 (opaque) to FF (transparent), opposite of standard
  // We accept alpha as 0 (opaque) to 255 (transparent)
  const aHex = alpha.toString(16).padStart(2, '0').toUpperCase();
  
  return `&H${aHex}${b}${g}${r}`;
};

export const generateASS = (subtitles: Subtitle[], style: StyleConfig, videoWidth: number, videoHeight: number): string => {
  // Determine alignment code (ASS tags)
  // 2 = Bottom Center, 8 = Top Center, 5 = Center
  let alignment = 2;
  if (style.verticalAlign === 'top') alignment = 8;
  if (style.verticalAlign === 'center') alignment = 5;

  const primaryColor = toAssColor(style.color);
  const outlineColor = toAssColor(style.outlineColor);
  const backColor = toAssColor(style.backgroundColor, 255 - style.backgroundOpacity); // Convert opacity to transparency

  // ASS Header
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${primaryColor},&H000000FF,${outlineColor},${backColor},0,0,0,0,100,100,0,0,1,${style.outlineWidth},0,${alignment},10,10,${style.bottomMargin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = subtitles.map(sub => {
    return `Dialogue: 0,${formatTimeASS(sub.startTime)},${formatTimeASS(sub.endTime)},Default,,0,0,0,,${sub.text}`;
  }).join('\n');

  return header + events;
};
