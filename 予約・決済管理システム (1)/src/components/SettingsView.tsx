import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, Plus } from 'lucide-react';
import { Location, Staff } from '../types/reservation';

interface SettingsViewProps {
  locations: Location[];
  staffList: Staff[];
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onAddStaff: (name: string) => void;
  onDeleteStaff: (id: string) => void;
}

export function SettingsView({
  locations,
  staffList,
  onAddLocation,
  onDeleteLocation,
  onAddStaff,
  onDeleteStaff,
}: SettingsViewProps) {
  const [newLocation, setNewLocation] = useState('');
  const [newStaff, setNewStaff] = useState('');

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      onAddLocation(newLocation.trim());
      setNewLocation('');
    }
  };

  const handleAddStaff = () => {
    if (newStaff.trim()) {
      onAddStaff(newStaff.trim());
      setNewStaff('');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl text-gray-900">設定</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 拠点管理 */}
        <Card>
          <CardHeader>
            <CardTitle>拠点管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newLocation">新しい拠点</Label>
                <Input
                  id="newLocation"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="拠点名を入力"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                />
              </div>
              <Button onClick={handleAddLocation} className="mt-auto">
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>

            <div className="space-y-2">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">拠点がありません</p>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">{location.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`「${location.name}」を削除しますか？`)) {
                          onDeleteLocation(location.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* スタッフ管理 */}
        <Card>
          <CardHeader>
            <CardTitle>スタッフ管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newStaff">新しいスタッフ</Label>
                <Input
                  id="newStaff"
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  placeholder="スタッフ名を入力"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStaff()}
                />
              </div>
              <Button onClick={handleAddStaff} className="mt-auto">
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>

            <div className="space-y-2">
              {staffList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">スタッフがいません</p>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">{staff.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`「${staff.name}」を削除しますか？`)) {
                          onDeleteStaff(staff.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
