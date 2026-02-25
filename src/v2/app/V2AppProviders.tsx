import type { ReactNode } from 'react';
import { CatalogProvider } from '../context/CatalogContext';
import { LayerProvider } from '../context/LayerContext';
import { MapProvider } from '../context/MapContext';
import { INaturalistFilterProvider } from '../context/INaturalistFilterContext';
import { DendraProvider } from '../context/DendraContext';
import { AnimlFilterProvider } from '../context/AnimlFilterContext';
import { TNCArcGISProvider } from '../context/TNCArcGISContext';
import { DataOneFilterProvider } from '../context/DataOneFilterContext';
import { CalFloraFilterProvider } from '../context/CalFloraFilterContext';
import { DroneDeployProvider } from '../context/DroneDeployContext';
import { GBIFFilterProvider } from '../context/GBIFFilterContext';
import { MotusFilterProvider } from '../context/MotusFilterContext';

type V2AppProvidersProps = {
  children: ReactNode;
};

export function V2AppProviders({ children }: V2AppProvidersProps) {
  return (
    <CatalogProvider>
      <LayerProvider>
        <MapProvider>
          <INaturalistFilterProvider>
            <DendraProvider>
              <AnimlFilterProvider>
                <TNCArcGISProvider>
                  <DataOneFilterProvider>
                    <CalFloraFilterProvider>
                      <GBIFFilterProvider>
                        <MotusFilterProvider>
                          <DroneDeployProvider>{children}</DroneDeployProvider>
                        </MotusFilterProvider>
                      </GBIFFilterProvider>
                    </CalFloraFilterProvider>
                  </DataOneFilterProvider>
                </TNCArcGISProvider>
              </AnimlFilterProvider>
            </DendraProvider>
          </INaturalistFilterProvider>
        </MapProvider>
      </LayerProvider>
    </CatalogProvider>
  );
}
