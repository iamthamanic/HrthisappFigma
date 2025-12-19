/**
 * ============================================
 * ARBEIT SCREEN
 * ============================================
 * Version: 5.0.0 - Factorial-Style Time Tracking
 * Description: Arbeitsverwaltung mit Office/Field/Extern Tabs + Zeiterfassung
 * ============================================
 */

import { useState } from 'react';
import { Building2, Users, Layers } from '../components/icons/BrowoKoIcons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { BrowoKo_TimeClockCard } from '../components/BrowoKo_TimeClockCard';
import { BrowoKo_TimeRecordsList } from '../components/BrowoKo_TimeRecordsList';
import { useTimeClock } from '../hooks/BrowoKo_useTimeClock';

export default function FieldScreen() {
  const [activeTab, setActiveTab] = useState<'office' | 'field' | 'extern'>('office');

  // Time Clock Hook
  const {
    currentStatus,
    timeRecords,
    summary,
    loading,
    clockIn,
    clockOut,
    getElapsedTime,
    filter,
    changeFilter,
  } = useTimeClock();

  // Handle clock in for current tab
  const handleClockIn = async () => {
    await clockIn(activeTab);
  };

  // Handle clock out
  const handleClockOut = async () => {
    await clockOut();
  };

  // Get elapsed time
  const elapsedTime = getElapsedTime();

  return (
    <div className="min-h-screen pt-20 md:pt-6 px-4 md:px-6 pb-20 md:pb-6">
      {/* MAX-WIDTH CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Arbeit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Zeiterfassung und Arbeitsverwaltung
          </p>
        </div>

        {/* Tabs System */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          {/* Responsive TabsList */}
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
              <TabsTrigger value="office" className="flex-shrink-0">
                <Building2 className="w-4 h-4 mr-2" />
                <span>Office</span>
              </TabsTrigger>
              <TabsTrigger value="field" className="flex-shrink-0">
                <Layers className="w-4 h-4 mr-2" />
                <span>Field</span>
              </TabsTrigger>
              <TabsTrigger value="extern" className="flex-shrink-0">
                <Users className="w-4 h-4 mr-2" />
                <span>Extern</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: Office */}
          <TabsContent value="office" className="space-y-6">
            {/* Time Clock Card */}
            <BrowoKo_TimeClockCard
              workType="office"
              isClockedIn={currentStatus.is_clocked_in}
              currentRecord={currentStatus.current_record}
              elapsedTime={elapsedTime}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              loading={loading}
            />

            {/* Time Records List */}
            <BrowoKo_TimeRecordsList
              records={timeRecords}
              summary={summary}
              filter={filter}
              onFilterChange={changeFilter}
              loading={loading}
            />
          </TabsContent>

          {/* TAB: Field */}
          <TabsContent value="field" className="space-y-6">
            {/* Time Clock Card */}
            <BrowoKo_TimeClockCard
              workType="field"
              isClockedIn={currentStatus.is_clocked_in}
              currentRecord={currentStatus.current_record}
              elapsedTime={elapsedTime}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              loading={loading}
            />

            {/* Time Records List */}
            <BrowoKo_TimeRecordsList
              records={timeRecords}
              summary={summary}
              filter={filter}
              onFilterChange={changeFilter}
              loading={loading}
            />
          </TabsContent>

          {/* TAB: Extern */}
          <TabsContent value="extern" className="space-y-6">
            {/* Time Clock Card */}
            <BrowoKo_TimeClockCard
              workType="extern"
              isClockedIn={currentStatus.is_clocked_in}
              currentRecord={currentStatus.current_record}
              elapsedTime={elapsedTime}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              loading={loading}
            />

            {/* Time Records List */}
            <BrowoKo_TimeRecordsList
              records={timeRecords}
              summary={summary}
              filter={filter}
              onFilterChange={changeFilter}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
