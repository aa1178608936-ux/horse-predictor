'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Race {
  race_key: string;
  race_date: string;
  venue: string;
  distance: number;
  going: string;
}

interface Horse {
  id: number;
  horse_id: string;
  jockey: string;
  weight: number;
  draw: number;
  win_odds: number;
  last_6_runs: string;
  horses: {
    name: string;
    trainer: string;
  };
}

export default function Home() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horsesLoading, setHorsesLoading] = useState(false);

  useEffect(() => {
    async function fetchRaces() {
      const { data, error } = await supabase
        .from('races')
        .select('race_key, race_date, venue, distance, going')
        .order('race_date', { ascending: false })
        .limit(10);
      if (error) console.error(error);
      else setRaces(data || []);
      setLoading(false);
    }
    fetchRaces();
  }, []);

  async function handleSelectRace(race: Race) {
    setSelectedRace(race);
    setHorsesLoading(true);
    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        horse_id,
        jockey,
        weight,
        draw,
        win_odds,
        last_6_runs,
        horses ( name, trainer )
      `)
      .eq('race_key', race.race_key);
    if (error) console.error(error);
    else setHorses(data as any[] || []);
    setHorsesLoading(false);
  }

  // 临时预测规则（基于档位、负磅、赔率）
  function getPredictionScore(horse: Horse) {
    let score = 0;
    if (horse.draw) score += (20 - horse.draw) * 0.3;
    if (horse.weight) score += (140 - horse.weight) * 0.2;
    if (horse.win_odds) score += (1 / horse.win_odds) * 50;
    return Math.min(100, Math.max(0, score)).toFixed(1);
  }

  // 根据最近6场名次生成趋势图标（简单判断最后两场）
  function getTrendIcon(last6: string) {
    if (!last6) return '—';
    const parts = last6.split('/').filter(p => p.trim() !== '');
    if (parts.length < 2) return '—';
    const last = parseInt(parts[parts.length - 1]);
    const prev = parseInt(parts[parts.length - 2]);
    if (last < prev) return '⬆️';   // 进步
    if (last > prev) return '⬇️';   // 退步
    return '➡️';
  }

  if (loading) return <div className="flex justify-center items-center h-screen text-white">加载中...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          🏇 香港赛马预测
        </h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧比赛列表 */}
          <div className="lg:w-1/3 space-y-3">
            {races.map((race) => (
              <div
                key={race.race_key}
                onClick={() => handleSelectRace(race)}
                className={`cursor-pointer p-4 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  selectedRace?.race_key === race.race_key
                    ? 'bg-blue-600/40 border border-blue-400 shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-[1.02]'
                }`}
              >
                <div className="font-semibold text-lg">
                  {race.race_date} · {race.venue} {race.distance}m
                </div>
                <div className="text-sm text-gray-300 mt-1">赛道: {race.going}</div>
              </div>
            ))}
          </div>

          {/* 右侧马匹详情 */}
          <div className="lg:w-2/3">
            {selectedRace ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  📅 {selectedRace.race_date} · {selectedRace.venue} {selectedRace.distance}m
                </h2>
                {horsesLoading ? (
                  <p className="text-center py-8">加载马匹数据中...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-2">马名</th>
                          <th className="text-left py-3 px-2">骑师</th>
                          <th className="text-left py-3 px-2">练马师</th>
                          <th className="text-left py-3 px-2">负磅</th>
                          <th className="text-left py-3 px-2">档位</th>
                          <th className="text-left py-3 px-2">赔率</th>
                          <th className="text-left py-3 px-2">最近6场</th>
                          <th className="text-left py-3 px-2">预测分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horses.map((horse) => (
                          <tr key={horse.id} className="border-b border-white/10 hover:bg-white/5 transition">
                            <td className="py-3 px-2 font-medium">{horse.horses?.name || horse.horse_id}</td>
                            <td className="py-3 px-2">{horse.jockey}</td>
                            <td className="py-3 px-2">{horse.horses?.trainer || '—'}</td>
                            <td className="py-3 px-2">{horse.weight}</td>
                            <td className="py-3 px-2">{horse.draw}</td>
                            <td className="py-3 px-2">{horse.win_odds}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1">
                                <span className="font-mono">{horse.last_6_runs || '—'}</span>
                                <span className="text-sm">{getTrendIcon(horse.last_6_runs)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-bold text-cyan-400">{getPredictionScore(horse)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
                <p className="text-xl text-gray-300">👈 点击左侧比赛，查看参赛马匹与预测分析</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
