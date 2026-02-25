import { BarChart3 } from 'lucide-react';

export function StationChartHintCard() {
  return (
    <div
      id="dendra-chart-hint"
      className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-center"
    >
      <BarChart3 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
      <p className="text-xs text-teal-700">
        Click <strong>View Chart</strong> on any datastream to see the interactive
        time series on the map panel below.
      </p>
    </div>
  );
}
