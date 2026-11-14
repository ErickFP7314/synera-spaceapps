import type { EnvironmentType } from '../models/types.ts';

export interface EnvironmentConfig {
  id: EnvironmentType;
  displayName: string;
  gravityG: number;
  nominalRadiationUSvDay: number;
  missionRiskNotes: string;
}

export const ENVIRONMENT_PROFILES: Record<EnvironmentType, EnvironmentConfig> = {
  ISS: {
    id: 'ISS',
    displayName: 'Estación Espacial Internacional (LEO)',
    gravityG: 0.0,
    nominalRadiationUSvDay: 300,
    missionRiskNotes: 'Microgravedad continua, desplazamiento de fluidos cefálicos, atenuación magnética terrestre parcial.'
  },
  DeepSpaceTransit: {
    id: 'DeepSpaceTransit',
    displayName: 'Nave de Tránsito Lunar/Marciano (Artemis / Orión)',
    gravityG: 0.0,
    nominalRadiationUSvDay: 1300,
    missionRiskNotes: 'Exposición plena a rayos cósmicos galácticos (GCR) y tormentas solares (SPE), alta latencia de comunicación con Tierra.'
  },
  LunarBase: {
    id: 'LunarBase',
    displayName: 'Campamento Base Lunar (Superficie 1/6 g)',
    gravityG: 0.166,
    nominalRadiationUSvDay: 700,
    missionRiskNotes: 'Gravedad fraccionaria, polvo regolito abrasivo, ciclos térmicos extremos de 14 días terrestres de luz/oscuridad.'
  }
};
