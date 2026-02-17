import { useEffect } from 'react';
import { useDroneDeploy } from '../../../context/DroneDeployContext';
import { DroneDeploySidebar } from './DroneDeploySidebar';

export function DroneBrowseTab() {
  const { warmCache } = useDroneDeploy();

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  return (
    <div id="drone-browse-tab">
      <DroneDeploySidebar />
    </div>
  );
}
