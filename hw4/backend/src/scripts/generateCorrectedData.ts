import bcrypt from 'bcrypt';
import { Database } from 'better-sqlite3';
import { db, initializeDatabase } from '../config/database';

// 台灣各縣市和區域的座標（修正版）
const taiwanLocations = [
  // 台北市
  { city: '台北市', district: '信義區', lat: 25.0330, lng: 121.5654 },
  { city: '台北市', district: '大安區', lat: 25.0260, lng: 121.5440 },
  { city: '台北市', district: '中正區', lat: 25.0320, lng: 121.5200 },
  { city: '台北市', district: '松山區', lat: 25.0500, lng: 121.5700 },
  { city: '台北市', district: '中山區', lat: 25.0600, lng: 121.5300 },
  { city: '台北市', district: '萬華區', lat: 25.0300, lng: 121.5000 },
  { city: '台北市', district: '士林區', lat: 25.0900, lng: 121.5200 },
  { city: '台北市', district: '北投區', lat: 25.1300, lng: 121.5000 },
  { city: '台北市', district: '內湖區', lat: 25.0700, lng: 121.5900 },
  { city: '台北市', district: '南港區', lat: 25.0500, lng: 121.6000 },
  { city: '台北市', district: '文山區', lat: 24.9900, lng: 121.5700 },
  
  // 新北市
  { city: '新北市', district: '板橋區', lat: 25.0100, lng: 121.4600 },
  { city: '新北市', district: '三重區', lat: 25.0600, lng: 121.4800 },
  { city: '新北市', district: '中和區', lat: 24.9900, lng: 121.5000 },
  { city: '新北市', district: '永和區', lat: 25.0100, lng: 121.5200 },
  { city: '新北市', district: '新莊區', lat: 25.0400, lng: 121.4500 },
  { city: '新北市', district: '新店區', lat: 24.9700, lng: 121.5400 },
  { city: '新北市', district: '樹林區', lat: 24.9900, lng: 121.4200 },
  { city: '新北市', district: '鶯歌區', lat: 24.9600, lng: 121.3500 },
  { city: '新北市', district: '三峽區', lat: 24.9300, lng: 121.3700 },
  { city: '新北市', district: '淡水區', lat: 25.1700, lng: 121.4400 },
  { city: '新北市', district: '汐止區', lat: 25.0700, lng: 121.6500 },
  { city: '新北市', district: '瑞芳區', lat: 25.1100, lng: 121.8100 },
  { city: '新北市', district: '土城區', lat: 24.9700, lng: 121.4400 },
  { city: '新北市', district: '蘆洲區', lat: 25.0800, lng: 121.4600 },
  { city: '新北市', district: '五股區', lat: 25.0800, lng: 121.4400 },
  { city: '新北市', district: '泰山區', lat: 25.0500, lng: 121.4200 },
  { city: '新北市', district: '林口區', lat: 25.0800, lng: 121.3800 },
  { city: '新北市', district: '深坑區', lat: 25.0000, lng: 121.6100 },
  { city: '新北市', district: '石碇區', lat: 24.9900, lng: 121.6500 },
  { city: '新北市', district: '坪林區', lat: 24.9300, lng: 121.7100 },
  { city: '新北市', district: '三芝區', lat: 25.2500, lng: 121.5000 },
  { city: '新北市', district: '石門區', lat: 25.2900, lng: 121.5600 },
  { city: '新北市', district: '八里區', lat: 25.1500, lng: 121.4000 },
  { city: '新北市', district: '平溪區', lat: 25.0200, lng: 121.7400 },
  { city: '新北市', district: '雙溪區', lat: 25.0300, lng: 121.8600 },
  { city: '新北市', district: '貢寮區', lat: 25.0200, lng: 121.9200 },
  { city: '新北市', district: '金山區', lat: 25.2200, lng: 121.6400 },
  { city: '新北市', district: '萬里區', lat: 25.1800, lng: 121.6800 },
  { city: '新北市', district: '烏來區', lat: 24.8600, lng: 121.5500 },

  // 桃園市
  { city: '桃園市', district: '桃園區', lat: 24.9900, lng: 121.3000 },
  { city: '桃園市', district: '中壢區', lat: 24.9600, lng: 121.2200 },
  { city: '桃園市', district: '大溪區', lat: 24.8800, lng: 121.2800 },
  { city: '桃園市', district: '楊梅區', lat: 24.9200, lng: 121.1500 },
  { city: '桃園市', district: '蘆竹區', lat: 25.0500, lng: 121.2800 },
  { city: '桃園市', district: '大園區', lat: 25.0700, lng: 121.2000 },
  { city: '桃園市', district: '龜山區', lat: 25.0000, lng: 121.3500 },
  { city: '桃園市', district: '八德區', lat: 24.9300, lng: 121.3000 },
  { city: '桃園市', district: '龍潭區', lat: 24.8600, lng: 121.2000 },
  { city: '桃園市', district: '平鎮區', lat: 24.9500, lng: 121.2200 },
  { city: '桃園市', district: '新屋區', lat: 24.9700, lng: 121.1000 },
  { city: '桃園市', district: '觀音區', lat: 25.0300, lng: 121.0800 },
  { city: '桃園市', district: '復興區', lat: 24.8200, lng: 121.3500 },

  // 台中市
  { city: '台中市', district: '中區', lat: 24.1400, lng: 120.6800 },
  { city: '台中市', district: '東區', lat: 24.1400, lng: 120.7000 },
  { city: '台中市', district: '南區', lat: 24.1200, lng: 120.6800 },
  { city: '台中市', district: '西區', lat: 24.1400, lng: 120.6600 },
  { city: '台中市', district: '北區', lat: 24.1600, lng: 120.6800 },
  { city: '台中市', district: '西屯區', lat: 24.1600, lng: 120.6400 },
  { city: '台中市', district: '南屯區', lat: 24.1200, lng: 120.6400 },
  { city: '台中市', district: '北屯區', lat: 24.1800, lng: 120.7000 },
  { city: '台中市', district: '豐原區', lat: 24.2500, lng: 120.7200 },
  { city: '台中市', district: '東勢區', lat: 24.2600, lng: 120.8300 },
  { city: '台中市', district: '大甲區', lat: 24.3500, lng: 120.6200 },
  { city: '台中市', district: '清水區', lat: 24.2600, lng: 120.5600 },
  { city: '台中市', district: '沙鹿區', lat: 24.2300, lng: 120.5600 },
  { city: '台中市', district: '梧棲區', lat: 24.2500, lng: 120.5300 },
  { city: '台中市', district: '后里區', lat: 24.3000, lng: 120.7200 },
  { city: '台中市', district: '神岡區', lat: 24.2600, lng: 120.6600 },
  { city: '台中市', district: '潭子區', lat: 24.2100, lng: 120.7000 },
  { city: '台中市', district: '大雅區', lat: 24.2200, lng: 120.6500 },
  { city: '台中市', district: '新社區', lat: 24.2300, lng: 120.8100 },
  { city: '台中市', district: '石岡區', lat: 24.2700, lng: 120.7800 },
  { city: '台中市', district: '外埔區', lat: 24.3300, lng: 120.6500 },
  { city: '台中市', district: '大安區', lat: 24.3500, lng: 120.5900 },
  { city: '台中市', district: '烏日區', lat: 24.1000, lng: 120.6200 },
  { city: '台中市', district: '大肚區', lat: 24.1500, lng: 120.5400 },
  { city: '台中市', district: '龍井區', lat: 24.2000, lng: 120.5400 },
  { city: '台中市', district: '霧峰區', lat: 24.0600, lng: 120.7000 },
  { city: '台中市', district: '太平區', lat: 24.1200, lng: 120.7200 },
  { city: '台中市', district: '大里區', lat: 24.1000, lng: 120.6800 },
  { city: '台中市', district: '和平區', lat: 24.1800, lng: 121.0000 },

  // 台南市
  { city: '台南市', district: '中西區', lat: 23.0000, lng: 120.2000 },
  { city: '台南市', district: '東區', lat: 23.0000, lng: 120.2200 },
  { city: '台南市', district: '南區', lat: 22.9800, lng: 120.2000 },
  { city: '台南市', district: '北區', lat: 23.0200, lng: 120.2000 },
  { city: '台南市', district: '安平區', lat: 23.0000, lng: 120.1600 },
  { city: '台南市', district: '安南區', lat: 23.0200, lng: 120.1800 },
  { city: '台南市', district: '永康區', lat: 23.0300, lng: 120.2400 },
  { city: '台南市', district: '歸仁區', lat: 22.9700, lng: 120.2800 },
  { city: '台南市', district: '新化區', lat: 23.0400, lng: 120.3000 },
  { city: '台南市', district: '左鎮區', lat: 23.0500, lng: 120.4000 },
  { city: '台南市', district: '玉井區', lat: 23.1200, lng: 120.4600 },
  { city: '台南市', district: '楠西區', lat: 23.1800, lng: 120.4800 },
  { city: '台南市', district: '南化區', lat: 23.0400, lng: 120.4800 },
  { city: '台南市', district: '仁德區', lat: 22.9700, lng: 120.2400 },
  { city: '台南市', district: '關廟區', lat: 22.9600, lng: 120.3200 },
  { city: '台南市', district: '龍崎區', lat: 22.9600, lng: 120.3600 },
  { city: '台南市', district: '官田區', lat: 23.1900, lng: 120.3600 },
  { city: '台南市', district: '麻豆區', lat: 23.1800, lng: 120.2400 },
  { city: '台南市', district: '佳里區', lat: 23.1600, lng: 120.1800 },
  { city: '台南市', district: '西港區', lat: 23.1200, lng: 120.2000 },
  { city: '台南市', district: '七股區', lat: 23.1200, lng: 120.1400 },
  { city: '台南市', district: '將軍區', lat: 23.2000, lng: 120.1200 },
  { city: '台南市', district: '學甲區', lat: 23.2400, lng: 120.1800 },
  { city: '台南市', district: '北門區', lat: 23.2800, lng: 120.1200 },
  { city: '台南市', district: '新營區', lat: 23.3100, lng: 120.3200 },
  { city: '台南市', district: '後壁區', lat: 23.3600, lng: 120.3600 },
  { city: '台南市', district: '白河區', lat: 23.3500, lng: 120.4200 },
  { city: '台南市', district: '東山區', lat: 23.3200, lng: 120.4400 },
  { city: '台南市', district: '六甲區', lat: 23.2300, lng: 120.3600 },
  { city: '台南市', district: '下營區', lat: 23.2300, lng: 120.2600 },
  { city: '台南市', district: '柳營區', lat: 23.2800, lng: 120.3000 },
  { city: '台南市', district: '鹽水區', lat: 23.3200, lng: 120.2600 },
  { city: '台南市', district: '善化區', lat: 23.1300, lng: 120.3000 },
  { city: '台南市', district: '大內區', lat: 23.1200, lng: 120.3600 },
  { city: '台南市', district: '山上區', lat: 23.1000, lng: 120.3600 },
  { city: '台南市', district: '新市區', lat: 23.0800, lng: 120.3000 },
  { city: '台南市', district: '安定區', lat: 23.1200, lng: 120.2400 },

  // 高雄市
  { city: '高雄市', district: '新興區', lat: 22.6300, lng: 120.3000 },
  { city: '高雄市', district: '前金區', lat: 22.6300, lng: 120.2900 },
  { city: '高雄市', district: '苓雅區', lat: 22.6200, lng: 120.3200 },
  { city: '高雄市', district: '鹽埕區', lat: 22.6200, lng: 120.2800 },
  { city: '高雄市', district: '鼓山區', lat: 22.6200, lng: 120.2700 },
  { city: '高雄市', district: '旗津區', lat: 22.6100, lng: 120.2600 },
  { city: '高雄市', district: '前鎮區', lat: 22.6000, lng: 120.3100 },
  { city: '高雄市', district: '三民區', lat: 22.6400, lng: 120.3200 },
  { city: '高雄市', district: '楠梓區', lat: 22.7300, lng: 120.3200 },
  { city: '高雄市', district: '小港區', lat: 22.5700, lng: 120.3500 },
  { city: '高雄市', district: '左營區', lat: 22.6800, lng: 120.2900 },
  { city: '高雄市', district: '仁武區', lat: 22.7000, lng: 120.3500 },
  { city: '高雄市', district: '大社區', lat: 22.7300, lng: 120.3600 },
  { city: '高雄市', district: '東沙群島', lat: 20.7000, lng: 116.7000 },
  { city: '高雄市', district: '南沙群島', lat: 10.3800, lng: 114.3600 },
  { city: '高雄市', district: '岡山區', lat: 22.7900, lng: 120.3000 },
  { city: '高雄市', district: '路竹區', lat: 22.8600, lng: 120.2600 },
  { city: '高雄市', district: '阿蓮區', lat: 22.8800, lng: 120.3200 },
  { city: '高雄市', district: '田寮區', lat: 22.8600, lng: 120.3600 },
  { city: '高雄市', district: '燕巢區', lat: 22.7900, lng: 120.3600 },
  { city: '高雄市', district: '橋頭區', lat: 22.7600, lng: 120.3000 },
  { city: '高雄市', district: '梓官區', lat: 22.7600, lng: 120.2500 },
  { city: '高雄市', district: '彌陀區', lat: 22.7800, lng: 120.2400 },
  { city: '高雄市', district: '永安區', lat: 22.8200, lng: 120.2200 },
  { city: '高雄市', district: '湖內區', lat: 22.9000, lng: 120.2200 },
  { city: '高雄市', district: '鳳山區', lat: 22.6200, lng: 120.3500 },
  { city: '高雄市', district: '大寮區', lat: 22.6000, lng: 120.4000 },
  { city: '高雄市', district: '林園區', lat: 22.5000, lng: 120.4000 },
  { city: '高雄市', district: '鳥松區', lat: 22.6500, lng: 120.3600 },
  { city: '高雄市', district: '大樹區', lat: 22.7000, lng: 120.4200 },
  { city: '高雄市', district: '旗山區', lat: 22.8800, lng: 120.4800 },
  { city: '高雄市', district: '美濃區', lat: 22.9000, lng: 120.5500 },
  { city: '高雄市', district: '六龜區', lat: 22.9900, lng: 120.6300 },
  { city: '高雄市', district: '內門區', lat: 22.9500, lng: 120.4700 },
  { city: '高雄市', district: '杉林區', lat: 22.9700, lng: 120.5400 },
  { city: '高雄市', district: '甲仙區', lat: 23.0800, lng: 120.5900 },
  { city: '高雄市', district: '桃源區', lat: 23.1700, lng: 120.7000 },
  { city: '高雄市', district: '那瑪夏區', lat: 23.2200, lng: 120.7000 },
  { city: '高雄市', district: '茂林區', lat: 22.8800, lng: 120.6600 },

  // 基隆市
  { city: '基隆市', district: '仁愛區', lat: 25.1300, lng: 121.7400 },
  { city: '基隆市', district: '信義區', lat: 25.1300, lng: 121.7600 },
  { city: '基隆市', district: '中正區', lat: 25.1300, lng: 121.7200 },
  { city: '基隆市', district: '中山區', lat: 25.1500, lng: 121.7400 },
  { city: '基隆市', district: '安樂區', lat: 25.1200, lng: 121.7200 },
  { city: '基隆市', district: '暖暖區', lat: 25.1000, lng: 121.7400 },
  { city: '基隆市', district: '七堵區', lat: 25.0900, lng: 121.6800 },

  // 新竹市
  { city: '新竹市', district: '東區', lat: 24.8000, lng: 121.0000 },
  { city: '新竹市', district: '北區', lat: 24.8200, lng: 120.9800 },
  { city: '新竹市', district: '香山區', lat: 24.7800, lng: 120.9200 },

  // 新竹縣
  { city: '新竹縣', district: '竹北市', lat: 24.8400, lng: 121.0200 },
  { city: '新竹縣', district: '湖口鄉', lat: 24.9000, lng: 121.0400 },
  { city: '新竹縣', district: '新豐鄉', lat: 24.9000, lng: 120.9800 },
  { city: '新竹縣', district: '新埔鎮', lat: 24.8400, lng: 121.0800 },
  { city: '新竹縣', district: '關西鎮', lat: 24.7900, lng: 121.1800 },
  { city: '新竹縣', district: '芎林鄉', lat: 24.7700, lng: 121.0800 },
  { city: '新竹縣', district: '寶山鄉', lat: 24.7600, lng: 121.0000 },
  { city: '新竹縣', district: '竹東鎮', lat: 24.7400, lng: 121.0800 },
  { city: '新竹縣', district: '五峰鄉', lat: 24.6000, lng: 121.1200 },
  { city: '新竹縣', district: '橫山鄉', lat: 24.7200, lng: 121.1200 },
  { city: '新竹縣', district: '尖石鄉', lat: 24.7000, lng: 121.2000 },
  { city: '新竹縣', district: '北埔鄉', lat: 24.7000, lng: 121.0600 },
  { city: '新竹縣', district: '峨眉鄉', lat: 24.6800, lng: 121.0200 },

  // 苗栗縣
  { city: '苗栗縣', district: '苗栗市', lat: 24.5600, lng: 120.8200 },
  { city: '苗栗縣', district: '苑裡鎮', lat: 24.4400, lng: 120.6500 },
  { city: '苗栗縣', district: '通霄鎮', lat: 24.4900, lng: 120.6800 },
  { city: '苗栗縣', district: '竹南鎮', lat: 24.6900, lng: 120.8700 },
  { city: '苗栗縣', district: '頭份市', lat: 24.6800, lng: 120.9000 },
  { city: '苗栗縣', district: '後龍鎮', lat: 24.6100, lng: 120.7800 },
  { city: '苗栗縣', district: '卓蘭鎮', lat: 24.3100, lng: 120.8200 },
  { city: '苗栗縣', district: '大湖鄉', lat: 24.4200, lng: 120.8600 },
  { city: '苗栗縣', district: '公館鄉', lat: 24.5000, lng: 120.8200 },
  { city: '苗栗縣', district: '銅鑼鄉', lat: 24.4800, lng: 120.7800 },
  { city: '苗栗縣', district: '南庄鄉', lat: 24.6000, lng: 121.0000 },
  { city: '苗栗縣', district: '頭屋鄉', lat: 24.5600, lng: 120.8600 },
  { city: '苗栗縣', district: '三義鄉', lat: 24.4200, lng: 120.7600 },
  { city: '苗栗縣', district: '西湖鄉', lat: 24.5600, lng: 120.7500 },
  { city: '苗栗縣', district: '造橋鄉', lat: 24.6400, lng: 120.8600 },
  { city: '苗栗縣', district: '三灣鄉', lat: 24.6500, lng: 120.9500 },
  { city: '苗栗縣', district: '獅潭鄉', lat: 24.5400, lng: 120.9200 },
  { city: '苗栗縣', district: '泰安鄉', lat: 24.4200, lng: 121.0000 },

  // 彰化縣
  { city: '彰化縣', district: '彰化市', lat: 24.0800, lng: 120.5400 },
  { city: '彰化縣', district: '鹿港鎮', lat: 24.0500, lng: 120.4300 },
  { city: '彰化縣', district: '和美鎮', lat: 24.1000, lng: 120.5000 },
  { city: '彰化縣', district: '線西鄉', lat: 24.1300, lng: 120.4600 },
  { city: '彰化縣', district: '伸港鄉', lat: 24.1500, lng: 120.4800 },
  { city: '彰化縣', district: '福興鄉', lat: 24.0400, lng: 120.4400 },
  { city: '彰化縣', district: '秀水鄉', lat: 24.0300, lng: 120.5000 },
  { city: '彰化縣', district: '花壇鄉', lat: 24.0200, lng: 120.5400 },
  { city: '彰化縣', district: '芬園鄉', lat: 24.0100, lng: 120.6200 },
  { city: '彰化縣', district: '員林市', lat: 23.9600, lng: 120.5700 },
  { city: '彰化縣', district: '溪湖鎮', lat: 23.9600, lng: 120.4800 },
  { city: '彰化縣', district: '田中鎮', lat: 23.8600, lng: 120.5800 },
  { city: '彰化縣', district: '大村鄉', lat: 23.9900, lng: 120.5500 },
  { city: '彰化縣', district: '埔鹽鄉', lat: 24.0000, lng: 120.4600 },
  { city: '彰化縣', district: '埔心鄉', lat: 23.9500, lng: 120.5200 },
  { city: '彰化縣', district: '永靖鄉', lat: 23.9200, lng: 120.5500 },
  { city: '彰化縣', district: '社頭鄉', lat: 23.9000, lng: 120.5800 },
  { city: '彰化縣', district: '二水鄉', lat: 23.8100, lng: 120.6200 },
  { city: '彰化縣', district: '北斗鎮', lat: 23.8700, lng: 120.5200 },
  { city: '彰化縣', district: '二林鎮', lat: 23.9000, lng: 120.3700 },
  { city: '彰化縣', district: '田尾鄉', lat: 23.8900, lng: 120.5200 },
  { city: '彰化縣', district: '埤頭鄉', lat: 23.8800, lng: 120.4600 },
  { city: '彰化縣', district: '芳苑鄉', lat: 23.9000, lng: 120.3200 },
  { city: '彰化縣', district: '大城鄉', lat: 23.8500, lng: 120.3200 },
  { city: '彰化縣', district: '竹塘鄉', lat: 23.8600, lng: 120.4200 },
  { city: '彰化縣', district: '溪州鄉', lat: 23.8500, lng: 120.4900 },

  // 南投縣
  { city: '南投縣', district: '南投市', lat: 23.9100, lng: 120.6800 },
  { city: '南投縣', district: '埔里鎮', lat: 23.9600, lng: 120.9600 },
  { city: '南投縣', district: '草屯鎮', lat: 23.9800, lng: 120.6800 },
  { city: '南投縣', district: '竹山鎮', lat: 23.7600, lng: 120.6800 },
  { city: '南投縣', district: '集集鎮', lat: 23.8300, lng: 120.7800 },
  { city: '南投縣', district: '名間鄉', lat: 23.8600, lng: 120.7000 },
  { city: '南投縣', district: '鹿谷鄉', lat: 23.7500, lng: 120.7500 },
  { city: '南投縣', district: '中寮鄉', lat: 23.8800, lng: 120.7600 },
  { city: '南投縣', district: '魚池鄉', lat: 23.9000, lng: 120.9200 },
  { city: '南投縣', district: '國姓鄉', lat: 24.0300, lng: 120.8500 },
  { city: '南投縣', district: '水里鄉', lat: 23.8100, lng: 120.8500 },
  { city: '南投縣', district: '信義鄉', lat: 23.6000, lng: 120.8500 },
  { city: '南投縣', district: '仁愛鄉', lat: 24.0200, lng: 121.1300 },

  // 雲林縣
  { city: '雲林縣', district: '斗六市', lat: 23.7100, lng: 120.5400 },
  { city: '雲林縣', district: '斗南鎮', lat: 23.6800, lng: 120.4800 },
  { city: '雲林縣', district: '虎尾鎮', lat: 23.7100, lng: 120.4300 },
  { city: '雲林縣', district: '西螺鎮', lat: 23.8000, lng: 120.4600 },
  { city: '雲林縣', district: '土庫鎮', lat: 23.6800, lng: 120.3900 },
  { city: '雲林縣', district: '北港鎮', lat: 23.5700, lng: 120.3000 },
  { city: '雲林縣', district: '古坑鄉', lat: 23.6500, lng: 120.5600 },
  { city: '雲林縣', district: '大埤鄉', lat: 23.6500, lng: 120.4300 },
  { city: '雲林縣', district: '莿桐鄉', lat: 23.7600, lng: 120.5000 },
  { city: '雲林縣', district: '林內鄉', lat: 23.7500, lng: 120.6100 },
  { city: '雲林縣', district: '二崙鄉', lat: 23.7700, lng: 120.4100 },
  { city: '雲林縣', district: '崙背鄉', lat: 23.7600, lng: 120.3500 },
  { city: '雲林縣', district: '麥寮鄉', lat: 23.7500, lng: 120.2500 },
  { city: '雲林縣', district: '東勢鄉', lat: 23.6700, lng: 120.2500 },
  { city: '雲林縣', district: '褒忠鄉', lat: 23.7000, lng: 120.3000 },
  { city: '雲林縣', district: '台西鄉', lat: 23.7000, lng: 120.2000 },
  { city: '雲林縣', district: '元長鄉', lat: 23.6500, lng: 120.3200 },
  { city: '雲林縣', district: '四湖鄉', lat: 23.6300, lng: 120.2200 },
  { city: '雲林縣', district: '口湖鄉', lat: 23.5800, lng: 120.1800 },
  { city: '雲林縣', district: '水林鄉', lat: 23.5700, lng: 120.2500 },

  // 嘉義市
  { city: '嘉義市', district: '東區', lat: 23.4800, lng: 120.4500 },
  { city: '嘉義市', district: '西區', lat: 23.4800, lng: 120.4300 },

  // 嘉義縣
  { city: '嘉義縣', district: '太保市', lat: 23.4600, lng: 120.3300 },
  { city: '嘉義縣', district: '朴子市', lat: 23.4600, lng: 120.2500 },
  { city: '嘉義縣', district: '布袋鎮', lat: 23.3800, lng: 120.1500 },
  { city: '嘉義縣', district: '大林鎮', lat: 23.6000, lng: 120.4500 },
  { city: '嘉義縣', district: '民雄鄉', lat: 23.5500, lng: 120.4300 },
  { city: '嘉義縣', district: '溪口鄉', lat: 23.6000, lng: 120.3900 },
  { city: '嘉義縣', district: '新港鄉', lat: 23.5500, lng: 120.3500 },
  { city: '嘉義縣', district: '六腳鄉', lat: 23.5000, lng: 120.2500 },
  { city: '嘉義縣', district: '東石鄉', lat: 23.4600, lng: 120.1500 },
  { city: '嘉義縣', district: '義竹鄉', lat: 23.3500, lng: 120.2500 },
  { city: '嘉義縣', district: '鹿草鄉', lat: 23.4100, lng: 120.3000 },
  { city: '嘉義縣', district: '水上鄉', lat: 23.4300, lng: 120.4000 },
  { city: '嘉義縣', district: '中埔鄉', lat: 23.4200, lng: 120.5200 },
  { city: '嘉義縣', district: '竹崎鄉', lat: 23.5200, lng: 120.5500 },
  { city: '嘉義縣', district: '梅山鄉', lat: 23.5500, lng: 120.5500 },
  { city: '嘉義縣', district: '番路鄉', lat: 23.4500, lng: 120.5800 },
  { city: '嘉義縣', district: '大埔鄉', lat: 23.3000, lng: 120.6000 },
  { city: '嘉義縣', district: '阿里山鄉', lat: 23.5000, lng: 120.8000 },

  // 屏東縣
  { city: '屏東縣', district: '屏東市', lat: 22.6800, lng: 120.4800 },
  { city: '屏東縣', district: '潮州鎮', lat: 22.5500, lng: 120.5400 },
  { city: '屏東縣', district: '東港鎮', lat: 22.4700, lng: 120.4500 },
  { city: '屏東縣', district: '恆春鎮', lat: 22.0000, lng: 120.7500 },
  { city: '屏東縣', district: '萬丹鄉', lat: 22.5900, lng: 120.4800 },
  { city: '屏東縣', district: '長治鄉', lat: 22.6200, lng: 120.5200 },
  { city: '屏東縣', district: '麟洛鄉', lat: 22.6500, lng: 120.5200 },
  { city: '屏東縣', district: '九如鄉', lat: 22.7200, lng: 120.4800 },
  { city: '屏東縣', district: '里港鄉', lat: 22.7800, lng: 120.5000 },
  { city: '屏東縣', district: '鹽埔鄉', lat: 22.7500, lng: 120.5700 },
  { city: '屏東縣', district: '高樹鄉', lat: 22.8200, lng: 120.6000 },
  { city: '屏東縣', district: '萬巒鄉', lat: 22.5700, lng: 120.5700 },
  { city: '屏東縣', district: '內埔鄉', lat: 22.6200, lng: 120.6000 },
  { city: '屏東縣', district: '竹田鄉', lat: 22.5800, lng: 120.5200 },
  { city: '屏東縣', district: '新埤鄉', lat: 22.4700, lng: 120.5500 },
  { city: '屏東縣', district: '枋寮鄉', lat: 22.3700, lng: 120.6000 },
  { city: '屏東縣', district: '新園鄉', lat: 22.5400, lng: 120.4500 },
  { city: '屏東縣', district: '崁頂鄉', lat: 22.5000, lng: 120.5200 },
  { city: '屏東縣', district: '林邊鄉', lat: 22.4300, lng: 120.5200 },
  { city: '屏東縣', district: '南州鄉', lat: 22.4800, lng: 120.5000 },
  { city: '屏東縣', district: '佳冬鄉', lat: 22.4200, lng: 120.5500 },
  { city: '屏東縣', district: '琉球鄉', lat: 22.3500, lng: 120.3700 },
  { city: '屏東縣', district: '車城鄉', lat: 22.0700, lng: 120.7200 },
  { city: '屏東縣', district: '滿州鄉', lat: 22.0200, lng: 120.8300 },
  { city: '屏東縣', district: '枋山鄉', lat: 22.2600, lng: 120.6500 },
  { city: '屏東縣', district: '三地門鄉', lat: 22.7000, lng: 120.6500 },
  { city: '屏東縣', district: '霧台鄉', lat: 22.7500, lng: 120.7500 },
  { city: '屏東縣', district: '瑪家鄉', lat: 22.6800, lng: 120.6500 },
  { city: '屏東縣', district: '泰武鄉', lat: 22.6000, lng: 120.6500 },
  { city: '屏東縣', district: '來義鄉', lat: 22.5000, lng: 120.6500 },
  { city: '屏東縣', district: '春日鄉', lat: 22.3700, lng: 120.6500 },
  { city: '屏東縣', district: '獅子鄉', lat: 22.2000, lng: 120.7000 },
  { city: '屏東縣', district: '牡丹鄉', lat: 22.1200, lng: 120.8000 },

  // 宜蘭縣
  { city: '宜蘭縣', district: '宜蘭市', lat: 24.7500, lng: 121.7500 },
  { city: '宜蘭縣', district: '頭城鎮', lat: 24.8600, lng: 121.8200 },
  { city: '宜蘭縣', district: '礁溪鄉', lat: 24.8300, lng: 121.7700 },
  { city: '宜蘭縣', district: '壯圍鄉', lat: 24.7500, lng: 121.8000 },
  { city: '宜蘭縣', district: '員山鄉', lat: 24.7500, lng: 121.7200 },
  { city: '宜蘭縣', district: '羅東鎮', lat: 24.6800, lng: 121.7700 },
  { city: '宜蘭縣', district: '三星鄉', lat: 24.6700, lng: 121.6500 },
  { city: '宜蘭縣', district: '大同鄉', lat: 24.5000, lng: 121.5000 },
  { city: '宜蘭縣', district: '五結鄉', lat: 24.6800, lng: 121.8000 },
  { city: '宜蘭縣', district: '冬山鄉', lat: 24.6300, lng: 121.8000 },
  { city: '宜蘭縣', district: '蘇澳鎮', lat: 24.6000, lng: 121.8500 },
  { city: '宜蘭縣', district: '南澳鄉', lat: 24.4600, lng: 121.8000 },

  // 花蓮縣
  { city: '花蓮縣', district: '花蓮市', lat: 23.9700, lng: 121.6000 },
  { city: '花蓮縣', district: '新城鄉', lat: 24.0200, lng: 121.6000 },
  { city: '花蓮縣', district: '太魯閣', lat: 24.1500, lng: 121.6500 },
  { city: '花蓮縣', district: '秀林鄉', lat: 24.1000, lng: 121.6000 },
  { city: '花蓮縣', district: '吉安鄉', lat: 23.9600, lng: 121.5800 },
  { city: '花蓮縣', district: '壽豐鄉', lat: 23.8700, lng: 121.5000 },
  { city: '花蓮縣', district: '鳳林鎮', lat: 23.7500, lng: 121.4500 },
  { city: '花蓮縣', district: '光復鄉', lat: 23.6500, lng: 121.4200 },
  { city: '花蓮縣', district: '豐濱鄉', lat: 23.6000, lng: 121.5000 },
  { city: '花蓮縣', district: '瑞穗鄉', lat: 23.5000, lng: 121.3800 },
  { city: '花蓮縣', district: '玉里鎮', lat: 23.3300, lng: 121.3000 },
  { city: '花蓮縣', district: '卓溪鄉', lat: 23.2000, lng: 121.2000 },
  { city: '花蓮縣', district: '富里鄉', lat: 23.1800, lng: 121.2500 },

  // 台東縣
  { city: '台東縣', district: '台東市', lat: 22.7500, lng: 121.1500 },
  { city: '台東縣', district: '綠島鄉', lat: 22.6700, lng: 121.4800 },
  { city: '台東縣', district: '蘭嶼鄉', lat: 22.0500, lng: 121.5500 },
  { city: '台東縣', district: '延平鄉', lat: 22.9000, lng: 121.0000 },
  { city: '台東縣', district: '卑南鄉', lat: 22.8000, lng: 121.1000 },
  { city: '台東縣', district: '鹿野鄉', lat: 22.9500, lng: 121.1500 },
  { city: '台東縣', district: '關山鎮', lat: 23.0500, lng: 121.1500 },
  { city: '台東縣', district: '海端鄉', lat: 23.1000, lng: 121.0000 },
  { city: '台東縣', district: '池上鄉', lat: 23.1000, lng: 121.2000 },
  { city: '台東縣', district: '東河鄉', lat: 22.9500, lng: 121.3000 },
  { city: '台東縣', district: '成功鎮', lat: 23.1000, lng: 121.3500 },
  { city: '台東縣', district: '長濱鄉', lat: 23.3000, lng: 121.4500 },
  { city: '台東縣', district: '太麻里鄉', lat: 22.6000, lng: 121.0000 },
  { city: '台東縣', district: '金峰鄉', lat: 22.6000, lng: 120.9500 },
  { city: '台東縣', district: '大武鄉', lat: 22.3500, lng: 120.9000 },
  { city: '台東縣', district: '達仁鄉', lat: 22.3000, lng: 120.8500 },

  // 澎湖縣
  { city: '澎湖縣', district: '馬公市', lat: 23.5700, lng: 119.5800 },
  { city: '澎湖縣', district: '西嶼鄉', lat: 23.6000, lng: 119.5000 },
  { city: '澎湖縣', district: '望安鄉', lat: 23.3500, lng: 119.5000 },
  { city: '澎湖縣', district: '七美鄉', lat: 23.2000, lng: 119.4300 },
  { city: '澎湖縣', district: '白沙鄉', lat: 23.6500, lng: 119.6000 },
  { city: '澎湖縣', district: '湖西鄉', lat: 23.6000, lng: 119.6500 },

  // 金門縣
  { city: '金門縣', district: '金城鎮', lat: 24.4200, lng: 118.3200 },
  { city: '金門縣', district: '金湖鎮', lat: 24.4500, lng: 118.4200 },
  { city: '金門縣', district: '金沙鎮', lat: 24.4800, lng: 118.4000 },
  { city: '金門縣', district: '金寧鄉', lat: 24.4500, lng: 118.3500 },
  { city: '金門縣', district: '烈嶼鄉', lat: 24.4000, lng: 118.2000 },
  { city: '金門縣', district: '烏坵鄉', lat: 24.9800, lng: 119.4500 },

  // 連江縣
  { city: '連江縣', district: '南竿鄉', lat: 26.1500, lng: 119.9500 },
  { city: '連江縣', district: '北竿鄉', lat: 26.2200, lng: 119.9800 },
  { city: '連江縣', district: '莒光鄉', lat: 25.9500, lng: 119.9000 },
  { city: '連江縣', district: '東引鄉', lat: 26.3700, lng: 120.4800 }
];

// 房屋類型
const propertyTypes = ['apartment', 'house', 'condo', 'studio', 'townhouse'];

// 房屋狀態
const statuses = ['available', 'rented', 'pending'];

// 生成房東資料
function generateLandlord() {
  const surnames = ['王', '李', '張', '劉', '陳', '楊', '黃', '趙', '周', '吳'];
  const givenNames = ['志明', '淑芬', '建國', '美玲', '家豪', '雅婷', '志強', '淑娟', '文雄', '麗華'];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  const username = surname + givenName + Math.floor(Math.random() * 1000);
  const email = `${username.toLowerCase()}@example.com`;
  
  return {
    username,
    email,
    password: 'Landlord123!@#'
  };
}

// 生成修正的房屋資料（座標和地址對應）
function generateCorrectedListing(landlordId: number) {
  const location = taiwanLocations[Math.floor(Math.random() * taiwanLocations.length)];
  const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // 在選定區域內生成更精確的座標（減少偏移量）
  const lat = location.lat + (Math.random() - 0.5) * 0.005; // 減少到 0.005 度
  const lng = location.lng + (Math.random() - 0.5) * 0.005; // 減少到 0.005 度
  
  // 生成與座標對應的地址
  const streetNumbers = ['1號', '5號', '10號', '15號', '20號', '25號', '30號', '35號', '40號', '45號', '50號', '55號', '60號', '65號', '70號', '75號', '80號', '85號', '90號', '95號', '100號'];
  const streetNames = ['中正路', '中山路', '民族路', '民生路', '民權路', '自由路', '和平路', '建國路', '復興路', '成功路', '勝利路', '光明路', '信義路', '仁愛路', '忠孝路', '四維路', '八德路', '新生路', '重慶路', '南京路'];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  
  // 確保地址包含正確的縣市和區域
  const address = `${location.city}${location.district}${streetName}${streetNumber}`;
  
  // 生成房屋標題
  const titles = [
    `${location.district}精緻${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}溫馨${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}舒適${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}優質${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}全新${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}近捷運${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}交通便利${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}採光佳${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}安靜${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`,
    `${location.district}高樓層${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}`
  ];
  
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  // 生成描述
  const descriptions = [
    `位於${location.district}的優質${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，交通便利，生活機能完善。`,
    `溫馨舒適的${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，採光良好，適合居住。`,
    `全新裝潢的${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，設備齊全，拎包入住。`,
    `近捷運站的${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，通勤便利，投資自住兩相宜。`,
    `安靜的${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，環境清幽，適合需要安靜環境的租客。`,
    `高樓層${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，視野開闊，採光極佳。`,
    `精緻的${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，裝潢新穎，生活便利。`,
    `優質${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : propertyType === 'condo' ? '大樓' : propertyType === 'studio' ? '套房' : '房屋'}，管理完善，安全有保障。`
  ];
  
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // 生成價格（根據地區調整）
  let basePrice = 15000;
  if (location.city === '台北市') {
    basePrice = 25000;
    if (location.district === '信義區' || location.district === '大安區') {
      basePrice = 35000;
    }
  } else if (location.city === '新北市') {
    basePrice = 20000;
  } else if (location.city === '桃園市') {
    basePrice = 18000;
  } else if (location.city === '台中市') {
    basePrice = 16000;
  } else if (location.city === '台南市') {
    basePrice = 14000;
  } else if (location.city === '高雄市') {
    basePrice = 15000;
  }
  
  const price = basePrice + Math.floor(Math.random() * 10000);
  
  // 生成其他屬性
  const bedrooms = Math.floor(Math.random() * 4) + 1;
  const bathrooms = Math.floor(Math.random() * 3) + 1;
  const area_sqft = Math.floor(Math.random() * 20) + 10; // 10-30 坪
  const floor = Math.floor(Math.random() * 20) + 1;
  const contact_phone = `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`;
  const management_fee = Math.floor(Math.random() * 2000) + 500;
  
  // 生成公設
  const allAmenities = [
    'air_conditioning', 'water_dispenser', 'tv', 'chair', 'television', 'sofa',
    'gym', 'terrace', 'emergency_exit', 'camera', 'security', 'management',
    'rooftop', 'near_market', 'rent_subsidy', 'pet_friendly', 'good_lighting',
    'contact_number', 'independent_studio', 'smoking_allowed', 'quiet_area',
    'management_fee', 'utilities_included', 'contact_number', 'floor',
    'near_shopping', 'near_hospital', 'television', 'furnished', 'rooftop', 'concierge'
  ];
  
  const amenityCount = Math.floor(Math.random() * 8) + 3; // 3-10 個公設
  const amenities = allAmenities
    .sort(() => Math.random() - 0.5)
    .slice(0, amenityCount);
  
  return {
    title,
    description,
    address,
    latitude: lat,
    longitude: lng,
    price,
    bedrooms,
    bathrooms,
    area_sqft,
    property_type: propertyType,
    status,
    floor,
    contact_phone,
    management_fee,
    amenities,
    user_id: landlordId
  };
}

async function generateCorrectedData() {
  console.log('🚀 開始生成修正的房屋資料...');
  
  try {
    initializeDatabase();
    
    if (!db) {
      throw new Error('資料庫未初始化');
    }
    
    // 生成房東
    const landlords = [];
    for (let i = 0; i < 50; i++) {
      landlords.push(generateLandlord());
    }
    
    // 插入房東
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const userIds = [];
    for (const landlord of landlords) {
      const hashedPassword = await bcrypt.hash(landlord.password, 10);
      const result = insertUser.run(landlord.username, landlord.email, hashedPassword);
      userIds.push(Number(result.lastInsertRowid));
      console.log(`✅ 已創建房東: ${landlord.username} (ID: ${result.lastInsertRowid})`);
    }
    
    // 生成房屋
    const insertListing = db.prepare(`
      INSERT INTO listings (
        title, description, address, latitude, longitude, price, bedrooms, bathrooms,
        area_sqft, property_type, status, floor, contact_phone, management_fee,
        amenities, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    for (let i = 0; i < 200; i++) {
      const landlordId = userIds[Math.floor(Math.random() * userIds.length)];
      const listing = generateCorrectedListing(landlordId);
      
      const result = insertListing.run(
        listing.title,
        listing.description,
        listing.address,
        listing.latitude,
        listing.longitude,
        listing.price,
        listing.bedrooms,
        listing.bathrooms,
        listing.area_sqft,
        listing.property_type,
        listing.status,
        listing.floor,
        listing.contact_phone,
        listing.management_fee,
        JSON.stringify(listing.amenities),
        listing.user_id
      );
      
      console.log(`✅ 已創建房屋: ${listing.title} (ID: ${result.lastInsertRowid}) - ${listing.address} (${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)})`);
    }
    
    console.log('🎉 修正資料生成完成！');
    console.log(`📊 統計:`);
    console.log(`   - 房東數量: ${landlords.length}`);
    console.log(`   - 房屋數量: 200`);
    console.log(`   - 涵蓋縣市: ${new Set(taiwanLocations.map(l => l.city)).size} 個縣市`);
    console.log(`   - 涵蓋區域: ${taiwanLocations.length} 個區域`);
    console.log(`   - 座標精度: ±0.005 度 (約 ±500 公尺)`);
    
  } catch (error) {
    console.error('❌ 生成修正資料時發生錯誤:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  generateCorrectedData().catch(console.error);
}

export { generateCorrectedData };
