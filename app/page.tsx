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
  horses: { name: string };
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
        horses ( name )
      `)
      .eq('race_key', race.race_key);
    if (error) console.error(error);
    else setHorses(data as any[] || []);
    setHorsesLoading(false);
  }

  // 临时预测规则（基于档位、负磅、赔率，越高越好）
  function getPredictionScore(horse: Horse) {
    let score = 0;
    if (horse.draw) score += (20 - horse.draw) * 0.3;   // 档位越内越好
    if (horse.weight) score += (140 - horse.weight) * 0.2; // 负磅越轻越好
    if (horse.win_odds) score += (1 / horse.win_odds) * 50; // 赔率越低越好
    return Math.min(100, Math.max(0, score)).toFixed(1);
  }

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🏇 香港赛马预测</h1>
      <div className="flex gap-8">
        {/* 左侧比赛列表 */}
        <div className="w-1/3 space-y-2">
          {races.map((race) => (
            <div
              key={race.race_key}
              onClick={() => handleSelectRace(race)}
              className={`cursor-pointer border rounded p-4 shadow-sm hover:bg-gray-50 ${selectedRace?.race_key === race.race_key ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <div className="font-semibold">
                {race.race_date} {race.venue} {race.distance}米
              </div>
              <div className="text-sm text-gray-600">赛道状况: {race.going}</div>
            </div>
          ))}
        </div>

        {/* 右侧马匹列表 */}
        <div className="w-2/3">
          {selectedRace && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {selectedRace.race_date} {selectedRace.venue} {selectedRace.distance}米
              </h2>
              {horsesLoading ? (
                <p>加载马匹中...</p>
              ) : (
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">马名</th>
                      <th className="border p-2">骑师</th>
                      <th className="border p-2">负磅</th>
                      <th className="border p-2">档位</th>
                      <th className="border p-2">赔率</th>
                      <th className="border p-2">预测分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.map((horse) => (
                      <tr key={horse.id}>
                        <td className="border p-2">{horse.horses?.name || horse.horse_id}</td>
                        <td className="border p-2">{horse.jockey}</td>
                        <td className="border p-2">{horse.weight}</td>
                        <td className="border p-2">{horse.draw}</td>
                        <td className="border p-2">{horse.win_odds}</td>
                        <td className="border p-2 font-bold text-blue-600">{getPredictionScore(horse)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
