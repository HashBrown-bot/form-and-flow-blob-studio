import React, { useEffect, useMemo, useRef, useState } from 'react';
import BlobScene from './BlobScene';
import REFERENCE_DATA from './reference-presets.json';
import './styles.css';

// Version 1 defaults are kept solely to migrate untouched saved presets safely.
const LEGACY_BASE = {
  distort: 0.22, frequency: 2.2, speed: 0.65,
  surfaceDistort: 0.08, surfaceFrequency: 4.2, waves: 3, surfaceSpeed: 0.35,
  size: 1, segments: 112, roughness: 0.25, metalness: 0.8, envIntensity: 1.1,
  clearcoat: 0.45, clearcoatRoughness: 0.18, transmission: 0,
  color: '#d6dcff', gradient: 'iridescent', background: '#8bbbc4', ambient: 0.7,
  light1Color: '#a4eaff', light2Color: '#b881ff', light3Color: '#fff5b1', lightIntensity: 1.5,
  rotationSpeed: 0.16,
};
const LEGACY_PRESETS = [
  { ...LEGACY_BASE },
  { ...LEGACY_BASE, background: '#d9a8b1', color: '#ffd2e9', gradient: 'candy', distort: 0.28, frequency: 1.65, surfaceDistort: 0.07, waves: 4, light1Color: '#ffd5c7', light2Color: '#d787ff', light3Color: '#fff7c8', roughness: 0.3 },
  { ...LEGACY_BASE, background: '#6f8ca5', color: '#a8e7ff', gradient: 'ocean', distort: 0.32, frequency: 2.7, surfaceDistort: 0.1, waves: 5, light1Color: '#91e5ff', light2Color: '#7462ff', light3Color: '#afffed', roughness: 0.19 },
  { ...LEGACY_BASE, background: '#c2a68c', color: '#ffe0c0', gradient: 'sunset', distort: 0.19, frequency: 2.9, surfaceDistort: 0.12, waves: 4, light1Color: '#ffd6a8', light2Color: '#ff91bd', light3Color: '#fff3bc', roughness: 0.3 },
];
const BASE = {
  ...LEGACY_BASE, segments: 192, distort: 0.26, frequency: 2.2, speed: 0.5,
  ridgeStrength: 0.9, foldTwist: 0.35, surfaceDistort: 0.1,
  color: '#f7f9ff', roughness: 0.25, metalness: 0.87, envIntensity: 1.25,
  background: '#89b9c1', rotationSpeed: 0.11, shapeMode: 'fold', materialType: 'metal',
  ior: 1.5, thickness: 0.8, attenuationDistance: 8, attenuationColor: '#ffffff', opacity: 1,
  motionStyle: 'fluid', iridescence: 0,
};
const PRESETS_V3 = [
  { name: 'Fomosphere', note: 'A little out of this world.', values: { ...BASE } },
  { name: 'Daydream', note: 'A softer state of mind.', values: { ...BASE, background: '#dba8bb', color: '#fff3f7', gradient: 'candy', shapeMode: 'flower', distort: 0.26, frequency: 1.55, ridgeStrength: 0.75, foldTwist: 0.65, surfaceDistort: 0.07, waves: 4, light1Color: '#ffd5c7', light2Color: '#d787ff', light3Color: '#fff7c8', roughness: 0.3 } },
  { name: 'Deep Blue', note: 'An object in its own orbit.', values: { ...BASE, background: '#658ba9', color: '#e9f8ff', gradient: 'ocean', shapeMode: 'droplet', distort: 0.38, frequency: 2.7, ridgeStrength: 1.2, foldTwist: -0.1, surfaceDistort: 0.1, waves: 5, light1Color: '#91e5ff', light2Color: '#7462ff', light3Color: '#afffed', roughness: 0.19 } },
  { name: 'Afterglow', note: 'A moment caught in motion.', values: { ...BASE, background: '#c5a38a', color: '#fff0db', gradient: 'sunset', shapeMode: 'pillow', distort: 0.25, frequency: 2.9, ridgeStrength: 0.8, foldTwist: 0.55, surfaceDistort: 0.12, waves: 4, light1Color: '#ffd6a8', light2Color: '#ff91bd', light3Color: '#fff3bc', roughness: 0.3 } },
  { name: 'Discobrain', note: 'A little chaos, in color.', values: { ...BASE, background: '#620cf0', gradient: 'rainbow', shapeMode: 'brain', distort: 0.38, frequency: 4.2, ridgeStrength: 0.6, foldTwist: 0.8, surfaceDistort: 0.25, surfaceFrequency: 8.3, waves: 8, speed: 0.35, light1Color: '#8df9ff', light2Color: '#fa7dce', light3Color: '#ffda72', roughness: 0.16 } },
  { name: 'Moonstone', note: 'A shimmer from somewhere else.', values: { ...BASE, background: '#b7b4ce', gradient: 'pearl', shapeMode: 'star', color: '#ffffff', distort: 0.29, frequency: 1.7, ridgeStrength: 1.2, foldTwist: -0.3, surfaceDistort: 0.06, light1Color: '#ffffff', light2Color: '#d6b9ff', light3Color: '#ddf5ff', roughness: 0.2 } },
  { name: 'Copperfield', note: 'Warm light, liquid metal.', values: { ...BASE, background: '#d67a55', gradient: 'copper', color: '#fff3df', distort: 0.32, frequency: 2.5, ridgeStrength: 1.3, foldTwist: 0.7, surfaceDistort: 0.08, light1Color: '#ffe0aa', light2Color: '#ff95b0', light3Color: '#fff0bd', roughness: 0.22 } },
  { name: 'Mint Condition', note: 'A breath of fresh air.', values: { ...BASE, background: '#8bcbb5', gradient: 'mint', shapeMode: 'flower', color: '#f5fffa', distort: 0.28, frequency: 3.1, ridgeStrength: 0.85, foldTwist: -0.15, surfaceDistort: 0.14, surfaceFrequency: 6.1, waves: 6, light1Color: '#e2ffec', light2Color: '#95e0ff', light3Color: '#f9ffbb', roughness: 0.24 } },
  { name: 'Cyberfly', note: 'A butterfly in liquid light.', values: { ...BASE, shapeMode: 'butterfly', background: '#d29abb', gradient: 'candy', color: '#fff5ff', distort: 0.32, frequency: 2.4, ridgeStrength: 0.8, surfaceDistort: 0.06, roughness: 0.18, light1Color: '#f5eaff', light2Color: '#d584ef', light3Color: '#a5e7ff' } },
  { name: 'Glass Bloom', note: 'Light held in a petal.', values: { ...BASE, shapeMode: 'flower', materialType: 'glass', background: '#758fa4', gradient: 'pearl', color: '#eafaff', metalness: 0, roughness: 0.08, transmission: 0.95, ior: 1.45, thickness: 1.2, attenuationDistance: 5, attenuationColor: '#9ad1fa', opacity: 1, distort: 0.3, ridgeStrength: 0.8, surfaceDistort: 0.03 } },
  { name: 'Jelly Drop', note: 'A soft, translucent drop.', values: { ...BASE, shapeMode: 'droplet', materialType: 'jelly', background: '#cd96b2', gradient: 'candy', color: '#ffe9f5', metalness: 0, roughness: 0.17, transmission: 0.82, ior: 1.35, thickness: 1, attenuationDistance: 4, attenuationColor: '#f49bcc', opacity: 1, distort: 0.3, ridgeStrength: 0.6, surfaceDistort: 0.05 } },
  { name: 'Silver Star', note: 'A little sharp around the edges.', values: { ...BASE, shapeMode: 'star', background: '#8293b4', gradient: 'chrome', color: '#f2f6ff', metalness: 0.95, roughness: 0.13, distort: 0.34, ridgeStrength: 1.2, surfaceDistort: 0.03, light1Color: '#d8eeff', light2Color: '#bca9ff', light3Color: '#fff5d5' } },
  { name: 'Twistertoy', note: 'A spinning stack of soft rings.', values: { ...BASE, shapeMode: 'twister', background: '#96b5a2', gradient: 'aurora', color: '#eafff6', distort: 0.36, frequency: 2.8, ridgeStrength: 1.1, foldTwist: 0.2, surfaceDistort: 0.06, roughness: 0.19 } },
  { name: 'Firefly', note: 'A quiet ember.', values: { ...BASE, shapeMode: 'fold', materialType: 'custom', background: '#d48370', gradient: 'sunset', color: '#ffd4ba', metalness: 0.05, roughness: 0.7, transmission: 0, distort: 0.03, frequency: 1.2, ridgeStrength: 0.2, surfaceDistort: 0.01, light1Color: '#ffe4d5', light2Color: '#ff9c88', light3Color: '#fff0c4' } },
];
const PRESETS_V4 = [
  { name: 'Fomosphere', values: { ...BASE, background: '#89b9c1', color: '#e5eaff', shapeMode: 'fold', gradient: 'iridescent', motionStyle: 'fluid', distort: 0.26, frequency: 2.2, ridgeStrength: 0.9, foldTwist: 0.35, roughness: 0.25, metalness: 0.87, iridescence: 0.25, light1Color: '#c4edff', light2Color: '#bd81ff', light3Color: '#ffe6a6' } },
  { name: 'Discobrain', values: { ...BASE, background: '#640ce5', color: '#eafcff', shapeMode: 'brain', gradient: 'rainbow', motionStyle: 'pulse', distort: 0.38, frequency: 4.2, ridgeStrength: 0.6, surfaceDistort: 0.25, surfaceFrequency: 8.3, waves: 8, speed: 0.35, roughness: 0.16, metalness: 0.85, iridescence: 0.6, light1Color: '#93faff', light2Color: '#fa7dce', light3Color: '#ffe572' } },
  { name: 'Cyberfly', values: { ...BASE, background: '#f1d398', color: '#e4bafa', shapeMode: 'butterfly', gradient: 'candy', motionStyle: 'wobble', distort: 0.32, frequency: 2.4, ridgeStrength: 0.8, surfaceDistort: 0.06, roughness: 0.18, metalness: 0.75, iridescence: 0.45, light1Color: '#ffefce', light2Color: '#d584ef', light3Color: '#a5e7ff' } },
  { name: 'Twistertoy', values: { ...BASE, background: '#9aaeb9', color: '#76a5ca', shapeMode: 'twister', gradient: 'ocean', motionStyle: 'spin', distort: 0.34, frequency: 3.3, ridgeStrength: 1.1, surfaceDistort: 0.04, roughness: 0.2, metalness: 0.9, light1Color: '#bdeeff', light2Color: '#658dff', light3Color: '#d8fff7', rotationSpeed: 0.2 } },
  { name: 'Fungible', values: { ...BASE, background: '#b6e1ca', color: '#8c9ce6', shapeMode: 'fold', gradient: 'aurora', motionStyle: 'breathe', distort: 0.38, frequency: 1.55, ridgeStrength: 1.15, foldTwist: -0.1, surfaceDistort: 0.08, roughness: 0.2, metalness: 0.8, iridescence: 0.3, light1Color: '#a4ffff', light2Color: '#c67cff', light3Color: '#d4fff5' } },
  { name: 'Metalness', values: { ...BASE, background: '#342565', color: '#9e9fd6', shapeMode: 'ripple', gradient: 'foil', motionStyle: 'spin', distort: 0.2, frequency: 4.8, ridgeStrength: 0.8, foldTwist: 0.9, surfaceDistort: 0.04, roughness: 0.17, metalness: 0.98, iridescence: 0.28, light1Color: '#92f5ff', light2Color: '#f28eff', light3Color: '#e8deff', rotationSpeed: 0.14 } },
  { name: 'Metagum', values: { ...BASE, background: '#a4a9d6', color: '#ffe6ec', shapeMode: 'orb', gradient: 'candy', materialType: 'jelly', motionStyle: 'breathe', distort: 0.22, surfaceDistort: 0.15, surfaceFrequency: 8.2, waves: 7, metalness: 0.05, roughness: 0.18, transmission: 0.7, ior: 1.36, thickness: 1.05, attenuationDistance: 4.5, attenuationColor: '#fbbac9', iridescence: 0.2, light1Color: '#a8eaff', light2Color: '#ffb7d0', light3Color: '#ffc598' } },
  { name: 'Firefly', values: { ...BASE, background: '#682d3b', color: '#f1a58a', shapeMode: 'orb', gradient: 'sunset', materialType: 'custom', motionStyle: 'breathe', distort: 0.16, frequency: 1.2, ridgeStrength: 0.2, surfaceDistort: 0.03, roughness: 0.72, metalness: 0.02, clearcoat: 0.05, envIntensity: 0.55, light1Color: '#ffe4c1', light2Color: '#f48672', light3Color: '#ffdd8c', rotationSpeed: 0.06 } },
  { name: 'Slinky', values: { ...BASE, background: '#e8abc2', color: '#d8e7fa', shapeMode: 'ripple', gradient: 'rainbow', motionStyle: 'spin', distort: 0.24, frequency: 4.95, ridgeStrength: 1.15, foldTwist: 0.1, surfaceDistort: 0.05, roughness: 0.15, metalness: 0.85, iridescence: 0.7, light1Color: '#b2f6ff', light2Color: '#ef8bff', light3Color: '#fff3a2', rotationSpeed: 0.17 } },
  { name: 'T-1000', values: { ...BASE, background: '#59646c', color: '#dce6eb', shapeMode: 'organic', gradient: 'chrome', motionStyle: 'fluid', distort: 0.45, frequency: 1.6, surfaceDistort: 0.03, roughness: 0.1, metalness: 1, iridescence: 0.08, envIntensity: 1.5, light1Color: '#f3ffff', light2Color: '#b8b3ff', light3Color: '#d9ffe1' } },
  { name: 'Genesys', values: { ...BASE, background: '#313170', color: '#c1d7fa', shapeMode: 'organic', gradient: 'aurora', materialType: 'glass', motionStyle: 'wobble', distort: 0.4, frequency: 1.8, surfaceDistort: 0.05, roughness: 0.13, metalness: 0.12, transmission: 0.82, ior: 1.48, thickness: 1.15, attenuationDistance: 5, attenuationColor: '#a4e8de', iridescence: 0.45, light1Color: '#83f5e9', light2Color: '#bf8fff', light3Color: '#d4fff2' } },
  { name: 'Protocool', values: { ...BASE, background: '#183c42', color: '#96b6c8', shapeMode: 'flower', gradient: 'foil', motionStyle: 'pulse', distort: 0.4, frequency: 3.35, ridgeStrength: 1.25, foldTwist: 0.45, surfaceDistort: 0.12, roughness: 0.23, metalness: 0.82, iridescence: 0.25, light1Color: '#76dfe0', light2Color: '#e17bd9', light3Color: '#a0eaff' } },
  { name: 'Liquidity', values: { ...BASE, background: '#edc4ad', color: '#a9b0ec', shapeMode: 'fold', gradient: 'iridescent', motionStyle: 'wobble', distort: 0.39, frequency: 3.3, ridgeStrength: 1.1, foldTwist: 0.5, surfaceDistort: 0.13, roughness: 0.17, metalness: 0.83, iridescence: 0.45, light1Color: '#a8dcff', light2Color: '#fa87d3', light3Color: '#ffe1a1' } },
  { name: 'Lipsync', values: { ...BASE, background: '#102762', color: '#ed9eaa', shapeMode: 'pillow', gradient: 'sunset', materialType: 'glass', motionStyle: 'breathe', distort: 0.2, frequency: 1.25, surfaceDistort: 0.03, roughness: 0.1, metalness: 0.08, transmission: 0.8, ior: 1.48, thickness: 1.05, attenuationDistance: 3.5, attenuationColor: '#f191a8', iridescence: 0.35, light1Color: '#aedbff', light2Color: '#f76786', light3Color: '#d9efff', rotationSpeed: 0.07 } },

];

// Retain the old catalogue solely for migrating saved custom settings.
const PRESETS_V5 = ['Fomosphere', 'Discobrain', 'Cyberfly', 'Twistertoy', 'Metagum', 'Slinky', 'T-1000'].map(name => {
  const preset = PRESETS_V4.find(item => item.name === name);
  return name === 'Metagum' ? { ...preset, values: { ...preset.values, motionStyle: 'jelly' } } : preset;
});
const numeric = (p, key, fallback) => p[key] !== undefined && Number.isFinite(Number(p[key])) ? Number(p[key]) : fallback;
const hexColor = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) return '#' + [...value.slice(1)].map(c => c + c).join('');
  const m = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return m ? '#' + m.slice(1).map(n => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('') : fallback;
};
const REFERENCE_PRESETS = REFERENCE_DATA.map(({ name, params: p }) => {
  const previous = PRESETS_V4.find(item => item.name === name)?.values || BASE;
  const lights = {};
  const defaultPositions = [[3, 4, 5], [-4, 1, 3], [0, -3, 4]];
  for (let i = 1; i <= 3; i++) {
    lights[`light${i}Color`] = hexColor(p[`color${i}`], '#ffffff');
    lights[`light${i}Position`] = ['x','y','z'].map((axis, j) => numeric(p, `${axis}${i}`, defaultPositions[i-1][j]));
    lights[`light${i}Intensity`] = numeric(p, `int${i}`, 2);
    lights[`light${i}Angle`] = numeric(p, `angle${i}`, 0.8);
    lights[`light${i}Distance`] = numeric(p, `dist${i}`, 0);
    lights[`light${i}Penumbra`] = numeric(p, `penum${i}`, 1);
    lights[`light${i}Decay`] = numeric(p, `decay${i}`, 0);
  }
  return { name, values: {
    ...BASE, ...lights, shapeMode: 'reference', motionStyle: 'fluid', materialType: 'custom',
    distort: numeric(p, 'distort', .5), frequency: numeric(p, 'frequency', 1.5), speed: numeric(p, 'speed', 1),
    surfaceDistort: numeric(p, 'surfaceDistort', 1), surfaceFrequency: numeric(p, 'surfaceFrequency', 1),
    surfaceSpeed: numeric(p, 'surfaceSpeed', 1), waves: numeric(p, 'numWaves', 4),
    poleAmount: numeric(p, 'poleAmount', 1), surfacePoleAmount: numeric(p, 'surfPoleAmount', 1),
    size: numeric(p, 'scale', 1), segments: numeric(p, 'segments', 256),
    referenceRotation: ['rx','ry','rz'].map(key => numeric(p, key, 0)), rotationSpeed: 0,
    roughness: numeric(p, 'roughness', .14), metalness: numeric(p, 'metalness', 0),
    envIntensity: numeric(p, 'envMap', 1), clearcoat: numeric(p, 'clearcoat', 1),
    clearcoatRoughness: numeric(p, 'ccRougness', .7), transmission: numeric(p, 'transmission', 0),
    ior: numeric(p, 'ior', 1.5), opacity: numeric(p, 'opacity', 1), iridescence: 0,
    gradient: p.gradient || 'iridescent', color: hexColor(p.color, '#ffffff'),
    background: hexColor(p.clearColor, previous.background), ambient: numeric(p, 'ambient', 0), lightIntensity: 1,
  } };
});
const JELLY_V6 = {
  ...BASE, shapeMode: 'jellyDome', motionStyle: 'jelly', materialType: 'jelly',
  background: '#d7cad9', color: '#ffd6df', gradient: 'candy', distort: .35, frequency: 1.5,
  speed: 1.3, surfaceDistort: .14, surfaceFrequency: 3.2, surfaceSpeed: .8, waves: 4,
  poleAmount: 1, surfacePoleAmount: 1, size: 1, segments: 384, metalness: 0, roughness: .14,
  transmission: .85, ior: 1.33, thickness: 1.5, attenuationDistance: 3.5, attenuationColor: '#f59fb9',
  clearcoat: .55, clearcoatRoughness: .1, iridescence: 0, ambient: .8, lightIntensity: 1.7,
  light1Color: '#fff2e7', light2Color: '#ffbcd6', light3Color: '#d9eaff', rotationSpeed: .06,
};
const PRESETS = [...REFERENCE_PRESETS, { name: 'Jelly Bloom', values: {
  ...JELLY_V6, color: '#fff4f7', roughness: .06, transmission: .98, thickness: 1.05,
  attenuationDistance: 8, attenuationColor: '#ffd6e5', clearcoat: .3, clearcoatRoughness: .08,
  envIntensity: .65, ambient: .4, lightIntensity: .9,
} }];
const formatIndex = value => String(value).padStart(2, '0');

const ZH = {
  'Blobmixer home': '返回首页', 'A PLAYGROUND FOR FORM': '一场关于形态的探索',
  'Back to gallery': '返回画廊', 'Make it yours': '开始创作',
  'Animated three-dimensional abstract form': '动态三维抽象造型',
  'Previous blob': '上一个造型', 'Next blob': '下一个造型',
  'DRAG TO EXPLORE': '拖动切换作品', 'Remix this blob': '编辑这个造型',
  'DRAG TO ROTATE': '拖动旋转造型', 'Blob Mixer': '造型编辑器',
  'Blob editor': '造型参数编辑器', 'CURRENT BLOB': '当前造型', 'CURRENT PRESET': '当前预设',
  'Reset': '重置参数', 'Reset Camera': '重置视角',
  'Saved on this device. Switching presets loads their defaults.': '已保存在此设备。切换预设将载入其默认参数。',
  'Local save is unavailable. Switching presets loads their defaults.': '无法在此设备保存。切换预设将载入其默认参数。',
  'Reference form': '原站形态', 'Jelly dome': '果冻形态', 'Shape poles': '形态极区', 'Surface poles': '表面极区',
  'CD': '光盘', 'Cosmic fusion': '宇宙融合', 'Halloween': '万圣节', 'Passion': '热情', 'Pink Floyd': '粉色流光', 'Hologram': '全息', 'Imaginarium': '幻境', 'Sunset vibes': '落日余韵',
  'Shape': '形态', 'The big picture': '整体轮廓', 'Distortion': '变形强度', 'Frequency': '频率',
  'Motion speed': '运动速度', 'Fold strength': '褶皱强度', 'Fold twist': '褶皱扭转',
  'Size': '大小', 'Detail': '细分', 'Surface': '表面', 'The finer details': '表面细节',
  'Waves': '波纹数量', 'Material': '材质', 'The look and feel': '颜色与质感',
  'Roughness': '粗糙度', 'Metalness': '金属度', 'Reflection': '环境反射',
  'Clearcoat': '清漆强度', 'Coat roughness': '清漆粗糙度', 'Transmission': '透光度',
  'Light & color': '灯光与颜色', 'Set the atmosphere': '调整画面氛围',
  'Ambient light': '环境光', 'Spotlight strength': '光源强度', 'Rotation speed': '旋转速度',
  'Shape type': '形态类型', 'Fold': '层叠褶皱', 'Flower': '花瓣', 'Brain': '脑纹', 'Star': '星形', 'Pillow': '柔软枕形', 'Droplet': '水滴', 'Butterfly': '蝴蝶', 'Twister': '环纹陀螺',
  'Motion style': '运动方式', 'Fluid': '流动', 'Breathe': '呼吸', 'Wobble': '摇摆', 'Spin': '旋转', 'Pulse': '脉动', 'Jelly wobble': '果冻弹动',
  'Ripple': '细密波纹', 'Organic': '流动汞形', 'Orb': '柔和球体', 'Iridescence': '虹彩镀膜',
  'Material type': '材质类型', 'Metal': '金属', 'Glass': '透明玻璃', 'Frosted glass': '磨砂玻璃', 'Jelly': '果冻', 'Custom': '自定义',
  'Refractive index': '折射率', 'Thickness': '厚度', 'Absorption distance': '吸收距离', 'Absorption color': '透射颜色', 'Opacity': '整体不透明度',
  'Color palette': '色彩方案', 'Base color': '基础颜色', 'Background': '背景颜色',
  'Light 01': '光源 01', 'Light 02': '光源 02', 'Light 03': '光源 03',
  'Higher detail can be slower on some devices.': '较高的细分可能降低部分设备的流畅度。',
  'TAKE YOUR TIME. PLAY A LITTLE.': '慢慢探索，尽情创作。',
  'Iridescent': '虹彩', 'Candy': '糖果', 'Deep ocean': '深海', 'Sunset': '落日',
  'Backgrounds': '背景', 'Choose background': '选择背景', 'Background presets': '背景预设',
  'Follow artwork': '跟随作品', 'Solid colors': '纯色背景', 'Wallpapers': '灵感纹理',
  'Choose from device': '从设备选择图片', 'Your photo': '自选图片', 'Saved only on this device': '图片仅保存在此设备，不会上传',
  'Image could not be opened. Try JPG, PNG or WebP.': '无法打开该图片，请尝试 JPG、PNG 或 WebP 格式。',
  'Image is too large. Choose a file under 24 MB.': '图片过大，请选择小于 24 MB 的文件。',
  'Saved for this session only.': '此设备无法保存图片，仅本次有效。',
  'Custom color': '自选颜色', 'Silk': '绸光', 'Prism': '棱镜', 'Aurora wallpaper': '流光',
  'Mist': '雾蓝', 'Midnight': '午夜蓝', 'Blush': '玫瑰', 'Sage': '浅绿', 'Sand': '暖沙', 'Black': '深空',
  'Close': '关闭', 'Appearance': '外观',
  'Monochrome': '黑白', 'Chrome': '铬金属', 'Aurora': '极光', 'Foil': '金属箔',
  'Rainbow': '彩虹', 'Pearl': '珍珠', 'Copper': '铜色', 'Mint': '薄荷',
};
const ZH_NAMES = { 'Fomosphere': '幻光之球', 'Discobrain': '迪斯科脑', 'Cyberfly': '霓蝶', 'Twistertoy': '旋纹陀螺', 'Fungible': '幻彩软球', 'Metalness': '金属波纹', 'Metagum': '幻彩软糖', 'Jelly Bloom': '晶莹果冻', 'Firefly': '萤火', 'Slinky': '流光弹簧', 'T-1000': '流动金属', 'Genesys': '创世纪', 'Protocool': '原生花', 'Liquidity': '流动之光', 'Lipsync': '唇光' };
const BACKGROUND_COLORS = [
  { name: 'Mist', color: '#b7cad1' }, { name: 'Midnight', color: '#26334d' },
  { name: 'Blush', color: '#d4b1bd' }, { name: 'Sage', color: '#a3c4b5' },
  { name: 'Sand', color: '#ded0b9' }, { name: 'Black', color: '#151922' },
];
const BACKGROUND_KEY = 'blobmixer.background.v1';
function readBackground() {
  try {
    const value = JSON.parse(window.localStorage.getItem(BACKGROUND_KEY) || 'null');
    if (value?.mode === 'custom') return { mode: 'custom' };
    if (value?.mode === 'solid' && /^#[0-9a-f]{6}$/i.test(value.color)) return value;
  } catch { /* optional browser storage */ }
  return { mode: 'auto' };
}

function backgroundImageStore(action, blob) {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('Unavailable')); return; }
    const open = window.indexedDB.open('blobmixer-backgrounds', 1);
    open.onupgradeneeded = () => { if (!open.result.objectStoreNames.contains('images')) open.result.createObjectStore('images'); };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const tx = db.transaction('images', action === 'put' ? 'readwrite' : 'readonly');
        const request = action === 'put' ? tx.objectStore('images').put(blob, 'custom') : tx.objectStore('images').get('custom');
        let result;
        request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
        tx.onabort = () => { db.close(); reject(tx.error || new Error('Cancelled')); };
      } catch (error) { db.close(); reject(error); }
    };
  });
}
function validateBackgroundImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unsupported image'));
    image.src = url;
  });
}

const LANGUAGE_KEY = 'blobmixer.language';
function readLanguage() { try { return window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; } }


const GROUPS = [
  { id: 'shape', title: 'Shape', subtitle: 'The big picture', controls: [
    ['distort', 'Distortion', 0, 1, 0.01], ['frequency', 'Frequency', 0.01, 5, 0.01],
    ['speed', 'Motion speed', 0, 10, 0.05], ['poleAmount', 'Shape poles', 0, 1, 0.01], ['ridgeStrength', 'Fold strength', 0, 1.5, 0.05],
    ['foldTwist', 'Fold twist', -0.6, 0.9, 0.05], ['size', 'Size', 0.5, 1.5, 0.01],
    ['segments', 'Detail', 64, 512, 8],
  ] },
  { id: 'surface', title: 'Surface', subtitle: 'The finer details', controls: [
    ['surfaceDistort', 'Distortion', 0, 10, 0.01], ['surfaceFrequency', 'Frequency', 0.01, 10, 0.01],
    ['waves', 'Waves', 0, 20, 0.01], ['surfaceSpeed', 'Motion speed', 0, 6, 0.05], ['surfacePoleAmount', 'Surface poles', 0, 1, 0.01],
  ] },
  { id: 'material', title: 'Material', subtitle: 'The look and feel', controls: [
    ['roughness', 'Roughness', 0, 1, 0.01], ['metalness', 'Metalness', 0, 1, 0.01],
    ['envIntensity', 'Reflection', 0, 2.5, 0.05], ['clearcoat', 'Clearcoat', 0, 1, 0.01],
    ['clearcoatRoughness', 'Coat roughness', 0, 1, 0.01], ['iridescence', 'Iridescence', 0, 1, 0.01], ['transmission', 'Transmission', 0, 1, 0.01],
    ['ior', 'Refractive index', 1, 2.5, 0.01], ['thickness', 'Thickness', 0, 3, 0.05],
    ['attenuationDistance', 'Absorption distance', 0.1, 10, 0.1], ['opacity', 'Opacity', 0, 1, 0.01],
  ] },
  { id: 'light', title: 'Light & color', subtitle: 'Set the atmosphere', controls: [
    ['ambient', 'Ambient light', 0, 2, 0.05], ['lightIntensity', 'Spotlight strength', 0, 3, 0.05],
    ['rotationSpeed', 'Rotation speed', 0, 0.7, 0.01],
  ] },
];

const STORAGE_KEY = 'blobmixer.visual-settings.v1';
const SHAPE_NAMES = new Set(['reference', 'jellyDome', 'fold', 'flower', 'brain', 'star', 'pillow', 'droplet', 'butterfly', 'twister', 'ripple', 'organic', 'orb']);
const MOTION_NAMES = new Set(['fluid', 'breathe', 'wobble', 'spin', 'pulse', 'jelly']);
const MATERIAL_NAMES = new Set(['metal', 'glass', 'frosted', 'jelly', 'custom']);
const PALETTE_NAMES = new Set(['iridescent', 'candy', 'ocean', 'sunset', 'mono', 'chrome', 'aurora', 'foil', 'rainbow', 'pearl', 'copper', 'mint', 'deep-ocean', 'cd', 'cosmic-fusion', 'halloween', 'passion', 'pink-floyd', 'hollogram', 'imaginarium', 'sunset-vibes']);
const COLOR_FIELDS = new Set(['color', 'background', 'light1Color', 'light2Color', 'light3Color', 'attenuationColor']);
const NUMBER_RANGES = Object.fromEntries(GROUPS.flatMap(group => group.controls.map(([key, , min, max]) => [key, [min, max]])));

// Treat saved data as untrusted: each recognized value must fit its control.
function readSavedSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || ![1, 2, 3, 4, 5, 6, 7].includes(saved.version) || !Number.isInteger(saved.index) || saved.index < 0 || !saved.params || typeof saved.params !== 'object' || Array.isArray(saved.params)) return null;
    // The previous catalogue used indices; map it by its stable English name
    // before the updated catalogue changes its order or removes an item.
    const oldPreset = saved.version <= 3 ? PRESETS_V3[saved.index] : saved.version === 4 ? PRESETS_V4.find(p => p.name === saved.presetName) : saved.version === 5 ? PRESETS_V5.find(p => p.name === saved.presetName) : null;
    const oldName = saved.version >= 4 ? saved.presetName : oldPreset?.name;
    const found = PRESETS.findIndex(preset => preset.name === oldName);
    const index = found >= 0 ? found : 0;
    const legacy = saved.version === 1 ? LEGACY_PRESETS[saved.index] : saved.version === 6 && saved.presetName === 'Jelly Bloom' ? JELLY_V6 : oldPreset?.values;
    const hasKnownPreset = found >= 0 && legacy;
    const unchanged = hasKnownPreset && Object.keys(saved.params).every(key => !(key in legacy) || saved.params[key] === legacy[key]);
    if (unchanged) return { index, params: { ...PRESETS[index].values } };
    const params = { ...PRESETS[index].values };
    for (const key of Object.keys(params)) {
      const value = saved.params[key];
      if (NUMBER_RANGES[key]) {
        const [min, max] = NUMBER_RANGES[key];
        if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) params[key] = value;
      } else if (COLOR_FIELDS.has(key)) {
        if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) params[key] = value;
      } else if (key === 'shapeMode' && SHAPE_NAMES.has(value)) {
        params[key] = value;
      } else if (key === 'motionStyle' && MOTION_NAMES.has(value)) {
        params[key] = value;
      } else if (key === 'materialType' && MATERIAL_NAMES.has(value)) {
        params[key] = value;
      } else if (key === 'gradient' && PALETTE_NAMES.has(value)) {
        params[key] = value;
      }
    }
    return { index, params };
  } catch {
    return null;
  }
}

function isDifferentFromPreset(params, index) {
  return Object.keys(PRESETS[index].values).some(key => params[key] !== PRESETS[index].values[key]);
}

function Icon({ name, className = '' }) {
  if (name === 'arrow') return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'sliders') return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 17h16M9 4v6M15 14v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
  if (name === 'plus') return <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.2"/></svg>;
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.3"/></svg>;
}

function Slider({ id, label, value, min, max, step, onChange }) {
  const decimalPlaces = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  return <label className="control-row" htmlFor={id}>
    <span className="control-header"><span>{label}</span><span className="control-value">{Number(value).toFixed(decimalPlaces)}</span></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
  </label>;
}

function ColorControl({ id, label, value, onChange }) {
  return <label className="color-control" htmlFor={id}><span>{label}</span><span className="color-picker"><span>{value.toUpperCase()}</span><input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} /></span></label>;
}

function App() {
  const [lang, setLang] = useState(readLanguage);
  const t = text => lang === 'zh' ? (ZH[text] || text) : text;
  const nameOf = item => lang === 'zh' ? (ZH_NAMES[item.name] || item.name) : item.name;
  const [initialSettings] = useState(readSavedSettings);
  const [index, setIndex] = useState(() => initialSettings?.index ?? 0);
  const [params, setParams] = useState(() => initialSettings?.params ?? { ...PRESETS[0].values });
  const [editing, setEditing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [initialBackground] = useState(readBackground);
  const [background, setBackground] = useState(initialBackground);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState(null);
  const [backgroundError, setBackgroundError] = useState('');
  const backgroundPickerRef = useRef(null);
  const customUrlRef = useRef(null);
  const [resetCameraKey, setResetCameraKey] = useState(0);
  const [resetAnimationKey, setResetAnimationKey] = useState(0);
  const [direction, setDirection] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const indexRef = useRef(index);
  const dragStart = useRef(null);
  const wheelState = useRef({ total: 0, last: 0 });
  const [openGroup, setOpenGroup] = useState('');
  const [changed, setChanged] = useState(() => initialSettings ? isDifferentFromPreset(initialSettings.params, initialSettings.index) : false);
  const [storageAvailable, setStorageAvailable] = useState(null);
  const preset = PRESETS[index];
  const backgroundImage = background.mode === 'custom' ? customBackgroundUrl : null;
  const effectiveBackground = background.mode === 'solid' ? background.color : params.background;
  const colorComponents = effectiveBackground.match(/[0-9a-f]{2}/gi)?.map(value => parseInt(value, 16)) || [0, 0, 0];
  const isLightBackground = background.mode === 'custom' || (colorComponents[0] * 0.2126 + colorComponents[1] * 0.7152 + colorComponents[2] * 0.0722) > 150;
  const sceneParams = useMemo(() => ({ ...params, background: effectiveBackground, presetName: preset.name }), [params, effectiveBackground, preset.name]);
  const bgStyle = useMemo(() => ({ '--scene-bg': effectiveBackground }), [effectiveBackground]);

  useEffect(() => {
    let active = true;
    backgroundImageStore('get').then(blob => {
      if (!active) return;
      if (!blob) { if (initialBackground.mode === 'custom') setBackground(current => current.mode === 'custom' ? { mode: 'auto' } : current); return; }
      const url = URL.createObjectURL(blob);
      validateBackgroundImage(url).then(() => {
        if (!active || customUrlRef.current) { URL.revokeObjectURL(url); return; }
        customUrlRef.current = url;
        setCustomBackgroundUrl(url);
      }).catch(() => {
        URL.revokeObjectURL(url);
        if (active && initialBackground.mode === 'custom') { setBackground(current => current.mode === 'custom' ? { mode: 'auto' } : current); setBackgroundError('Image could not be opened. Try JPG, PNG or WebP.'); }
      });
    }).catch(() => { if (active && initialBackground.mode === 'custom') setBackground(current => current.mode === 'custom' ? { mode: 'auto' } : current); });
    return () => { active = false; if (customUrlRef.current) URL.revokeObjectURL(customUrlRef.current); };
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(BACKGROUND_KEY, JSON.stringify(background)); } catch { /* nonpersistent selection still works */ }
  }, [background]);
  const chooseCustomImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setBackgroundError('Image could not be opened. Try JPG, PNG or WebP.'); return; }
    if (file.size > 24 * 1024 * 1024) { setBackgroundError('Image is too large. Choose a file under 24 MB.'); return; }
    const url = URL.createObjectURL(file);
    try { await validateBackgroundImage(url); }
    catch { URL.revokeObjectURL(url); setBackgroundError('Image could not be opened. Try JPG, PNG or WebP.'); return; }
    let stored = true;
    try { await backgroundImageStore('put', file); } catch { stored = false; }
    if (customUrlRef.current) URL.revokeObjectURL(customUrlRef.current);
    customUrlRef.current = url;
    setCustomBackgroundUrl(url);
    setBackground({ mode: 'custom' });
    setBackgroundError(stored ? '' : 'Saved for this session only.');
  };
  useEffect(() => {
    if (!backgroundOpen) return;
    const closeOutside = event => { if (!backgroundPickerRef.current?.contains(event.target)) setBackgroundOpen(false); };
    const closeEscape = event => { if (event.key === 'Escape') setBackgroundOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [backgroundOpen]);

  const selectPreset = (step) => {
    const nextIndex = (indexRef.current + step + PRESETS.length) % PRESETS.length;
    indexRef.current = nextIndex;
    setDirection(step > 0 ? 1 : -1);
    setIndex(nextIndex);
    setParams({ ...PRESETS[nextIndex].values });
    if (PRESETS[nextIndex].name === 'Lipsync') {
      setResetCameraKey(n => n + 1);
      setResetAnimationKey(n => n + 1);
    }
    setChanged(false);
  };
  const enterEditor = () => { setPanelOpen(false); setEditing(true); };
  const onScenePointerDown = e => { if (!editing && e.button === 0) { dragStart.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); } };
  const onScenePointerUp = e => {
    if (!dragStart.current || editing) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) selectPreset(dx < 0 ? 1 : -1);
  };
  const onGalleryWheel = e => {
    if (editing || backgroundOpen) return;
    const now = Date.now();
    if (now - wheelState.current.last < 950) return;
    wheelState.current.total += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(wheelState.current.total) > 70) {
      selectPreset(wheelState.current.total > 0 ? 1 : -1);
      wheelState.current = { total: 0, last: now };
    }
  };
  const materialFields = new Set(['roughness', 'metalness', 'transmission', 'ior', 'thickness', 'attenuationDistance', 'attenuationColor', 'opacity', 'clearcoat', 'clearcoatRoughness', 'iridescence']);
  const update = (key, value) => { setParams(p => ({ ...p, [key]: value, ...(materialFields.has(key) ? { materialType: 'custom' } : {}) })); setChanged(true); };
  const setMaterialType = (type) => {
    if (type === 'custom') { setParams(p => ({ ...p, materialType: 'custom' })); setChanged(true); return; }
    const styles = {
      metal: { iridescence: 0, metalness: 0.9, roughness: 0.2, transmission: 0, ior: 1.5, thickness: 0.8, attenuationDistance: 8, attenuationColor: '#ffffff', opacity: 1, clearcoat: 0.45 },
      glass: { iridescence: 0, metalness: 0, roughness: 0.06, transmission: 0.95, ior: 1.45, thickness: 1, attenuationDistance: 6, attenuationColor: '#d8f2ff', opacity: 1, clearcoat: 0.6 },
      frosted: { iridescence: 0, metalness: 0, roughness: 0.45, transmission: 0.85, ior: 1.45, thickness: 1, attenuationDistance: 6, attenuationColor: '#e4f3ff', opacity: 1, clearcoat: 0.3 },
      jelly: { iridescence: 0, metalness: 0, roughness: 0.06, transmission: 0.98, ior: 1.33, thickness: 1.05, attenuationDistance: 8, attenuationColor: '#ffd6e5', opacity: 1, clearcoat: 0.3 },
    };
    if (!styles[type]) return;
    setParams(p => ({ ...p, ...styles[type], materialType: type }));
    setChanged(true);
  };
  const setShapeMode = (mode) => {
    setParams(p => ({ ...p, shapeMode: mode, ...(mode === 'jellyDome' ? { motionStyle: 'jelly' } : mode === 'reference' ? { motionStyle: 'fluid' } : {}) }));
    setChanged(true);
  };
  const reset = () => {
    setParams({ ...preset.values });
    if (preset.name === 'Lipsync') { setResetCameraKey(n => n + 1); setResetAnimationKey(n => n + 1); }
    setChanged(false);
  };

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = event => setReducedMotion(event.matches);
    setReducedMotion(query.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '造型实验室 — Blob Studio' : 'Form & Flow — Blob Studio';
    try { window.localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* browsing without storage remains usable */ }
  }, [lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 7, index, presetName: preset.name, params }));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [index, params]);

  useEffect(() => {
    const onKey = e => {
      if (editing || backgroundOpen || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight') selectPreset(1);
      if (e.key === 'ArrowLeft') selectPreset(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, editing, backgroundOpen]);

  return <main className={`app ${editing ? 'is-editing' : ''} ${panelOpen && editing ? 'panel-open' : ''} ${isLightBackground ? 'light-background' : ''}`} style={bgStyle} onWheel={onGalleryWheel}>
    <div className="grain" aria-hidden="true" />
    <header className="site-header">
      <a className="wordmark" href="#home" onClick={e => { e.preventDefault(); setEditing(false); }} aria-label={t('Blobmixer home')}>
        <span className="wordmark-symbol" aria-hidden="true">✳</span><span>blob<span className="wordmark-light">mixer</span><span className="wordmark-dot">.</span></span>
      </a>
      <div className="header-center">{editing ? '' : t('A PLAYGROUND FOR FORM')}</div>
      <div className="header-right">
        <div className="background-picker" ref={backgroundPickerRef} onWheel={event => event.stopPropagation()}>
          <button className="background-trigger" aria-expanded={backgroundOpen} aria-controls="background-popover" onClick={() => setBackgroundOpen(open => !open)}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 16l5-5 3 3 2-2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16.5" cy="8" r="1.5" fill="currentColor"/></svg>
            <span>{t('Backgrounds')}</span>
          </button>
          {backgroundOpen && <div className="background-popover" id="background-popover" role="region" aria-label={t('Background presets')}>
            <div className="background-popover-head"><div><span className="background-eyebrow">{t('Appearance')}</span><h2>{t('Choose background')}</h2></div><button className="background-close" aria-label={t('Close')} onClick={() => setBackgroundOpen(false)}><Icon name="close" /></button></div>
            <button className={`background-auto ${background.mode === 'auto' ? 'selected' : ''}`} aria-pressed={background.mode === 'auto'} onClick={() => setBackground({ mode:'auto' })}><span className="auto-preview" style={{background:params.background}} /><span>{t('Follow artwork')}</span><span className="background-check">{background.mode === 'auto' ? '✓' : ''}</span></button>
            <h3>{t('Solid colors')}</h3>
            <div className="background-swatches">{BACKGROUND_COLORS.map(item => <button key={item.color} className={`background-swatch ${background.mode === 'solid' && background.color.toLowerCase() === item.color ? 'selected' : ''}`} aria-label={t(item.name)} title={t(item.name)} aria-pressed={background.mode === 'solid' && background.color.toLowerCase() === item.color} style={{'--swatch':item.color}} onClick={() => setBackground({ mode:'solid', color:item.color })}>{background.mode === 'solid' && background.color.toLowerCase() === item.color && <span>✓</span>}</button>)}
              <label className="background-custom" title={t('Custom color')}><span aria-hidden="true">+</span><input aria-label={t('Custom color')} type="color" value={background.mode === 'solid' ? background.color : params.background} onChange={event => setBackground({mode:'solid',color:event.target.value})}/></label>
            </div>
            <h3>{t('Your photo')}</h3>
            {customBackgroundUrl && <div className="wallpaper-grid"><button className={`wallpaper-option ${background.mode === 'custom' ? 'selected' : ''}`} aria-pressed={background.mode === 'custom'} onClick={() => setBackground({mode:'custom'})}><span className="wallpaper-thumbnail" style={{backgroundImage:`url(${customBackgroundUrl})`}}><span>{background.mode === 'custom' ? '✓' : ''}</span></span><span>{t('Your photo')}</span></button></div>}
            <label className="background-upload"><span aria-hidden="true">＋</span>{t('Choose from device')}<input type="file" accept="image/*" onChange={chooseCustomImage} /></label>
            <p className="background-privacy">{t('Saved only on this device')}</p>
            {backgroundError && <p className="background-error" role="status">{t(backgroundError)}</p>}
          </div>}
        </div>
        <button className="language-switch" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label={lang === 'zh' ? 'Switch language to English' : '切换语言为中文'}><span className={lang === 'zh' ? 'active' : ''}>中</span><span className="language-divider">/</span><span className={lang === 'en' ? 'active' : ''}>EN</span></button>
        <button className="header-action" onClick={() => editing ? setEditing(false) : enterEditor()}>
          {t(editing ? 'Back to gallery' : 'Make it yours')} <Icon name={editing ? 'close' : 'arrow'} />
        </button>
      </div>
    </header>

    <div className="scene-area" aria-label={t('Animated three-dimensional abstract form')} onPointerDown={onScenePointerDown} onPointerUp={onScenePointerUp} onPointerCancel={() => { dragStart.current = null; }}>
      <BlobScene params={sceneParams} backgroundImage={backgroundImage} interactive={editing} resetCameraKey={resetCameraKey} resetAnimationKey={resetAnimationKey} reducedMotion={reducedMotion} ariaLabel={lang === 'zh' ? '动态三维造型' : 'Animated three-dimensional blob'} />
    </div>

    {!editing && <>
      <button className="neighbor-title previous-title" onClick={() => selectPreset(-1)} aria-label={t('Previous blob')}>{nameOf(PRESETS[(index - 1 + PRESETS.length) % PRESETS.length])}</button>
      <button className="neighbor-title next-title" onClick={() => selectPreset(1)} aria-label={t('Next blob')}>{nameOf(PRESETS[(index + 1) % PRESETS.length])}</button>
      <section className={`hero-title ${direction > 0 ? 'from-right' : 'from-left'}`} aria-live="polite">
        <h1 key={`${preset.name}-${lang}`}>{nameOf(preset)}</h1>
      </section>
      <div className="gallery-footer">
        <div className="footer-caption"><span>{t('DRAG TO EXPLORE')}</span></div>
        <button className="remix-button" onClick={enterEditor}><span className="remix-orbit" aria-hidden="true">✧</span><span>{t('Remix this blob')}</span></button>
        <div className="gallery-navigation"><button aria-label={t('Previous blob')} onClick={() => selectPreset(-1)}><Icon name="arrow" className="previous" /></button><span className="nav-count">{formatIndex(index + 1)}<span> / </span>{formatIndex(PRESETS.length)}</span><button aria-label={t('Next blob')} onClick={() => selectPreset(1)}><Icon name="arrow" /></button></div>
      </div>
      <div className="progress-track"><span style={{ width: `${((index + 1) / PRESETS.length) * 100}%` }} /></div>
    </>}

    {editing && <>
      <div className="editor-instruction">{t('DRAG TO ROTATE')}</div>
      <button className="panel-handle" aria-expanded={panelOpen} onClick={() => setPanelOpen(!panelOpen)}>{t('Blob Mixer')} <span>{panelOpen ? '−' : '+'}</span></button>
      {panelOpen && <aside className="editor-panel" aria-label={t('Blob editor')}>
        <div className="panel-head"><div><span className="panel-kicker">{t('CURRENT BLOB')}</span><h2>{t('Blob Mixer')}<span className="accent-dot">.</span></h2></div><span className="panel-index">{formatIndex(index + 1)} / {formatIndex(PRESETS.length)}</span></div>
        <div className="panel-preset"><div><span className="small-label">{t('CURRENT PRESET')}</span><strong>{nameOf(preset)}{changed ? ' *' : ''}</strong></div><button className="reset-button" onClick={reset}>{t('Reset')} <span>↺</span></button></div>
        <p className="save-note" role="status">{t(storageAvailable === false ? 'Local save is unavailable. Switching presets loads their defaults.' : 'Saved on this device. Switching presets loads their defaults.')}</p>
        <div className="groups">
          {GROUPS.map(group => <section className="parameter-group" key={group.id}>
            <button className="group-toggle" aria-expanded={openGroup === group.id} onClick={() => setOpenGroup(openGroup === group.id ? '' : group.id)}><span><strong>{t(group.title)}</strong><small>{t(group.subtitle)}</small></span><span className={`toggle-icon ${openGroup === group.id ? 'open' : ''}`}><Icon name="plus" /></span></button>
            {openGroup === group.id && <div className="group-controls">
              {group.id === 'shape' && <label className="select-control" htmlFor="shapeMode"><span>{t('Shape type')}</span><select id="shapeMode" value={params.shapeMode} onChange={e => setShapeMode(e.target.value)}>{[['reference','Reference form'],['jellyDome','Jelly dome'],['fold','Fold'],['flower','Flower'],['brain','Brain'],['star','Star'],['pillow','Pillow'],['droplet','Droplet'],['butterfly','Butterfly'],['twister','Twister'],['ripple','Ripple'],['organic','Organic'],['orb','Orb']].map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}</select></label>}
              {group.id === 'shape' && !['reference','jellyDome'].includes(params.shapeMode) && <label className="select-control" htmlFor="motionStyle"><span>{t('Motion style')}</span><select id="motionStyle" value={params.motionStyle} onChange={e => update('motionStyle', e.target.value)}>{[['fluid','Fluid'],['breathe','Breathe'],['wobble','Wobble'],['spin','Spin'],['pulse','Pulse'],['jelly','Jelly wobble']].map(([value,label]) => <option value={value} key={value}>{t(label)}</option>)}</select></label>}
              {group.id === 'material' && <>
                <label className="select-control" htmlFor="materialType"><span>{t('Material type')}</span><select id="materialType" value={params.materialType} onChange={e => setMaterialType(e.target.value)}>{[['metal','Metal'],['glass','Glass'],['frosted','Frosted glass'],['jelly','Jelly'],['custom','Custom']].map(([value,label]) => <option value={value} key={value}>{t(label)}</option>)}</select></label>
                <label className="select-control" htmlFor="gradient"><span>{t('Color palette')}</span><select id="gradient" value={params.gradient} onChange={e => update('gradient', e.target.value)}><option value="iridescent">{t('Iridescent')}</option><option value="candy">{t('Candy')}</option><option value="ocean">{t('Deep ocean')}</option><option value="sunset">{t('Sunset')}</option><option value="mono">{t('Monochrome')}</option><option value="chrome">{t('Chrome')}</option><option value="aurora">{t('Aurora')}</option><option value="foil">{t('Foil')}</option><option value="rainbow">{t('Rainbow')}</option><option value="pearl">{t('Pearl')}</option><option value="copper">{t('Copper')}</option><option value="mint">{t('Mint')}</option>{[['deep-ocean','Deep ocean'],['cd','CD'],['cosmic-fusion','Cosmic fusion'],['halloween','Halloween'],['passion','Passion'],['pink-floyd','Pink Floyd'],['hollogram','Hologram'],['imaginarium','Imaginarium'],['sunset-vibes','Sunset vibes']].map(([value,label]) => <option value={value} key={value}>{t(label)}</option>)}</select></label>
                <ColorControl id="base-color" label={t('Base color')} value={params.color} onChange={v => update('color', v)} />
                {params.transmission > 0 && <ColorControl id="attenuationColor" label={t('Absorption color')} value={params.attenuationColor} onChange={v => update('attenuationColor', v)} />}
              </>}
              {group.controls.filter(([key]) => !(['ridgeStrength','foldTwist'].includes(key) && ['reference','jellyDome'].includes(params.shapeMode)) && !(['poleAmount','surfacePoleAmount'].includes(key) && params.shapeMode !== 'reference') && !(params.shapeMode === 'reference' && params.distort === 0 && ['frequency','poleAmount'].includes(key)) && !(params.shapeMode === 'reference' && params.surfaceDistort === 0 && ['surfaceFrequency','waves','surfaceSpeed','surfacePoleAmount'].includes(key)) && !(['ior','thickness','attenuationDistance'].includes(key) && params.transmission === 0)).map(([key, label, min, max, step]) => <Slider key={key} id={key} label={t(label)} value={params[key]} min={min} max={key === 'surfaceDistort' && params.shapeMode !== 'reference' ? Math.max(1, params.surfaceDistort) : max} step={step} onChange={v => update(key, v)} />)}
              {group.id === 'shape' && <p className="detail-note">{t('Higher detail can be slower on some devices.')}</p>}
              {group.id === 'light' && <><div className="color-divider" /><ColorControl id="background" label={t('Background')} value={effectiveBackground} onChange={v => { setBackground({ mode: 'solid', color: v }); update('background', v); }} /><ColorControl id="light1Color" label={t('Light 01')} value={params.light1Color} onChange={v => update('light1Color', v)} /><ColorControl id="light2Color" label={t('Light 02')} value={params.light2Color} onChange={v => update('light2Color', v)} /><ColorControl id="light3Color" label={t('Light 03')} value={params.light3Color} onChange={v => update('light3Color', v)} /></>}
            </div>}
          </section>)}
        </div>
        <div className="panel-actions"><button onClick={() => setResetCameraKey(n => n + 1)}>{t('Reset Camera')}</button></div>
        <div className="panel-bottom"><span>{t('TAKE YOUR TIME. PLAY A LITTLE.')}</span><span>✳</span></div>
      </aside>}
    </>}
  </main>;
}

export default App;
