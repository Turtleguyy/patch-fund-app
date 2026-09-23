import { LinkingOptions } from '@react-navigation/native';
import { APP_IDENTITY } from '../config/appIdentity.js';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${APP_IDENTITY.scheme}://`],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              Adjustment: 'adjustment/:childId',
            },
          },
          KidsTab: {
            screens: {
              AddChild: 'add-child',
            },
          },
        },
      },
    },
  },
};
